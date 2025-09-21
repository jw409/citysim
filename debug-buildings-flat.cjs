const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Capture console logs
  const logs = [];
  page.on('console', msg => {
    logs.push({
      type: msg.type(),
      text: msg.text()
    });
  });

  await page.goto('http://localhost:5173');
  await page.waitForTimeout(5000);

  // Get deck.gl layer info
  const deckInfo = await page.evaluate(() => {
    const deckCanvas = document.querySelector('canvas');
    if (!deckCanvas) return null;

    // Try to find deck instance
    const deckElement = document.querySelector('#deckgl-wrapper') || document.querySelector('[id*="deck"]') || deckCanvas.parentElement;

    // Check for deck.gl layers in window
    const buildingLayerInfo = window.__DECK_GL_DEBUG__ || {};

    return {
      canvasFound: !!deckCanvas,
      canvasSize: deckCanvas ? { width: deckCanvas.width, height: deckCanvas.height } : null,
      deckElementFound: !!deckElement,
      debugInfo: buildingLayerInfo
    };
  });

  console.log('🔍 DECK.GL INFO:', JSON.stringify(deckInfo, null, 2));

  // Filter for building-related logs
  const buildingLogs = logs.filter(log =>
    log.text.includes('Building') ||
    log.text.includes('elevation') ||
    log.text.includes('extruded') ||
    log.text.includes('3D') ||
    log.text.includes('height')
  );

  console.log('\n📊 BUILDING-RELATED CONSOLE LOGS:');
  buildingLogs.forEach(log => {
    console.log(`[${log.type}] ${log.text}`);
  });

  // Try to get layer props directly
  const layerProps = await page.evaluate(() => {
    try {
      // Look for React DevTools or internal deck.gl state
      const reactRoot = document.getElementById('root');
      const layers = reactRoot?.__reactInternalInstance?.return?.stateNode?.props?.layers || [];

      return layers.map(layer => ({
        id: layer.id,
        extruded: layer.props?.extruded,
        elevationScale: layer.props?.elevationScale,
        dataLength: layer.props?.data?.length
      }));
    } catch (e) {
      return { error: e.message };
    }
  });

  console.log('\n🏗️ LAYER PROPS:', JSON.stringify(layerProps, null, 2));

  await browser.close();
})();