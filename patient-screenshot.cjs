const { chromium } = require('playwright');

async function takePatientScreenshots() {
  const browser = await chromium.launch({ headless: false, args: ['--window-size=1920,1440'] });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1440 });

  console.log('🌐 Loading cityscape...');
  await page.goto('http://localhost:5173');

  console.log('⏳ Waiting for full render (10 seconds)...');
  await page.waitForTimeout(10000); // Wait 10 seconds for full render

  // Take multiple angles to show the massive cityscape
  console.log('📸 Taking angle 1: Normal view');
  await page.screenshot({
    path: 'cityscape-angle-1-normal.png',
    fullPage: true
  });

  console.log('📸 Taking angle 2: Zoomed out to see full city');
  await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      // Zoom out to see more buildings
      canvas.dispatchEvent(new WheelEvent('wheel', {
        deltaY: 500, // Zoom out
        clientX: canvas.width / 2,
        clientY: canvas.height / 2
      }));
    }
  });
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: 'cityscape-angle-2-zoomed-out.png',
    fullPage: true
  });

  console.log('📸 Taking angle 3: Rotated view');
  await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Rotate the view
      const events = [
        new MouseEvent('mousedown', { clientX: centerX, clientY: centerY, buttons: 1 }),
        new MouseEvent('mousemove', { clientX: centerX + 150, clientY: centerY - 50, buttons: 1 }),
        new MouseEvent('mouseup', { clientX: centerX + 150, clientY: centerY - 50 })
      ];

      events.forEach((event, i) => {
        setTimeout(() => canvas.dispatchEvent(event), i * 100);
      });
    }
  });
  await page.waitForTimeout(3000);
  await page.screenshot({
    path: 'cityscape-angle-3-rotated.png',
    fullPage: true
  });

  console.log('📸 Taking angle 4: High altitude view');
  await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      // More zoom out for satellite view
      for (let i = 0; i < 5; i++) {
        canvas.dispatchEvent(new WheelEvent('wheel', {
          deltaY: 300,
          clientX: canvas.width / 2,
          clientY: canvas.height / 2
        }));
      }
    }
  });
  await page.waitForTimeout(3000);
  await page.screenshot({
    path: 'cityscape-angle-4-satellite.png',
    fullPage: true
  });

  console.log('✅ All angles captured with proper render time');
  await browser.close();
}

takePatientScreenshots();