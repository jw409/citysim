const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Capture ALL console messages
  const logs = [];
  page.on('console', msg => {
    logs.push(`[${msg.type().toUpperCase()}] ${msg.text()}`);
  });

  // Capture errors
  page.on('pageerror', error => {
    logs.push(`[PAGE ERROR] ${error.message}`);
  });

  try {
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(5000);

    // Try to interact with the viewport to see if it's responsive
    const viewport = await page.locator('.visualization-container, canvas').first();
    if (await viewport.isVisible()) {
      // Try dragging to see if camera responds
      const box = await viewport.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width/2, box.y + box.height/2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width/2 + 50, box.y + box.height/2 + 50);
        await page.mouse.up();
        console.log('✅ Mouse drag performed on viewport');
      }
    }

    await page.waitForTimeout(1000);

    // Check DeckGL specific properties
    const deckglInfo = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return { error: 'No canvas found' };

      // Try to access DeckGL internals
      const deckgl = window.deck || window.__deck || null;

      return {
        canvasSize: { width: canvas.width, height: canvas.height },
        canvasRect: canvas.getBoundingClientRect(),
        hasWebGL: !!canvas.getContext('webgl'),
        deckglAvailable: !!deckgl,
        layerManager: deckgl ? deckgl.layerManager : null,
        windowDeck: Object.keys(window).filter(k => k.toLowerCase().includes('deck'))
      };
    });

    console.log('\n=== DECKGL DEBUG INFO ===');
    console.log(JSON.stringify(deckglInfo, null, 2));

    console.log('\n=== ALL CONSOLE LOGS ===');
    logs.forEach(log => console.log(log));

    // Take final screenshot
    await page.screenshot({ path: 'debug-browser-interaction.png' });
    console.log('\n✅ Screenshot saved: debug-browser-interaction.png');

  } catch (error) {
    console.log('Script error:', error.message);
  }

  await browser.close();
})();