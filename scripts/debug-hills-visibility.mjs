import { chromium } from 'playwright';

async function captureHillsDebug() {
  console.log('🚀 Starting hills visibility debug...');

  const browser = await chromium.launch({
    headless: false,
    args: ['--window-size=1920,1440']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1440 }
  });

  const page = await context.newPage();

  try {
    console.log('🌐 Navigating to app...');
    await page.goto('http://localhost:5173');

    // Wait for the app to fully load
    await page.waitForTimeout(3000);
    console.log('⏳ App loaded, waiting for city data...');

    // Wait for the canvas element and city data to load
    await page.waitForSelector('canvas', { timeout: 10000 });
    await page.waitForTimeout(2000);

    console.log('📸 Taking screenshot 1: Normal view (rotation 0)');
    await page.screenshot({
      path: 'tests/temp-screenshots/hills-debug-1-normal.png',
      clip: { x: 0, y: 0, width: 1920, height: 1440 }
    });

    // Rotate camera by 35 degrees to the right
    console.log('🔄 Rotating camera 35 degrees right...');

    // Use the viewport controls or direct camera manipulation
    const canvas = await page.locator('canvas').first();

    // Simulate mouse drag to rotate camera (35 degrees ≈ 100px horizontal drag at typical zoom)
    await canvas.hover();
    await page.mouse.down();
    await page.mouse.move(1920/2 + 120, 1440/2); // Drag right ~120px for ~35 degrees
    await page.mouse.up();

    // Wait for camera to stabilize
    await page.waitForTimeout(1000);

    console.log('📸 Taking screenshot 2: Rotated view (35 degrees right)');
    await page.screenshot({
      path: 'tests/temp-screenshots/hills-debug-2-rotated.png',
      clip: { x: 0, y: 0, width: 1920, height: 1440 }
    });

    // Check console for any terrain-related errors
    const logs = await page.evaluate(() => {
      return {
        errors: window.console._errors || [],
        terrain: window.__terrainDebug || 'No terrain debug info'
      };
    });

    console.log('🐛 Console info:', logs);

    // Try to get terrain statistics
    const terrainStats = await page.evaluate(() => {
      // Try to access any global terrain data
      if (window.__cityData) {
        return {
          hasTerrainLayer: !!window.__cityData.terrain,
          layerCount: window.__layers ? window.__layers.length : 0,
          terrainPatches: window.__terrainPatches ? window.__terrainPatches.length : 0
        };
      }
      return { message: 'No city data available' };
    });

    console.log('📊 Terrain statistics:', terrainStats);

    console.log('✅ Hills visibility debug completed!');

  } catch (error) {
    console.error('❌ Error during debug capture:', error);
  } finally {
    await browser.close();
  }
}

// Run the debug capture
captureHillsDebug().catch(console.error);