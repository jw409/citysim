const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(5000);

    console.log('1. Starting simulation...');
    await page.click('text=START SIMULATION');
    await page.waitForTimeout(3000);

    console.log('2. Toggling Show Zones...');
    await page.click('input[type="checkbox"]'); // Show Zones checkbox
    await page.waitForTimeout(1000);

    console.log('3. Taking screenshot with zones...');
    await page.screenshot({ path: 'test-with-zones.png' });

    console.log('4. Trying Overview preset...');
    await page.click('text=Overview');
    await page.waitForTimeout(1000);

    console.log('5. Taking screenshot after Overview...');
    await page.screenshot({ path: 'test-overview-with-zones.png' });

    console.log('6. Trying extreme zoom out...');
    const viewport = await page.locator('canvas').first();
    if (await viewport.isVisible()) {
      const box = await viewport.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width/2, box.y + box.height/2);
        // Extreme zoom out
        for (let i = 0; i < 10; i++) {
          await page.mouse.wheel(0, -500);
          await page.waitForTimeout(100);
        }
      }
    }

    console.log('7. Taking screenshot zoomed way out...');
    await page.screenshot({ path: 'test-extreme-zoom-out.png' });

    console.log('All tests complete!');

  } catch (error) {
    console.log('Script error:', error.message);
  }

  await browser.close();
})();