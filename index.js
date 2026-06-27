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
const MAX_CRAWL_PAGES = 20;

let browser; // single shared browser instance

// ---------- SSRF protection ----------
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

// ---------- URL normalisation ----------
// Returns true for locale-prefixed paths like /fr/, /de/, /es/ etc.
function isLocaleUrl(rawUrl) {
  try {
    const { pathname } = new URL(rawUrl);
    return /^\/[a-z]{2}(\/|$)/i.test(pathname);
  } catch {
    return false;
  }
}

function normalizePageUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    u.hash = ""; // strip fragment — same content, different anchor
    let str = u.toString();
    if (u.pathname.length > 1 && str.endsWith("/")) str = str.slice(0, -1);
    return str;
  } catch {
    return rawUrl;
  }
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
  const maxPages = Math.min(Math.max(parseInt(req.query.maxPages) || MAX_CRAWL_PAGES, 1), 50);

  if (!url) {
    return res.status(400).json({ success: false, message: "Please provide a URL" });
  }

  let baseOrigin;
  try {
    baseOrigin = new URL(url).origin;
  } catch {
    return res.status(400).json({ success: false, message: "Invalid URL provided" });
  }

  // Pre-serialise custom check functions once — functions can't cross the
  // Node→browser boundary via structured clone so we stringify + reconstruct.
  const serializedChecks = customChecks.map((check) => ({
    ...check,
    evaluate: check.evaluate.toString(),
  }));

  const visited = new Set();
  const queue = [url];
  const pageResults = [];

  try {
    while (queue.length > 0 && pageResults.length < maxPages) {
      const currentUrl = queue.shift();
      const normalizedUrl = normalizePageUrl(currentUrl);

      if (visited.has(normalizedUrl)) continue;
      visited.add(normalizedUrl);

      let page;
      let netCapture;
      const consoleLogs = [];

      try {
        page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });

        netCapture = await attachNetworkCapture(page);

        page.on("console", (msg) => {
          consoleLogs.push({ type: msg.type(), text: msg.text(), location: msg.location() });
        });
        page.on("pageerror", (err) => {
          consoleLogs.push({ type: "pageerror", text: err.message, location: null });
        });

        let response;
        try {
          response = await page.goto(currentUrl, {
            waitUntil: ["domcontentloaded", "networkidle2"],
            timeout: 60000,
          });
        } catch (navError) {
          console.warn(`Skipping ${currentUrl}: ${navError.message}`);
          continue;
        }

        const finalUrl = page.url();
        if (!response || finalUrl === "about:blank") continue;
        if (!response.ok() && response.status() >= 400) continue;

        // Re-anchor baseOrigin to the landing page's actual origin so that
        // http→https or non-www→www redirects don't silently drop all links.
        if (pageResults.length === 0) {
          try { baseOrigin = new URL(finalUrl).origin; } catch {}
        }

        await page.evaluate(axeSource);

        await page.evaluate(
          (checks, rules) => {
            const reconstructedChecks = checks.map((check) => ({
              ...check,
              // eslint-disable-next-line no-new-func
              evaluate: new Function("return (" + check.evaluate + ").apply(this, arguments);"),
            }));
            axe.configure({ checks: reconstructedChecks, rules });
          },
          serializedChecks,
          customRules
        );

        const results = await page.evaluate(async () => axe.run());

        // Only collect links from the homepage (first page) — no recursive crawl.
        // Sub-pages' links are ignored so we audit homepage + its direct children only.
        if (pageResults.length === 0) {
          const newLinks = await page.evaluate((origin) => {
            const hrefs = new Set();
            document.querySelectorAll("a[href]").forEach((a) => {
              try {
                const u = new URL(a.href);
                if (u.origin === origin && !a.href.includes("#")) hrefs.add(u.toString());
              } catch {}
            });
            document.querySelectorAll("form[action]").forEach((f) => {
              if (!f.method || f.method.toLowerCase() === "get") {
                try {
                  const u = new URL(f.action);
                  if (u.origin === origin) hrefs.add(u.toString());
                } catch {}
              }
            });
            return Array.from(hrefs);
          }, baseOrigin);

          for (const link of newLinks) {
            if (isLocaleUrl(link)) continue; // skip /fr/, /de/, /es/ etc. locale variants
            const norm = normalizePageUrl(link);
            if (!visited.has(norm) && !queue.some((q) => normalizePageUrl(q) === norm)) {
              queue.push(link);
            }
          }
        }

        const networkRecords = netCapture.getRecords();
        const networkSummary = netCapture.getSummary(networkRecords);

        pageResults.push({
          url: currentUrl,
          finalUrl,
          accessibility: results,
          network: { summary: networkSummary, requests: networkRecords },
          console: consoleLogs,
        });

      } catch (pageError) {
        console.warn(`Error on ${currentUrl}: ${pageError.message}`);
      } finally {
        if (netCapture) await netCapture.detach();
        if (page) await page.close();
      }
    }

    if (pageResults.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Failed to load the provided URL. The site may be blocking automated browsers or redirecting unexpectedly.",
      });
    }

    fs.mkdirSync(REPORTS_DIR, { recursive: true });

    const timestamp = Date.now();
    const domain = new URL(url).hostname.replace(/^www\./, "");
    const jsonFilename = `${domain}.json`;
    const htmlFilename = `${domain}.html`;

    const combinedReport = {
      requestedUrl: url,
      timestamp,
      pages: pageResults,
    };

    fs.writeFileSync(
      path.join(REPORTS_DIR, jsonFilename),
      JSON.stringify(combinedReport, null, 2)
    );

    const html = buildHtmlReport(combinedReport, CUSTOM_RULE_IDS);
    fs.writeFileSync(path.join(REPORTS_DIR, htmlFilename), html);

    const totalViolations = pageResults.reduce((sum, p) => sum + (p.accessibility.violations || []).length, 0);
    const totalPasses    = pageResults.reduce((sum, p) => sum + (p.accessibility.passes    || []).length, 0);
    const customRuleIdSet = new Set(customRules.map((r) => r.id));
    const totalCustom = pageResults.reduce(
      (sum, p) => sum + (p.accessibility.violations || []).filter((v) => customRuleIdSet.has(v.id)).length,
      0
    );

    res.json({
      success: true,
      pagesScanned: pageResults.length,
      violations: totalViolations,
      customRuleViolations: totalCustom,
      passes: totalPasses,
      report: `/reports/${htmlFilename}`,
      reportJson: `/reports/${jsonFilename}`,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
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
    headless: true,
    ignoreHTTPSErrors: true,
    args: [
      "--headless=new",
      "--window-position=-32000,-32000",
      "--window-size=1280,800",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-software-rasterizer",
      "--no-zygote",
      "--renderer-process-limit=1",
      "--js-flags=--max-old-space-size=512",
      "--disk-cache-size=0",
      "--media-cache-size=0",
      "--force-color-profile=srgb",
      "--disable-background-networking",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-breakpad",
      "--disable-client-side-phishing-detection",
      "--disable-component-update",
      "--disable-default-apps",
      "--disable-domain-reliability",
      "--disable-extensions",
      "--disable-features=AudioServiceOutOfProcess,TranslateUI,Translate",
      "--disable-hang-monitor",
      "--disable-ipc-flooding-protection",
      "--disable-notifications",
      "--disable-popup-blocking",
      "--disable-print-preview",
      "--disable-renderer-backgrounding",
      "--disable-speech-api",
      "--disable-sync",
      "--disable-translate",
      "--disable-webgl",
      "--hide-scrollbars",
      "--metrics-recording-only",
      "--mute-audio",
      "--no-default-browser-check",
      "--no-first-run",
      "--no-pings",
      "--password-store=basic",
      "--use-mock-keychain",
      "--safebrowsing-disable-auto-update",
      "--log-level=3",
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
