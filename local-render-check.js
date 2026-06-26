// local-render-check.js
const puppeteer = require("puppeteer");

(async () => {
  console.log("Launching visible browser...");
  const browser = await puppeteer.launch({
    headless: false,
    devtools: false,
  });

  const page = await browser.newPage();

  console.log("Navigating to a LOCAL data: URL (no network involved at all)...");
  await page.goto("data:text/html,<h1 style='font-size:60px'>HELLO IF YOU SEE THIS CHROMIUM WORKS</h1>");

  console.log("page.url():", page.url());
  console.log("page title:", JSON.stringify(await page.title()));
  const text = await page.evaluate(() => document.body.innerText);
  console.log("Rendered text:", JSON.stringify(text));

  console.log("");
  console.log(">>> LOOK AT THE BROWSER WINDOW NOW. Does it show the HELLO text? <<<");
  console.log("Leaving window open for 20 seconds...");
  await new Promise((r) => setTimeout(r, 20000));

  await browser.close();
})();