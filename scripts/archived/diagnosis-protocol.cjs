const { chromium } = require('@playwright/test');

async function executeComprehensiveDiagnosis() {
  console.log('=== STARTING COMPREHENSIVE DIAGNOSIS ===\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // 1. BROWSER CONSOLE LOGS ANALYSIS
  console.log('1. CAPTURING BROWSER CONSOLE LOGS:');
  const consoleLogs = [];
  const consoleErrors = [];
  const consoleWarnings = [];

  page.on('console', msg => {
    const logEntry = `[${msg.type().toUpperCase()}] ${msg.text()}`;
    consoleLogs.push(logEntry);

    if (msg.type() === 'error') {
      consoleErrors.push(logEntry);
      console.log(`🔴 ERROR: ${msg.text()}`);
    } else if (msg.type() === 'warning') {
      consoleWarnings.push(logEntry);
      console.log(`🟡 WARNING: ${msg.text()}`);
    }
  });

  page.on('pageerror', error => {
    const errorMsg = `[PAGE ERROR] ${error.message}`;
    consoleErrors.push(errorMsg);
    console.log(`🔴 PAGE ERROR: ${error.message}`);
  });

  // 2. NETWORK REQUESTS ANALYSIS
  console.log('\n2. MONITORING NETWORK REQUESTS:');
  const failedRequests = [];
  const successfulRequests = [];

  page.on('response', response => {
    const requestInfo = {
      url: response.url(),
      status: response.status(),
      contentType: response.headers()['content-type']
    };

    if (!response.ok()) {
      failedRequests.push(requestInfo);
      console.log(`❌ FAILED: ${response.status()} ${response.url()}`);
    } else {
      successfulRequests.push(requestInfo);
      // Only log critical assets
      if (response.url().includes('.js') || response.url().includes('.css') || response.url().includes('localhost:5173/')) {
        console.log(`✅ SUCCESS: ${response.status()} ${response.url()}`);
      }
    }
  });

  // Navigate and wait for initial load
  console.log('\n3. NAVIGATING TO APPLICATION:');
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(8000); // Wait for full app load

  // 3. DOM INSPECTION
  console.log('\n4. DOM STATE ANALYSIS:');

  // Check if root element exists
  const rootExists = await page.locator('#root').count() > 0;
  console.log(`Root element exists: ${rootExists}`);

  if (rootExists) {
    const rootContent = await page.locator('#root').innerHTML();
    console.log(`Root content length: ${rootContent.length} characters`);

    // Check for React components
    const reactElements = await page.locator('[data-reactroot], .App, main').count();
    console.log(`React elements found: ${reactElements}`);

    // Check for specific app components
    const cityVisualization = await page.locator('[class*="Cityscape"], canvas').count();
    console.log(`Visualization elements found: ${cityVisualization}`);

    // Check for control panels
    const controlPanels = await page.locator('[class*="panel"], [class*="control"]').count();
    console.log(`Control panels found: ${controlPanels}`);
  }

  // Check viewport content
  const bodyContent = await page.locator('body').innerHTML();
  console.log(`Body content length: ${bodyContent.length} characters`);

  // 4. JAVASCRIPT RUNTIME STATUS
  console.log('\n5. JAVASCRIPT RUNTIME ANALYSIS:');

  try {
    const hasReact = await page.evaluate(() => typeof React !== 'undefined');
    console.log(`React available: ${hasReact}`);
  } catch (e) {
    console.log(`React check failed: ${e.message}`);
  }

  try {
    const hasDeckGL = await page.evaluate(() => typeof DeckGL !== 'undefined');
    console.log(`DeckGL available: ${hasDeckGL}`);
  } catch (e) {
    console.log(`DeckGL check failed: ${e.message}`);
  }

  // Check for canvas elements (indicates rendering)
  const canvasCount = await page.locator('canvas').count();
  console.log(`Canvas elements found: ${canvasCount}`);

  // 5. VISUAL STATE ANALYSIS
  console.log('\n6. VISUAL STATE VERIFICATION:');

  // Take screenshot for visual reference
  await page.screenshot({ path: 'diagnosis-visual-state.png', fullPage: true });
  console.log('Screenshot saved: diagnosis-visual-state.png');

  // Check if specific UI elements are visible
  const startButtonVisible = await page.locator('text=START SIMULATION').isVisible();
  console.log(`Start button visible: ${startButtonVisible}`);

  const toggleButtonVisible = await page.locator('button:has-text("3D Mode"), button:has-text("2D Mode")').isVisible();
  console.log(`Toggle button visible: ${toggleButtonVisible}`);

  // 6. SUMMARY REPORT
  console.log('\n=== DIAGNOSIS SUMMARY ===');
  console.log(`Total console logs: ${consoleLogs.length}`);
  console.log(`Console errors: ${consoleErrors.length}`);
  console.log(`Console warnings: ${consoleWarnings.length}`);
  console.log(`Failed requests: ${failedRequests.length}`);
  console.log(`Successful requests: ${successfulRequests.length}`);

  if (consoleErrors.length > 0) {
    console.log('\nCRITICAL ERRORS FOUND:');
    consoleErrors.forEach(error => console.log(`  ${error}`));
  }

  if (failedRequests.length > 0) {
    console.log('\nFAILED NETWORK REQUESTS:');
    failedRequests.forEach(req => console.log(`  ${req.status} ${req.url}`));
  }

  await browser.close();

  return {
    consoleLogs,
    consoleErrors,
    consoleWarnings,
    failedRequests,
    successfulRequests,
    rootExists,
    canvasCount,
    startButtonVisible,
    toggleButtonVisible
  };
}

executeComprehensiveDiagnosis().catch(console.error);