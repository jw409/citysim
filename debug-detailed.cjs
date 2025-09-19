const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const errors = [];
  const logs = [];
  const networkRequests = [];
  const failedRequests = [];

  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') {
      errors.push(`Console Error: ${text}`);
    } else if (text.includes('model') || text.includes('city') || text.includes('load')) {
      logs.push(`${msg.type()}: ${text}`);
    }
  });

  page.on('pageerror', error => {
    errors.push(`Page Error: ${error.message}`);
  });

  page.on('request', request => {
    const url = request.url();
    if (url.includes('model') || url.includes('.pbf') || url.includes('.json')) {
      networkRequests.push(`REQUEST: ${url}`);
    }
  });

  page.on('requestfailed', request => {
    const url = request.url();
    failedRequests.push(`FAILED: ${url} - ${request.failure().errorText}`);
  });

  try {
    console.log('Navigating to app...');
    await page.goto('https://jw409.github.io/citysim/', { waitUntil: 'networkidle' });

    console.log('Waiting for initialization...');
    await page.waitForTimeout(8000);

    console.log('\n=== NETWORK REQUESTS FOR DATA FILES ===');
    networkRequests.forEach(req => console.log(req));

    console.log('\n=== FAILED REQUESTS ===');
    if (failedRequests.length === 0) {
      console.log('No failed requests');
    } else {
      failedRequests.forEach(req => console.log(req));
    }

    console.log('\n=== ERRORS ===');
    if (errors.length === 0) {
      console.log('No errors detected');
    } else {
      errors.forEach(error => console.log(error));
    }

    console.log('\n=== RELEVANT LOGS ===');
    if (logs.length === 0) {
      console.log('No relevant logs found');
    } else {
      logs.forEach(log => console.log(log));
    }

    // Check if city data loaded
    const hasBuildings = await page.evaluate(() => {
      return window.cityData && window.cityData.buildings && window.cityData.buildings.length > 0;
    });

    console.log(`\n=== CITY DATA STATUS ===`);
    console.log(`City data loaded: ${hasBuildings ? 'YES' : 'NO'}`);

  } catch (e) {
    console.log('Script error:', e.message);
  }

  await browser.close();
})();