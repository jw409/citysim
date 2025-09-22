const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('http://localhost:5176');
  await page.waitForTimeout(3000);
  
  // Click the PLAY button
  await page.click('button:has-text("PLAY")');
  console.log('Clicked PLAY button');
  
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'debug-after-play.png' });
  console.log('Screenshot taken after starting simulation');
  
  await browser.close();
})();
