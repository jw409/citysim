import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

// Listen for console messages
page.on('console', msg => console.log('BROWSER:', msg.text()));
page.on('pageerror', error => console.log('ERROR:', error.message));

await page.goto('http://localhost:5173');
await page.waitForTimeout(5000);

await browser.close();
