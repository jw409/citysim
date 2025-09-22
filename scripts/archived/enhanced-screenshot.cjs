const { chromium } = require('playwright');

async function takeEnhancedScreenshot(filename, description) {
  const browser = await chromium.launch({ headless: false, args: ['--window-size=1920,1440'] });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1440 });

  await page.goto('http://localhost:5173');
  await page.waitForTimeout(3000);

  // Get camera/view metadata
  const metadata = await page.evaluate((desc) => {
    const deckCanvas = document.querySelector('canvas');
    const timestamp = new Date().toISOString();

    // Try to get deck.gl viewState
    let viewState = null;
    if (window.deck) {
      viewState = window.deck.viewState;
    }

    // Get performance data
    const perfData = window.performance ? {
      memory: window.performance.memory ? {
        usedJSHeapSize: window.performance.memory.usedJSHeapSize,
        totalJSHeapSize: window.performance.memory.totalJSHeapSize,
        usedJSHeapSizeLimit: window.performance.memory.usedJSHeapSizeLimit
      } : null,
      timing: {
        loadEventEnd: window.performance.timing.loadEventEnd,
        navigationStart: window.performance.timing.navigationStart
      }
    } : null;

    // Get layer count
    const layerCount = window.deck?.layerManager?.layers?.length || 0;

    return {
      timestamp,
      viewState,
      performance: perfData,
      layerCount,
      canvasSize: deckCanvas ? {
        width: deckCanvas.width,
        height: deckCanvas.height,
        clientWidth: deckCanvas.clientWidth,
        clientHeight: deckCanvas.clientHeight
      } : null,
      url: window.location.href,
      userAgent: navigator.userAgent.substring(0, 100),
      description: desc
    };
  }, description);

  // Take screenshot
  await page.screenshot({
    path: filename,
    fullPage: true
  });

  // Save metadata
  const metadataFilename = filename.replace('.png', '-metadata.json');
  require('fs').writeFileSync(metadataFilename, JSON.stringify(metadata, null, 2));

  console.log(`📸 Screenshot: ${filename}`);
  console.log(`📊 Metadata: ${metadataFilename}`);
  console.log(`🎥 ViewState:`, metadata.viewState);
  console.log(`🏗️ Layers: ${metadata.layerCount}`);
  console.log(`⚡ Memory: ${Math.round((metadata.performance?.memory?.usedJSHeapSize || 0) / 1024 / 1024)}MB`);

  await browser.close();
  return metadata;
}

if (require.main === module) {
  const filename = process.argv[2] || 'enhanced-cityscape.png';
  const description = process.argv[3] || 'Enhanced 3D cityscape with metadata';
  takeEnhancedScreenshot(filename, description);
}

module.exports = { takeEnhancedScreenshot };