const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('🎬 Starting demonstration...');
  
  // Navigate to the app
  await page.goto('http://localhost:5176');
  await page.waitForTimeout(3000);
  
  // Take initial screenshot
  await page.screenshot({ path: 'demo-1-initial.png' });
  console.log('📸 1. Initial state captured');
  
  // Click PLAY to start simulation
  await page.click('button:has-text("PLAY")');
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: 'demo-2-running.png' });
  console.log('📸 2. Simulation running captured');
  
  // Try Street view preset for closer look
  await page.click('button:has-text("Street")');
  await page.waitForTimeout(1000);
  
  await page.screenshot({ path: 'demo-3-street-view.png' });
  console.log('📸 3. Street view captured');
  
  // Try Overview preset
  await page.click('button:has-text("Overview")');
  await page.waitForTimeout(1000);
  
  await page.screenshot({ path: 'demo-4-overview.png' });
  console.log('📸 4. Overview captured');
  
  // Check console for agent data
  await page.evaluate(() => {
    console.log('DEMO_AGENT_COUNT: Currently showing agents in layers');
  });
  
  console.log('✅ Demo complete! Check images demo-1 through demo-4');
  await browser.close();
})();
