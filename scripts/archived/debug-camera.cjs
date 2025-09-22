const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Capture console messages
  const logs = [];
  page.on('console', msg => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });

  try {
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(5000);

    // Click the START SIMULATION button
    console.log('Clicking START SIMULATION button...');
    await page.click('text=START SIMULATION');
    await page.waitForTimeout(2000);

    // Get camera position and agent info
    const debugInfo = await page.evaluate(() => {
      // Try to get camera viewState from React DevTools or window
      const viewState = window.__DECK_GL_VIEWSTATE || 'not found';

      // Try to get agent data
      const agentData = window.__AGENT_DEBUG || 'not found';

      return {
        viewState,
        agentData,
        windowProps: Object.keys(window).filter(k => k.includes('DECK') || k.includes('AGENT')),
        canvasCount: document.querySelectorAll('canvas').length
      };
    });

    console.log('=== DEBUG INFO ===');
    console.log(JSON.stringify(debugInfo, null, 2));

    // Take a screenshot after clicking start
    await page.screenshot({ path: 'debug-after-start.png' });
    console.log('Screenshot taken: debug-after-start.png');

    console.log('\n=== LATEST LOGS ===');
    logs.slice(-20).forEach(log => console.log(log));

  } catch (error) {
    console.log('Script error:', error.message);
  }

  await browser.close();
})();