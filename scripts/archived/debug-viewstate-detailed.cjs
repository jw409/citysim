const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, args: ['--window-size=1920,1440'] });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1440 });

  await page.goto('http://localhost:5173');
  await page.waitForTimeout(3000);

  // Inject debug script to capture detailed viewState
  const viewStateInfo = await page.evaluate(() => {
    // Try to find deck.gl viewState in multiple ways
    const deckCanvas = document.querySelector('canvas');
    let actualViewState = null;
    let debugInfo = {};

    // Method 1: Look for viewState in window
    if (window.deck) {
      actualViewState = window.deck.viewState || window.deck.props?.viewState;
    }

    // Method 2: Look in canvas data
    if (deckCanvas && deckCanvas.__deck) {
      actualViewState = deckCanvas.__deck.viewState;
    }

    // Method 3: Look for React component props
    const deckglElement = document.querySelector('[class*="deckgl"]') || deckCanvas?.parentElement;
    if (deckglElement && deckglElement._reactInternalFiber) {
      const reactInstance = deckglElement._reactInternalFiber;
      actualViewState = reactInstance?.return?.pendingProps?.viewState;
    }

    // Method 4: Check if we can find camera controls
    const cameraElement = document.querySelector('[class*="camera"]');
    if (cameraElement) {
      debugInfo.cameraElement = true;
    }

    // Get all console logs
    const logs = [];
    const originalLog = console.log;
    console.log = function(...args) {
      logs.push(args.join(' '));
      originalLog.apply(console, arguments);
    };

    return {
      actualViewState,
      debugInfo,
      canvasExists: !!deckCanvas,
      windowKeys: Object.keys(window).filter(k => k.includes('deck') || k.includes('camera')),
    };
  });

  console.log('🎥 DETAILED VIEWSTATE DEBUG:');
  console.log(JSON.stringify(viewStateInfo, null, 2));

  // Try to get camera pitch specifically
  const pitchInfo = await page.evaluate(() => {
    const deckgl = document.querySelector('canvas')?.parentElement;
    if (deckgl && deckgl.style) {
      return {
        transform: deckgl.style.transform,
        perspective: deckgl.style.perspective
      };
    }
    return null;
  });

  console.log('🎬 PITCH/TRANSFORM INFO:', JSON.stringify(pitchInfo, null, 2));

  await browser.close();
})();