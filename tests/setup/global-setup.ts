import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for UrbanSynth testing...');

  // Warm up the application by visiting it once
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log('🌐 Warming up application...');
    await page.goto(config.projects[0].use.baseURL || 'http://localhost:5174');

    // Wait for initial city load
    await page.waitForSelector('text=/\\d+ layers active/', { timeout: 60_000 });
    console.log('✅ Application warmed up successfully');

    // Take a baseline screenshot for visual regression
    await page.screenshot({
      path: 'tests/baselines/initial-load.png',
      fullPage: true
    });

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }

  console.log('✅ Global setup completed');
}

export default globalSetup;