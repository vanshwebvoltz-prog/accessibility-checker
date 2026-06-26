// diagnose.js
// Run this directly: node diagnose.js
// Isolates whether the problem is Puppeteer/Chromium itself, or something
// specific to the Express route / network capture wiring.

const puppeteer = require("puppeteer");

(async () => {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({
    headless: false,
    // no extra flags - testing the most vanilla launch possible on Windows
  });
  console.log("Browser launched. Version:", await browser.version());

  const page = await browser.newPage();
  console.log("Page created.");

  page.on("console", (msg) => console.log("[page console]", msg.type(), msg.text()));
  page.on("requestfailed", (req) =>
    console.log("[request failed]", req.url(), req.failure()?.errorText)
  );

  console.log("Navigating to https://fleetopticsinc.com ...");

  let response;
  try {
    response = await page.goto("https://fleetopticsinc.com", {

      waitUntil: "load",
      timeout: 30000,
    });
  } catch (err) {
    console.error("goto() THREW:", err.message);
  }

  console.log("---- RESULTS ----");
  console.log("response is null?", response === null || response === undefined);
  if (response) {
    console.log("HTTP status:", response.status());
    console.log("response.url():", response.url());
  }
  console.log("page.url():", page.url());

  const title = await page.title();
  console.log("page title:", JSON.stringify(title));

  const bodyText = await page.evaluate(() => document.body?.innerText?.slice(0, 300));
  console.log("body text (first 300 chars):", JSON.stringify(bodyText));

  await page.screenshot({ path: "diagnose-screenshot.png" });
  console.log("Screenshot saved to diagnose-screenshot.png — open it to see what Chromium actually rendered.");

  console.log("---- CONTROL TEST: example.com ----");
  let controlResponse;
  try {
    controlResponse = await page.goto("https://example.com", {
      waitUntil: "load",
      timeout: 30000,
    });
  } catch (err) {
    console.error("control goto() THREW:", err.message);
  }
  console.log("control response is null?", controlResponse === null || controlResponse === undefined);
  console.log("control page.url():", page.url());
  console.log("control page title:", JSON.stringify(await page.title()));

  await browser.close();
})().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});