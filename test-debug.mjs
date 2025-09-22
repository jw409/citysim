import { chromium } from 'playwright';

const browser = await chromium.launch({ 
  headless: false, 
  args: ['--window-size=1920,1440'] 
});
const page = await browser.newPage();
await page.setViewportSize({ width: 1920, height: 1440 });

await page.goto('http://localhost:5173');
await page.waitForTimeout(3000);

// Press 'D' key to open debug panel
await page.keyboard.press('d');
await page.waitForTimeout(1000);

await page.screenshot({ path: 'citysim-debug-panel.png' });

await browser.close();
