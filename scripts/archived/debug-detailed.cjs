const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const logs = [];
  page.on('console', msg => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });

  try {
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(8000);

    // Get detailed debug info including coordinates
    const debugInfo = await page.evaluate(() => {
      return {
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        canvasInfo: (() => {
          const canvas = document.querySelector('canvas');
          if (!canvas) return { exists: false };
          const rect = canvas.getBoundingClientRect();
          return {
            exists: true,
            width: canvas.width,
            height: canvas.height,
            rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
            style: canvas.style.cssText
          };
        })(),
        visualizationContainer: (() => {
          const container = document.querySelector('.visualization-container');
          if (!container) return { exists: false };
          const rect = container.getBoundingClientRect();
          return {
            exists: true,
            rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
          };
        })()
      };
    });

    console.log('=== DETAILED DEBUG INFO ===');
    console.log(JSON.stringify(debugInfo, null, 2));

    console.log('\n=== BUILDING & CAMERA LOGS ===');
    logs.filter(log =>
      log.includes('🏢') ||
      log.includes('camera') ||
      log.includes('viewState') ||
      log.includes('bounds') ||
      log.includes('zoom') ||
      log.includes('lng') ||
      log.includes('lat')
    ).forEach(log => console.log(log));

  } catch (error) {
    console.log('Script error:', error.message);
  }

  await browser.close();
})();