const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(3000);

    // Start simulation first
    console.log('1. Starting simulation...');
    await page.click('text=START SIMULATION');
    await page.waitForTimeout(2000);

    // Try overview preset
    console.log('2. Clicking Overview preset...');
    await page.click('text=Overview');
    await page.waitForTimeout(1000);

    // Take screenshot
    await page.screenshot({ path: 'test-overview.png' });
    console.log('Screenshot saved: test-overview.png');

    // Try aerial view
    console.log('3. Clicking Aerial preset...');
    await page.click('text=Aerial');
    await page.waitForTimeout(1000);

    // Take screenshot
    await page.screenshot({ path: 'test-aerial.png' });
    console.log('Screenshot saved: test-aerial.png');

    // Try street view
    console.log('4. Clicking Street preset...');
    await page.click('text=Street');
    await page.waitForTimeout(1000);

    // Take screenshot
    await page.screenshot({ path: 'test-street.png' });
    console.log('Screenshot saved: test-street.png');

  } catch (error) {
    console.log('Script error:', error.message);
  }

  await browser.close();
})();