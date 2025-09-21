import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function debugBuildingRendering() {
  console.log('🚀 Starting Playwright building debug session...');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000 // Slow down for debugging
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // Capture console logs
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    consoleLogs.push({ type, text, timestamp: new Date().toISOString() });
    console.log(`[${type.toUpperCase()}] ${text}`);
  });

  // Capture errors
  const errors = [];
  page.on('pageerror', error => {
    errors.push({ message: error.message, stack: error.stack, timestamp: new Date().toISOString() });
    console.error('Page Error:', error.message);
  });

  try {
    console.log('📍 Navigating to localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

    // Wait for city to load
    console.log('⏳ Waiting for city data to load...');
    await page.waitForTimeout(5000);

    // Take initial screenshot
    await page.screenshot({ path: 'debug-initial-state.png' });
    console.log('📸 Initial screenshot saved');

    // Extract building debug data from console
    console.log('🔍 Extracting building data from page...');
    const buildingData = await page.evaluate(() => {
      // Look for building debug logs in the console
      const logs = window.console.logs || [];
      return {
        buildingAnalysis: logs.filter(l => l.includes('BUILDING LAYER ANALYSIS')),
        polygonDebug: logs.filter(l => l.includes('POLYGON DEBUG')),
        elevationDebug: logs.filter(l => l.includes('elevation DEBUG')),
        colorDebug: logs.filter(l => l.includes('color debug'))
      };
    });

    // Get DeckGL layer information
    const deckGLInfo = await page.evaluate(() => {
      const deckGLContainer = document.querySelector('[class*="deck-canvas"]');
      if (!deckGLContainer) return { error: 'DeckGL container not found' };

      return {
        containerExists: !!deckGLContainer,
        canvasCount: document.querySelectorAll('canvas').length,
        viewportDimensions: {
          width: deckGLContainer.offsetWidth,
          height: deckGLContainer.offsetHeight
        }
      };
    });

    // Try to get React component state
    const reactState = await page.evaluate(() => {
      // Try to access React fiber to get component state
      const cityscape = document.querySelector('[class*="visualization-container"]');
      if (cityscape && cityscape._reactInternalFiber) {
        return { hasReactState: true };
      }
      return { hasReactState: false };
    });

    // Take screenshot after waiting
    await page.screenshot({ path: 'debug-after-load.png' });
    console.log('📸 After-load screenshot saved');

    // Try interacting with the viewport
    console.log('🖱️ Testing viewport interaction...');
    await page.mouse.move(960, 540); // Center of screen
    await page.mouse.wheel(0, -500); // Zoom in
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'debug-after-zoom.png' });
    console.log('📸 After-zoom screenshot saved');

    // Try keyboard shortcuts
    console.log('⌨️ Testing camera presets...');
    await page.keyboard.press('1'); // Overview preset
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'debug-preset-1.png' });

    await page.keyboard.press('3'); // Aerial preset
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'debug-preset-3.png' });

    // Check if performance monitor is accessible
    console.log('📊 Testing performance monitor...');
    await page.keyboard.press('Control+p');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'debug-performance-monitor.png' });

    // Compile results
    const results = {
      timestamp: new Date().toISOString(),
      errors,
      consoleLogs: consoleLogs.slice(-50), // Last 50 logs
      buildingData,
      deckGLInfo,
      reactState,
      screenshots: [
        'debug-initial-state.png',
        'debug-after-load.png',
        'debug-after-zoom.png',
        'debug-preset-1.png',
        'debug-preset-3.png',
        'debug-performance-monitor.png'
      ]
    };

    // Save debug report
    fs.writeFileSync('debug-report.json', JSON.stringify(results, null, 2));
    console.log('📝 Debug report saved to debug-report.json');

    // Analysis
    console.log('\n🔍 ANALYSIS:');
    console.log(`- Total console logs captured: ${consoleLogs.length}`);
    console.log(`- Errors encountered: ${errors.length}`);
    console.log(`- DeckGL container found: ${deckGLInfo.containerExists}`);
    console.log(`- Canvas elements: ${deckGLInfo.canvasCount}`);

    if (deckGLInfo.viewportDimensions) {
      console.log(`- Viewport size: ${deckGLInfo.viewportDimensions.width}x${deckGLInfo.viewportDimensions.height}`);
    }

    // Look for specific building issues
    const buildingLogs = consoleLogs.filter(log =>
      log.text.includes('BUILDING') ||
      log.text.includes('building') ||
      log.text.includes('POLYGON') ||
      log.text.includes('elevation')
    );

    console.log(`\n🏢 BUILDING-SPECIFIC LOGS (${buildingLogs.length}):`);
    buildingLogs.slice(-10).forEach(log => {
      console.log(`  [${log.type}] ${log.text}`);
    });

    if (errors.length > 0) {
      console.log('\n❌ ERRORS:');
      errors.forEach(error => {
        console.log(`  ${error.message}`);
      });
    }

  } catch (error) {
    console.error('Debug script error:', error);
  } finally {
    await browser.close();
    console.log('✅ Debug session complete');
  }
}

// Run the debug
debugBuildingRendering().catch(console.error);