const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('CONSOLE:', msg.text()));
  
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(3000);
  
  // Start simulation
  await page.click('text=START SIMULATION');
  await page.waitForTimeout(3000);
  
  // Look for the toggle button
  const buttons = await page.$$('button');
  console.log('Found', buttons.length, 'buttons');
  
  // Check for specific toggle button
  const toggleButton = await page.$('button:has-text("3D Mode"), button:has-text("2D Mode")');
  console.log('Toggle button found:', !!toggleButton);
  
  // Take screenshot before toggle
  await page.screenshot({ path: 'before-toggle.png' });
  
  if (toggleButton) {
    await toggleButton.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'after-toggle.png' });
  }
  
  await browser.close();
})();
