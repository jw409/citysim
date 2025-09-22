const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Capture all errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ ERROR:', msg.text());
    }
  });

  page.on('pageerror', error => {
    console.log('💥 PAGE ERROR:', error.message);
  });

  await page.goto('http://localhost:5176');
  await page.waitForTimeout(3000);
  
  // Check if DeckGL canvas exists
  const canvas = await page.$('canvas');
  if (canvas) {
    console.log('✅ Canvas element found');
    const rect = await canvas.boundingBox();
    console.log('📐 Canvas size:', rect);
  } else {
    console.log('❌ No canvas element found');
  }

  // Check for city model loading
  const cityData = await page.evaluate(() => {
    return window.__CITY_DEBUG__ || 'No debug data';
  });
  console.log('🏙️ City data:', cityData);

  await browser.close();
})();
