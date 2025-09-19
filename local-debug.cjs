const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.text().includes('agents') || msg.text().includes('layers') || msg.text().includes('ScatterplotLayer')) {
      console.log('BROWSER:', msg.text());
    }
  });

  await page.goto('http://localhost:5176');
  await page.waitForTimeout(5000);
  await browser.close();
})();
