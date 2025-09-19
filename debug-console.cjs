const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Capture console logs
  page.on('console', msg => {
    if (msg.text().includes('🚨 DEBUG') || msg.text().includes('Loading city model') || msg.text().includes('Generated') || msg.text().includes('agents')) {
      console.log('BROWSER CONSOLE:', msg.text());
    }
  });

  // Navigate to the app
  console.log('Navigating to app...');
  await page.goto('http://localhost:5174');

  // Wait for the app to load and initialize
  console.log('Waiting for initialization...');
  await page.waitForTimeout(8000);

  await browser.close();
})();
