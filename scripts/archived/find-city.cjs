const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('🔍 Searching for the city...');
  
  await page.goto('http://localhost:5176');
  await page.waitForTimeout(3000);
  
  // Click PLAY to start simulation
  await page.click('button:has-text("PLAY")');
  console.log('▶️ Started simulation');
  await page.waitForTimeout(1000);
  
  // Try zooming out significantly to find the city
  const canvas = await page.$('canvas');
  if (canvas) {
    // Zoom out by scrolling down multiple times
    for (let i = 0; i < 10; i++) {
      await canvas.hover();
      await page.mouse.wheel(0, 500); // Zoom out
      await page.waitForTimeout(100);
    }
    console.log('🔍 Zoomed out to search for city');
    
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'search-zoomed-out.png' });
    console.log('📸 Screenshot after zoom out');
    
    // Try clicking Overview preset
    await page.click('button:has-text("Overview")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'search-overview.png' });
    console.log('📸 Screenshot after Overview preset');
  }

  await browser.close();
})();
