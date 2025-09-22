const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, args: ['--window-size=1920,1440'] });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1440 });

  await page.goto('http://localhost:5173');
  await page.waitForTimeout(3000);

  console.log('📸 Taking multi-angle screenshots to detect 3D geometry...');

  // Screenshot 1: Normal view (baseline)
  await page.screenshot({
    path: 'angle-1-normal.png',
    fullPage: true
  });
  console.log('✅ Normal view captured (60° pitch, 30° bearing)');

  // Screenshot 2: Horizontal pan (change bearing)
  await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Horizontal drag for bearing change
      const events = [
        new MouseEvent('mousedown', { clientX: centerX, clientY: centerY, buttons: 1 }),
        new MouseEvent('mousemove', { clientX: centerX + 100, clientY: centerY, buttons: 1 }),
        new MouseEvent('mouseup', { clientX: centerX + 100, clientY: centerY })
      ];

      events.forEach((event, i) => {
        setTimeout(() => canvas.dispatchEvent(event), i * 50);
      });
    }
  });

  await page.waitForTimeout(1000);
  await page.screenshot({
    path: 'angle-2-horizontal-pan.png',
    fullPage: true
  });
  console.log('✅ Horizontal pan captured (should change bearing ~20°)');

  // Screenshot 3: Vertical pan (change pitch) - this should reveal height if buildings are 3D
  await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Vertical drag for pitch change (looking more down)
      const events = [
        new MouseEvent('mousedown', { clientX: centerX, clientY: centerY, buttons: 1 }),
        new MouseEvent('mousemove', { clientX: centerX, clientY: centerY + 80, buttons: 1 }),
        new MouseEvent('mouseup', { clientX: centerX, clientY: centerY + 80 })
      ];

      events.forEach((event, i) => {
        setTimeout(() => canvas.dispatchEvent(event), i * 50);
      });
    }
  });

  await page.waitForTimeout(1000);
  await page.screenshot({
    path: 'angle-3-vertical-pan-down.png',
    fullPage: true
  });
  console.log('✅ Vertical pan DOWN captured (should show tops of buildings if 3D)');

  // Screenshot 4: Vertical pan UP (change pitch to look more up)
  await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Vertical drag UP for lower pitch (looking more up at buildings)
      const events = [
        new MouseEvent('mousedown', { clientX: centerX, clientY: centerY, buttons: 1 }),
        new MouseEvent('mousemove', { clientX: centerX, clientY: centerY - 120, buttons: 1 }),
        new MouseEvent('mouseup', { clientX: centerX, clientY: centerY - 120 })
      ];

      events.forEach((event, i) => {
        setTimeout(() => canvas.dispatchEvent(event), i * 50);
      });
    }
  });

  await page.waitForTimeout(1000);
  await page.screenshot({
    path: 'angle-4-vertical-pan-up.png',
    fullPage: true
  });
  console.log('✅ Vertical pan UP captured (should show sides of buildings if 3D)');

  await browser.close();
  console.log('🎯 Multi-angle test complete - if buildings are truly 3D, angles 3&4 should look different');
})();