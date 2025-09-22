const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.text().startsWith('ICON_DATA_URL:')) {
      const dataURL = msg.text().replace('ICON_DATA_URL:', '');
      console.log('Got data URL, creating PNG file...');
      
      // Convert data URL to base64 and save
      const base64Data = dataURL.replace(/^data:image\/png;base64,/, '');
      require('fs').writeFileSync('public/agent-icons.png', base64Data, 'base64');
      console.log('✅ Created public/agent-icons.png');
    }
  });

  await page.goto(`file://${process.cwd()}/temp-icons.html`);
  await page.waitForTimeout(1000);
  await browser.close();
})();
