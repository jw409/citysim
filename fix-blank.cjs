const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('layers') || text.includes('buildings') || text.includes('DeckGL') || text.includes('camera') || text.includes('viewState')) {
      console.log('DEBUG:', text);
    }
  });

  await page.goto('http://localhost:5176');
  await page.waitForTimeout(4000);
  
  // Try clicking PLAY to load the simulation
  try {
    await page.click('button:has-text("PLAY")');
    console.log('Clicked PLAY button');
    await page.waitForTimeout(2000);
  } catch (e) {
    console.log('Could not click PLAY:', e.message);
  }

  // Try different camera presets
  try {
    await page.click('button:has-text("Overview")');
    console.log('Tried Overview camera');
    await page.waitForTimeout(1000);
  } catch (e) {
    console.log('Could not click Overview');
  }

  await page.screenshot({ path: 'debug-blank-fix.png' });
  console.log('Screenshot taken');

  await browser.close();
})();
