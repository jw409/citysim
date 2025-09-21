const { chromium } = require('@playwright/test');

async function openPersistentBrowser() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000,
    args: ['--start-maximized']
  });
  const page = await browser.newPage();

  console.log('Opening persistent browser window...');
  await page.goto('http://localhost:5173');

  console.log('Browser window is open. Check for overlapping panels!');
  console.log('Look specifically at top-right corner for toggle button.');
  console.log('Check if any draggable panels are covering it.');

  // Keep browser open for 5 minutes for inspection
  await page.waitForTimeout(300000);

  await browser.close();
}

openPersistentBrowser().catch(console.error);