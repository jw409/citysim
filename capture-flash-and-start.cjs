const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Start rapid capture immediately
    let screenshotCount = 0;
    const captureInterval = setInterval(async () => {
      try {
        await page.screenshot({ path: `flash-${screenshotCount.toString().padStart(3, '0')}.png` });
        screenshotCount++;
      } catch (e) {}
    }, 250); // Even faster capture

    await page.goto('http://localhost:5173');

    // Wait for initial flash
    await page.waitForTimeout(5000);

    // Click START SIMULATION to see if we can stabilize the content
    console.log('Clicking START SIMULATION...');
    await page.click('text=START SIMULATION');

    // Continue capturing
    await page.waitForTimeout(5000);

    clearInterval(captureInterval);

    console.log(`Captured ${screenshotCount} flash screenshots`);

    // Take final screenshot
    await page.screenshot({ path: 'final-after-flash-start.png' });

  } catch (error) {
    console.log('Script error:', error.message);
  }

  await browser.close();
})();