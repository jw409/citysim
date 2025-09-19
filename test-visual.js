import { chromium } from 'playwright';

async function testVisualization() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Listen for console messages
  page.on('console', msg => {
    console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
  });

  // Listen for errors
  page.on('pageerror', error => {
    console.log(`[PAGE ERROR] ${error.message}`);
  });

  try {
    console.log('Navigating to localhost:5175...');
    await page.goto('http://localhost:5175', { waitUntil: 'networkidle' });

    // Wait a bit for the app to initialize
    await page.waitForTimeout(3000);

    // Take a screenshot
    await page.screenshot({ path: 'visualization-test.png', fullPage: true });
    console.log('Screenshot saved as visualization-test.png');

    // Check for error messages
    const errorElements = await page.locator('text=Error').count();
    if (errorElements > 0) {
      console.log(`Found ${errorElements} error elements on page`);
      const errorText = await page.locator('text=Error').first().textContent();
      console.log(`First error: ${errorText}`);
    }

    // Check if visualization is loaded
    const canvas = await page.locator('canvas').count();
    console.log(`Found ${canvas} canvas elements`);

    // Check if controls are present
    const controls = await page.locator('text=Show Zones').count();
    console.log(`Found ${controls} control elements`);

  } catch (error) {
    console.log(`Test failed: ${error.message}`);
  } finally {
    await browser.close();
  }
}

testVisualization();