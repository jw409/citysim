const { chromium } = require('@playwright/test');

async function comprehensiveDiagnosis() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // 1. CAPTURE CONSOLE LOGS
  const consoleLogs = [];
  const errors = [];
  page.on('console', msg => {
    const log = `[${msg.type().toUpperCase()}] ${msg.text()}`;
    consoleLogs.push(log);
    console.log(log);
  });

  page.on('pageerror', error => {
    const errorLog = `[PAGE ERROR] ${error.message}`;
    errors.push(errorLog);
    console.log(errorLog);
  });

  // 2. CAPTURE NETWORK REQUESTS
  const failedRequests = [];
  page.on('response', response => {
    if (!response.ok()) {
      const failedReq = `[FAILED REQUEST] ${response.status()} ${response.url()}`;
      failedRequests.push(failedReq);
      console.log(failedReq);
    } else {
      console.log(`[SUCCESS] ${response.status()} ${response.url()}`);
    }
  });

  console.log('=== NAVIGATING TO APPLICATION ===');
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(5000); // Wait for app to load

  // 3. DOM INSPECTION
  console.log('\n=== DOM INSPECTION ===');
  const bodyHtml = await page.locator('body').innerHTML();
  console.log('BODY CONTENT LENGTH:', bodyHtml.length);

  // Check for specific elements
  const rootDiv = await page.locator('#root');
  const rootExists = await rootDiv.count() > 0;
  console.log('ROOT DIV EXISTS:', rootExists);

  if (rootExists) {
    const rootContent = await rootDiv.innerHTML();
    console.log('ROOT DIV CONTENT LENGTH:', rootContent.length);
    console.log('ROOT DIV CONTENT PREVIEW:', rootContent.substring(0, 200) + '...');
  }

  // Check for React components
  const reactComponents = await page.locator('[data-reactroot], .App, main').count();
  console.log('REACT COMPONENTS FOUND:', reactComponents);

  // Check for CSS
  const stylesheets = await page.locator('link[rel="stylesheet"]').count();
  console.log('STYLESHEETS LOADED:', stylesheets);

  // 4. JAVASCRIPT EXECUTION STATUS
  console.log('\n=== JAVASCRIPT EXECUTION STATUS ===');
  try {
    const reactExists = await page.evaluate(() => typeof React !== 'undefined');
    console.log('REACT AVAILABLE:', reactExists);
  } catch (e) {
    console.log('REACT CHECK FAILED:', e.message);
  }

  // 5. SUMMARY REPORT
  console.log('\n=== DIAGNOSIS SUMMARY ===');
  console.log('TOTAL CONSOLE LOGS:', consoleLogs.length);
  console.log('TOTAL ERRORS:', errors.length);
  console.log('TOTAL FAILED REQUESTS:', failedRequests.length);

  if (errors.length > 0) {
    console.log('CRITICAL ERRORS:', errors);
  }

  if (failedRequests.length > 0) {
    console.log('FAILED REQUESTS:', failedRequests);
  }

  await page.screenshot({ path: 'debug-systematic-screenshot.png' });
  console.log('Screenshot saved as debug-systematic-screenshot.png');

  await browser.close();

  // Return diagnosis data
  return {
    consoleLogs,
    errors,
    failedRequests,
    rootExists,
    reactComponents,
    stylesheets
  };
}

comprehensiveDiagnosis().catch(console.error);