const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Capture every 500ms during loading to catch the flash
    let screenshotCount = 0;
    const captureInterval = setInterval(async () => {
      try {
        await page.screenshot({ path: `loading-${screenshotCount.toString().padStart(3, '0')}.png` });
        console.log(`Captured loading-${screenshotCount.toString().padStart(3, '0')}.png`);
        screenshotCount++;
      } catch (e) {
        // Ignore errors during rapid capture
      }
    }, 500);

    await page.goto('http://localhost:5173');

    // Capture for 10 seconds to catch the loading flash
    await page.waitForTimeout(10000);

    clearInterval(captureInterval);

    // Check for multiple canvases or viewport elements
    const viewportInfo = await page.evaluate(() => {
      const canvases = document.querySelectorAll('canvas');
      const containers = document.querySelectorAll('.visualization-container, [style*="position"], [style*="absolute"]');

      return {
        canvasCount: canvases.length,
        canvases: Array.from(canvases).map(canvas => ({
          width: canvas.width,
          height: canvas.height,
          rect: canvas.getBoundingClientRect(),
          style: canvas.style.cssText,
          parent: canvas.parentElement?.className
        })),
        containers: Array.from(containers).map(el => ({
          className: el.className,
          tagName: el.tagName,
          rect: el.getBoundingClientRect(),
          style: el.style.cssText
        }))
      };
    });

    console.log('\n=== VIEWPORT DEBUG INFO ===');
    console.log(JSON.stringify(viewportInfo, null, 2));

    // Take final screenshot
    await page.screenshot({ path: 'final-capture.png' });
    console.log('Final screenshot: final-capture.png');

  } catch (error) {
    console.log('Script error:', error.message);
  }

  await browser.close();
})();