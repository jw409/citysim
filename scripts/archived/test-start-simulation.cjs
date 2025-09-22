const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(5000);

    console.log('1. Taking screenshot before START SIMULATION...');
    await page.screenshot({ path: 'before-start.png' });

    console.log('2. Clicking START SIMULATION...');
    await page.click('text=START SIMULATION');
    await page.waitForTimeout(3000);

    console.log('3. Taking screenshot after START SIMULATION...');
    await page.screenshot({ path: 'after-start.png' });

    console.log('4. Trying Overview preset...');
    await page.click('text=Overview');
    await page.waitForTimeout(2000);

    console.log('5. Taking screenshot after Overview...');
    await page.screenshot({ path: 'after-overview.png' });

    console.log('All screenshots saved!');

  } catch (error) {
    console.log('Script error:', error.message);
  }

  await browser.close();
})();