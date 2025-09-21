const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Inject coordinate debugging
  await page.addInitScript(() => {
    window.debugCoords = true;
  });

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('bounds') || text.includes('viewState') || text.includes('Camera') || text.includes('position')) {
      console.log('COORD DEBUG:', text);
    }
  });

  await page.goto('http://localhost:5176');
  await page.waitForTimeout(3000);

  // Force camera to known working coordinates
  await page.evaluate(() => {
    // Try to access camera controls and log current state
    console.log('COORD DEBUG: Attempting to debug camera position...');
    
    // Look for DeckGL instance
    const canvas = document.querySelector('canvas');
    if (canvas) {
      console.log('COORD DEBUG: Canvas found, size:', canvas.width, 'x', canvas.height);
    }
  });

  await page.screenshot({ path: 'camera-debug.png' });
  console.log('Camera debug screenshot saved');

  await browser.close();
})();
