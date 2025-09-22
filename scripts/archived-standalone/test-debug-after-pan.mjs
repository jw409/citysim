import { chromium } from 'playwright';

const browser = await chromium.launch({ 
  headless: false, 
  args: ['--window-size=1920,1440'] 
});
const page = await browser.newPage();
await page.setViewportSize({ width: 1920, height: 1440 });

await page.goto('http://localhost:5173');
await page.waitForTimeout(3000);

console.log('🎥 Panning camera...');
// Pan the camera by dragging on canvas
const canvas = await page.locator('canvas').first();
await canvas.dragTo(canvas, {
  sourcePosition: { x: 500, y: 300 },
  targetPosition: { x: 600, y: 300 }
});
await page.waitForTimeout(1000);

console.log('📊 Testing debug menu after panning...');
// Press 'D' key to open debug panel
await page.keyboard.press('d');
await page.waitForTimeout(1000);

await page.screenshot({ path: 'tests/temp-screenshots/debug-after-pan.png' });

console.log('✅ Debug menu test completed');
await browser.close();
