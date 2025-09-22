const { chromium } = require('playwright');

async function testDeckGLControls() {
  console.log('🚀 Testing DeckGL Camera Controls...');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 100
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:5174');

  // Wait for city to load
  console.log('⏳ Waiting for city to load...');
  await page.waitForTimeout(3000);

  // Find the canvas (avoid UI panels)
  const canvas = await page.locator('canvas').first();

  // Click away from panels to ensure canvas focus
  await page.click('body', { position: { x: 600, y: 400 } });

  console.log('📊 Testing controls:');

  // Test zoom (mouse wheel)
  console.log('🔍 Testing zoom with mouse wheel...');
  await canvas.hover();
  await page.mouse.wheel(0, -500); // Zoom in
  await page.waitForTimeout(1000);
  await page.mouse.wheel(0, 500);  // Zoom out
  await page.waitForTimeout(1000);

  // Test left-click drag (should rotate)
  console.log('🔄 Testing left-click drag rotation...');
  const canvasBox = await canvas.boundingBox();
  const centerX = canvasBox.x + canvasBox.width / 2;
  const centerY = canvasBox.y + canvasBox.height / 2;

  await page.mouse.move(centerX, centerY);
  await page.mouse.down({ button: 'left' });
  await page.mouse.move(centerX + 100, centerY, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(1000);

  // Test right-click drag (should pan)
  console.log('↔️ Testing right-click drag pan...');
  await page.mouse.move(centerX, centerY);
  await page.mouse.down({ button: 'right' });
  await page.mouse.move(centerX + 50, centerY + 50, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(1000);

  // Test camera presets
  console.log('📷 Testing camera presets...');

  const overviewBtn = page.locator('button:has-text("Overview")');
  if (await overviewBtn.isVisible()) {
    await overviewBtn.click();
    await page.waitForTimeout(2000);
    console.log('✅ Overview preset clicked');
  }

  const aerialBtn = page.locator('button:has-text("Aerial")');
  if (await aerialBtn.isVisible()) {
    await aerialBtn.click();
    await page.waitForTimeout(2000);
    console.log('✅ Aerial preset clicked');
  }

  const streetBtn = page.locator('button:has-text("Street")');
  if (await streetBtn.isVisible()) {
    await streetBtn.click();
    await page.waitForTimeout(2000);
    console.log('✅ Street preset clicked');
  }

  // Take final screenshot
  console.log('📸 Taking final screenshot...');
  await page.screenshot({
    path: 'orbit-controls-test.png',
    fullPage: true
  });

  // Check console for any DeckGL errors
  console.log('🔍 Checking for console errors...');
  const logs = [];
  page.on('console', msg => logs.push(msg.text()));

  await page.waitForTimeout(1000);

  const errors = logs.filter(log =>
    log.includes('error') ||
    log.includes('Error') ||
    log.includes('DeckGL') ||
    log.includes('controller')
  );

  if (errors.length > 0) {
    console.log('❌ Console errors found:');
    errors.forEach(error => console.log('  ', error));
  } else {
    console.log('✅ No console errors found');
  }

  console.log('🏁 Test complete. Check deckgl-controls-test.png for visual result.');

  await browser.close();
}

testDeckGLControls().catch(console.error);