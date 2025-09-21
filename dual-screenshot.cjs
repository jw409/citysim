const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, args: ['--window-size=1920,1440'] });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1440 });

  await page.goto('http://localhost:5173');
  await page.waitForTimeout(3000);

  console.log('📸 Taking dual screenshots for comparison...');

  // Screenshot 1: Normal view
  await page.screenshot({
    path: 'buildings-current-normal.png',
    fullPage: true
  });
  console.log('✅ Normal view captured');

  // Screenshot 2: Pan 15 degrees and capture
  await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Simulate drag from center to rotate ~15 degrees
      const startEvent = new MouseEvent('mousedown', {
        clientX: centerX,
        clientY: centerY,
        buttons: 1
      });
      const moveEvent = new MouseEvent('mousemove', {
        clientX: centerX + 80,
        clientY: centerY - 20,
        buttons: 1
      });
      const endEvent = new MouseEvent('mouseup', {
        clientX: centerX + 80,
        clientY: centerY - 20
      });

      canvas.dispatchEvent(startEvent);
      setTimeout(() => canvas.dispatchEvent(moveEvent), 50);
      setTimeout(() => canvas.dispatchEvent(endEvent), 100);
    }
  });

  await page.waitForTimeout(1000); // Wait for camera to settle
  await page.screenshot({
    path: 'buildings-current-panned.png',
    fullPage: true
  });
  console.log('✅ Panned view captured (+15° rotation)');

  await browser.close();
  console.log('🎯 Dual screenshot comparison complete');
})();