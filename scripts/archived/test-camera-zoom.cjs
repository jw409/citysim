const { chromium } = require('playwright');

async function testCameraZoom() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('http://localhost:5174');
  await page.waitForTimeout(3000);

  const canvas = page.locator('canvas').first();
  const canvasBox = await canvas.boundingBox();
  const centerX = canvasBox.x + canvasBox.width / 2;
  const centerY = canvasBox.y + canvasBox.height / 2;

  // Try zooming out to see more of the city
  console.log('Zooming out...');
  await page.mouse.move(centerX, centerY);
  for (let i = 0; i < 10; i++) {
    await page.mouse.wheel(0, 500); // Zoom out
    await page.waitForTimeout(200);
  }

  await page.screenshot({ path: 'zoomed-out-city.png' });
  console.log('Screenshot saved: zoomed-out-city.png');

  // Try clicking Overview preset
  const overviewBtn = page.locator('button:has-text("Overview")');
  if (await overviewBtn.isVisible()) {
    await overviewBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'overview-preset.png' });
    console.log('Screenshot saved: overview-preset.png');
  }

  await browser.close();
}

testCameraZoom().catch(console.error);