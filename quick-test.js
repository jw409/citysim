import { chromium } from 'playwright';

async function quickTest() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Listen for console messages
  page.on('console', msg => {
    console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
  });

  try {
    console.log('Loading page...');
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });

    // Wait for city model to load
    await page.waitForTimeout(5000);

    // Check if canvas exists
    const canvas = await page.locator('canvas').count();
    console.log(`Canvas elements: ${canvas}`);

    // Check for any error text
    const hasErrors = await page.locator('text=Error').count();
    console.log(`Error elements: ${hasErrors}`);

    // Quick screenshot
    await page.screenshot({ path: 'quick-test.png' });
    console.log('Screenshot saved');

  } catch (error) {
    console.log(`Error: ${error.message}`);
  } finally {
    await browser.close();
  }
}

quickTest();