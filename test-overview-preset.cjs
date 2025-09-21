const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(5000);

    // Click Overview preset
    console.log('Clicking Overview preset...');
    await page.click('text=Overview');
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({ path: 'test-overview-result.png' });
    console.log('Screenshot saved: test-overview-result.png');

    // Try different zoom levels
    console.log('Trying manual zoom...');
    const viewport = await page.locator('canvas').first();
    if (await viewport.isVisible()) {
      const box = await viewport.boundingBox();
      if (box) {
        // Scroll to zoom out
        await page.mouse.move(box.x + box.width/2, box.y + box.height/2);
        for (let i = 0; i < 5; i++) {
          await page.mouse.wheel(0, -120); // Zoom out
          await page.waitForTimeout(200);
        }
      }
    }

    await page.screenshot({ path: 'test-zoomed-out-manual.png' });
    console.log('Zoomed out screenshot saved: test-zoomed-out-manual.png');

  } catch (error) {
    console.log('Script error:', error.message);
  }

  await browser.close();
})();