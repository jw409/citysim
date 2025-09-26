import { chromium } from 'playwright';

async function captureTerrainFixed() {
  console.log('🚀 Starting terrain fixes debug...');

  const browser = await chromium.launch({
    headless: false,
    args: ['--window-size=1920,1440']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1440 }
  });

  const page = await context.newPage();

  try {
    console.log('🌐 Navigating to app (port 5174)...');
    await page.goto('http://localhost:5174');

    // Wait for the app to fully load
    await page.waitForTimeout(4000);
    console.log('⏳ App loaded, waiting for terrain to render...');

    // Wait for the canvas element and city data to load
    await page.waitForSelector('canvas', { timeout: 15000 });
    await page.waitForTimeout(3000);

    console.log('📸 Taking screenshot 1: Fixed terrain - normal view');
    await page.screenshot({
      path: 'tests/temp-screenshots/terrain-fixed-1-normal.png',
      clip: { x: 0, y: 0, width: 1920, height: 1440 }
    });

    // Rotate camera by 35 degrees to the right for better hills visibility
    console.log('🔄 Rotating camera 35 degrees right to see hills...');

    const canvas = await page.locator('canvas').first();
    await canvas.hover();
    await page.mouse.down();
    await page.mouse.move(1920/2 + 120, 1440/2); // Drag right for rotation
    await page.mouse.up();
    await page.waitForTimeout(1500);

    console.log('📸 Taking screenshot 2: Rotated view - should show hills and river');
    await page.screenshot({
      path: 'tests/temp-screenshots/terrain-fixed-2-rotated-35deg.png',
      clip: { x: 0, y: 0, width: 1920, height: 1440 }
    });

    // Try to zoom out to see more terrain
    console.log('🔍 Zooming out to see wider terrain...');
    await canvas.hover();
    await page.mouse.wheel(0, 800); // Zoom out
    await page.waitForTimeout(1000);

    console.log('📸 Taking screenshot 3: Zoomed out view - terrain overview');
    await page.screenshot({
      path: 'tests/temp-screenshots/terrain-fixed-3-zoomed-out.png',
      clip: { x: 0, y: 0, width: 1920, height: 1440 }
    });

    console.log('✅ Terrain fixes debug completed!');

  } catch (error) {
    console.error('❌ Error during terrain debug:', error);
  } finally {
    await browser.close();
  }
}

captureTerrainFixed().catch(console.error);