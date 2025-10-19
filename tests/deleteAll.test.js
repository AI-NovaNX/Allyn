const puppeteer = require("puppeteer");
const path = require("path");

const appUrl = (file) => `file:${path.resolve(__dirname, "..", "index.html")}`;

describe("Delete All + Undo flow", () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: true });
    page = await browser.newPage();
    await page.goto(appUrl("index.html"));
  }, 20000);

  afterAll(async () => {
    if (browser) await browser.close();
  });

  test("add one todo and delete all then undo", async () => {
    // Add todo
    await page.type("#title", "Test task");
    await page.click("#due");
    // make sure due has value
    const dueVal = await page.$eval("#due", (el) => el.value);
    if (!dueVal) {
      // set to today
      const today = new Date().toISOString().slice(0, 10);
      await page.$eval("#due", (el, v) => (el.value = v), today);
    }
    await page.click(".btn-add");

    // Verify task added
    await page.waitForSelector("tbody tr:not(.empty)");

    // Click delete all and accept confirm
    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });
    await page.click("#delete-all");

    // Wait for toast
    await page.waitForSelector("#toast-container .toast");

    // Click undo
    await page.click("#toast-container .undo");

    // After undo, there should be a task row again
    await page.waitForSelector("tbody tr:not(.empty)");
  }, 30000);
});
