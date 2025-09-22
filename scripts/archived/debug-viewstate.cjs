const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, args: ['--window-size=1920,1080'] });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });

  await page.goto('http://localhost:5173');
  await page.waitForTimeout(3000);

  // Get viewState and layer properties
  const deckInfo = await page.evaluate(() => {
    const deckCanvas = document.querySelector('canvas');

    // Try to access deck.gl instance
    let deckInstance = null;
    let viewState = null;
    let layerProps = null;

    // Look for deck instance in various places
    if (window.deck) {
      deckInstance = window.deck;
    } else if (deckCanvas && deckCanvas.__deck) {
      deckInstance = deckCanvas.__deck;
    }

    if (deckInstance) {
      viewState = deckInstance.viewState || deckInstance.props?.viewState;

      const layers = deckInstance.layerManager?.layers || [];
      const buildingLayer = layers.find(l => l.id === 'buildings');

      if (buildingLayer) {
        layerProps = {
          id: buildingLayer.id,
          extruded: buildingLayer.props?.extruded,
          elevationScale: buildingLayer.props?.elevationScale,
          dataCount: buildingLayer.props?.data?.length,
          getElevation: !!buildingLayer.props?.getElevation,
        };
      }
    }

    return {
      viewState,
      layerProps,
      canvasSize: deckCanvas ? { width: deckCanvas.width, height: deckCanvas.height } : null
    };
  });

  console.log('🎥 VIEWSTATE INFO:', JSON.stringify(deckInfo.viewState, null, 2));
  console.log('🏗️ BUILDING LAYER PROPS:', JSON.stringify(deckInfo.layerProps, null, 2));
  console.log('📺 CANVAS SIZE:', JSON.stringify(deckInfo.canvasSize, null, 2));

  await browser.close();
})();