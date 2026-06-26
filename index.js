const express = require("express");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const dns = require("dns").promises;
const net = require("net");
const puppeteer = require("puppeteer");
const axeSource = require("axe-core").source;
const { buildHtmlReport } = require("./reportTemplate");
const { attachNetworkCapture } = require("./networkCapture");
const { customChecks, customRules, CUSTOM_RULE_IDS } = require("./customAxeRules");

const app = express();
const PORT = process.env.PORT || 3000;
const REPORTS_DIR = path.join(__dirname, "reports");

let browser; // single shared browser instance

// ---------- SSRF protection ----------
// NOTE: currently disabled per your edit. Re-enabling this is strongly
// recommended before this is exposed to any untrusted input — see the
// isUrlSafe() function below, just call it before page.goto() again.
async function isUrlSafe(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }

  if (!["http:", "https:"].includes(parsed.protocol)) return false;

  try {
    const { address } = await dns.lookup(parsed.hostname);
    if (
      net.isIP(address) &&
      (address.startsWith("127.") ||
        address.startsWith("10.") ||
        address.startsWith("192.168.") ||
        address.startsWith("169.254.") ||
        /^172\.(1[6-9]|2\d|3[0-1])\./.test(address) ||
        address === "::1")
    ) {
      return false;
    }
  } catch {
    return false;
  }

  return true;
}

// ---------- Cleanup job ----------
function cleanupOldReports() {
  if (!fs.existsSync(REPORTS_DIR)) return;

  const maxAgeMs = 24 * 60 * 60 * 1000;
  const now = Date.now();

  for (const file of fs.readdirSync(REPORTS_DIR)) {
    const filePath = path.join(REPORTS_DIR, file);
    const stats = fs.statSync(filePath);
    if (now - stats.mtimeMs > maxAgeMs) {
      fs.unlinkSync(filePath);
    }
  }
}

// ---------- Routes ----------
app.get("/audit", async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.status(400).json({
      success: false,
      message: "Please provide a URL",
    });
  }

  // const safe = await isUrlSafe(url);
  // if (!safe) {
  //   return res.status(400).json({
  //     success: false,
  //     message: "URL is invalid or points to a disallowed address",
  //   });
  // }

  let page;
  let netCapture;
  const consoleLogs = [];

  try {
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Attach network capture BEFORE navigation so we don't miss early requests
    netCapture = await attachNetworkCapture(page);

    // Capture console output (errors/warnings/logs) alongside network data
    page.on("console", (msg) => {
      consoleLogs.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location(),
      });
    });

    page.on("pageerror", (err) => {
      consoleLogs.push({
        type: "pageerror",
        text: err.message,
        location: null,
      });
    });

    let response;
    try {
      response = await page.goto(url, {
        waitUntil: ["domcontentloaded", "networkidle2"],
        timeout: 60000,
      });
    } catch (navError) {
      return res.status(400).json({
        success: false,
        message: `Failed to load URL: ${navError.message}`,
      });
    }

    // Defensive check: goto() resolving without throwing does NOT guarantee
    // the target page actually loaded. Sites with redirects, anti-bot
    // challenges, or slow/odd load behavior can leave Puppeteer reporting
    // success while the page is still about:blank or an error page.
    const finalUrl = page.url();
    if (!response || finalUrl === "about:blank") {
      return res.status(502).json({
        success: false,
        message: `Navigation did not land on the target page (ended at ${finalUrl}). The site may be blocking automated browsers, redirecting unexpectedly, or timing out silently.`,
      });
    }

    if (!response.ok() && response.status() >= 400) {
      return res.status(502).json({
        success: false,
        message: `Target page responded with HTTP ${response.status()}`,
      });
    }

    // Inject axe-core, then register our custom rules/checks before running.
    //
    // NOTE: functions can't cross the Node -> browser boundary via
    // page.evaluate() args (structured clone strips them). We serialize each
    // check's evaluate function to a string here, then reconstruct it with
    // `new Function(...)` inside the page context.
    await page.evaluate(axeSource);

    const serializedChecks = customChecks.map((check) => ({
      ...check,
      evaluate: check.evaluate.toString(),
    }));

    await page.evaluate(
      (checks, rules) => {
        const reconstructedChecks = checks.map((check) => ({
          ...check,
          // eslint-disable-next-line no-new-func
          evaluate: new Function(
            "return (" + check.evaluate + ").apply(this, arguments);"
          ),
        }));
        axe.configure({ checks: reconstructedChecks, rules });
      },
      serializedChecks,
      customRules
    );

    const results = await page.evaluate(async () => {
      return await axe.run();
    });

    // Pull finalized network records + summary
    const networkRecords = netCapture.getRecords();
    const networkSummary = netCapture.getSummary(networkRecords);

    // Split out which violations came from our custom rules vs. axe's
    // built-in ruleset, so it's obvious in the response what's new
    const customRuleIdSet = new Set(customRules.map((r) => r.id));
    const customViolations = results.violations.filter((v) =>
      customRuleIdSet.has(v.id)
    );
    const builtInViolations = results.violations.filter(
      (v) => !customRuleIdSet.has(v.id)
    );

    fs.mkdirSync(REPORTS_DIR, { recursive: true });

    const timestamp = Date.now();
    const domain = new URL(url).hostname.replace(/^www\./, "");
    const baseName = `${domain}-${timestamp}`;
    const jsonFilename = `${baseName}.json`;
    const htmlFilename = `${baseName}.html`;

    const combinedReport = {
      requestedUrl: url,
      finalUrl,
      timestamp,
      accessibility: results,
      network: {
        summary: networkSummary,
        requests: networkRecords,
      },
      console: consoleLogs,
    };

    fs.writeFileSync(
      path.join(REPORTS_DIR, jsonFilename),
      JSON.stringify(combinedReport, null, 2)
    );

    // Single self-contained HTML report covering accessibility, network,
    // and console data - no CDN dependencies, renders correctly offline.
    const html = buildHtmlReport(combinedReport, CUSTOM_RULE_IDS);

    fs.writeFileSync(path.join(REPORTS_DIR, htmlFilename), html);

    res.json({
      success: true,
      violations: results.violations.length,
      builtInViolations: builtInViolations.length,
      customRuleViolations: customViolations.length,
      customRuleDetails: customViolations.map((v) => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        nodes: v.nodes.length,
      })),
      passes: results.passes.length,
      network: networkSummary,
      consoleErrors: consoleLogs.filter((l) => l.type === "error" || l.type === "pageerror").length,
      report: `/reports/${htmlFilename}`,
      reportJson: `/reports/${jsonFilename}`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  } finally {
    if (netCapture) await netCapture.detach();
    if (page) await page.close();
  }
});

app.get("/health", (req, res) => {
  res.json({ success: true, status: "ok" });
});

// Serve generated reports as static files
app.use("/reports", express.static(REPORTS_DIR));

// ---------- Startup / shutdown ----------
async function start() {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  browser = await puppeteer.launch({
    headless: true,          // Puppeteer 22+ maps this to --headless=new (no visible window)
    ignoreHTTPSErrors: true, // don't bail on self-signed certs on staging sites
    // NOTE: pipe:true is intentionally omitted — Windows has IPC-pipe timing
    //       issues with Chrome that can cause a black window to flash.

    args: [
      // ── Headless guarantee ─────────────────────────────────────────────────
      "--headless=new",                    // belt-and-suspenders: Chrome native headless
      "--window-position=-32000,-32000",   // push any stray window completely off-screen
      "--window-size=1280,800",            // explicit size prevents Chrome guessing

      // ── Sandbox (required in most CI / container environments) ────────────
      "--no-sandbox",
      "--disable-setuid-sandbox",

      // ── Memory & process model ─────────────────────────────────────────────
      "--disable-dev-shm-usage",           // prevents /dev/shm exhaustion on Linux
      "--disable-gpu",                     // no GPU process = no GPU VRAM allocation
      "--disable-software-rasterizer",     // skip the fallback software GL layer
      "--no-zygote",                       // skip the zygote helper process
      "--renderer-process-limit=1",        // cap concurrent renderer processes
      "--js-flags=--max-old-space-size=512", // hard cap V8 heap at 512 MB per page

      // ── Disk / network cache ───────────────────────────────────────────────
      "--disk-cache-size=0",               // no persistent disk cache between audits
      "--media-cache-size=0",

      // ── Color accuracy (critical for contrast ratio calculations) ──────────
      "--force-color-profile=srgb",        // consistent sRGB for getComputedStyle color values

      // ── Unused services (each removed = fewer threads + less RAM) ─────────
      "--disable-background-networking",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-breakpad",                // no crash reporter
      "--disable-client-side-phishing-detection",
      "--disable-component-update",
      "--disable-default-apps",
      "--disable-domain-reliability",
      "--disable-extensions",
      "--disable-features=AudioServiceOutOfProcess,TranslateUI,Translate",
      "--disable-hang-monitor",
      "--disable-ipc-flooding-protection",
      "--disable-notifications",
      "--disable-popup-blocking",          // keep open — some sites redirect via popup
      "--disable-print-preview",
      "--disable-renderer-backgrounding",
      "--disable-speech-api",
      "--disable-sync",
      "--disable-translate",
      "--disable-webgl",                   // WebGL unused for accessibility auditing
      "--hide-scrollbars",
      "--metrics-recording-only",
      "--mute-audio",
      "--no-default-browser-check",
      "--no-first-run",
      "--no-pings",
      "--password-store=basic",
      "--use-mock-keychain",
      "--safebrowsing-disable-auto-update",
      "--log-level=3",                     // only fatal messages in Chrome's own log
    ],
  });

  setInterval(cleanupOldReports, 60 * 60 * 1000); // hourly

  app.listen(PORT, () => {
    console.log(`Audit server listening on port ${PORT}`);
  });
}

async function shutdown() {
  console.log("Shutting down...");
  if (browser) await browser.close();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});