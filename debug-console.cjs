const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Capture console messages
  const logs = [];
  page.on('console', msg => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });

  // Capture errors
  page.on('pageerror', error => {
    logs.push(`[ERROR] ${error.message}`);
  });

  // Capture network failures
  page.on('requestfailed', request => {
    logs.push(`[NETWORK FAIL] ${request.url()} - ${request.failure().errorText}`);
  });

  try {
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(5000);

    // Check if DeckGL canvas exists
    const canvasExists = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      return canvas ? {
        exists: true,
        width: canvas.width,
        height: canvas.height,
        style: canvas.style.cssText
      } : { exists: false };
    });

    // Check if city model loaded
    const cityModelStatus = await page.evaluate(() => {
      return window.localStorage.getItem('debug-city-model') || 'not found';
    });

    console.log('=== CANVAS STATUS ===');
    console.log(JSON.stringify(canvasExists, null, 2));

    console.log('\n=== CONSOLE LOGS ===');
    logs.forEach(log => console.log(log));

    console.log('\n=== CITY MODEL STATUS ===');
    console.log(cityModelStatus);

  } catch (error) {
    console.log('Script error:', error.message);
  }

  await browser.close();
})();