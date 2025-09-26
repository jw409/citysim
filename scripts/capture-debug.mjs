#!/usr/bin/env node

/**
 * Standalone debug screenshot capture script
 * Usage: node scripts/capture-debug.mjs [prefix] [--comprehensive] [--full-page]
 */

import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const args = process.argv.slice(2);
const prefix = args[0] || 'debug';
const comprehensive = args.includes('--comprehensive');
const fullPage = args.includes('--full-page');

const TEMP_DIR = 'tests/temp-screenshots';
const DEFAULT_URL = 'http://localhost:5173';

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

function generateFilename(prefix, suffix = '') {
  let filename = prefix;

  if (suffix) {
    filename += `-${suffix}`;
  }

  const timestamp = new Date().toISOString()
    .replace(/[:]/g, '-')
    .replace(/\..+/, '')
    .replace('T', '_');
  filename += `_${timestamp}.png`;

  return path.join(TEMP_DIR, filename);
}

async function waitForStabilization(page, timeout = 1000) {
  await page.waitForTimeout(timeout);
}

async function rotateCamera(page, deltaX, deltaY) {
  await page.evaluate(({ deltaX, deltaY }) => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Simulate mouse drag to rotate camera
      canvas.dispatchEvent(new MouseEvent('mousedown', {
        clientX: centerX,
        clientY: centerY,
        button: 0,
        bubbles: true
      }));

      canvas.dispatchEvent(new MouseEvent('mousemove', {
        clientX: centerX + deltaX,
        clientY: centerY + deltaY,
        button: 0,
        bubbles: true
      }));

      canvas.dispatchEvent(new MouseEvent('mouseup', {
        clientX: centerX + deltaX,
        clientY: centerY + deltaY,
        button: 0,
        bubbles: true
      }));
    }
  }, { deltaX, deltaY });

  await waitForStabilization(page, 500);
}

async function zoomCamera(page, delta) {
  await page.evaluate((delta) => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      canvas.dispatchEvent(new WheelEvent('wheel', {
        clientX: centerX,
        clientY: centerY,
        deltaY: delta,
        bubbles: true
      }));
    }
  }, delta);

  await waitForStabilization(page, 300);
}

async function captureScreenshot(page, filepath, fullPage = false) {
  if (fullPage) {
    await page.screenshot({ path: filepath, fullPage: true });
  } else {
    const canvas = page.locator('canvas').first();
    await canvas.screenshot({ path: filepath });
  }
  console.log(`📸 Captured: ${filepath}`);
  return filepath;
}

async function saveMetadata(prefix, page, url) {
  const metadata = {
    timestamp: new Date().toISOString(),
    url: url,
    userAgent: await page.evaluate(() => navigator.userAgent),
    viewport: await page.viewportSize(),
    script: 'capture-debug.mjs',
    options: {
      prefix,
      comprehensive,
      fullPage
    }
  };

  const metadataPath = generateFilename(prefix, 'metadata').replace('.png', '.json');
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  console.log(`📋 Metadata: ${metadataPath}`);
  return metadataPath;
}

async function main() {
  console.log('🚀 Starting debug capture session...');
  console.log(`📂 Output directory: ${TEMP_DIR}`);
  console.log(`🏷️  Prefix: ${prefix}`);
  console.log(`📐 Mode: ${comprehensive ? 'comprehensive' : 'quick'} ${fullPage ? '(full page)' : '(canvas only)'}`);

  const browser = await chromium.launch({
    headless: false,
    args: ['--window-size=1920,1440']
  });

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1440 });

  try {
    console.log(`🌐 Navigating to ${DEFAULT_URL}...`);
    await page.goto(DEFAULT_URL);

    // Wait for app to load
    console.log('⏳ Waiting for app to load...');
    await page.waitForSelector('canvas', { timeout: 30000 });
    await waitForStabilization(page, 3000);

    const filepaths = [];

    // 1. Normal view
    console.log('📸 Capturing normal view...');
    const normalPath = generateFilename(prefix, 'normal');
    await captureScreenshot(page, normalPath, fullPage);
    filepaths.push(normalPath);

    // 2. Panned view - DRAMATIC rotation (90 degrees)
    console.log('📸 Capturing panned view...');
    await rotateCamera(page, 300, 0);
    await waitForStabilization(page, 1000);

    const pannedPath = generateFilename(prefix, 'panned');
    await captureScreenshot(page, pannedPath, fullPage);
    filepaths.push(pannedPath);

    // Reset rotation
    await rotateCamera(page, -300, 0);
    await waitForStabilization(page, 500);

    if (comprehensive) {
      // 3. Tilted view - DRAMATIC pitch change (bird's eye)
      console.log('📸 Capturing tilted view...');
      await rotateCamera(page, 0, 200);
      await waitForStabilization(page, 1000);

      const tiltedPath = generateFilename(prefix, 'tilted');
      await captureScreenshot(page, tiltedPath, fullPage);
      filepaths.push(tiltedPath);

      // Reset tilt
      await rotateCamera(page, 0, -200);
      await waitForStabilization(page, 500);

      // 4. EXTREME zoom out view (city becomes a pixel)
      console.log('📸 Capturing EXTREME zoom out view (city-as-pixel level)...');
      // Multiple scroll wheel events to zoom WAY out
      for (let i = 0; i < 15; i++) {
        await zoomCamera(page, 1000);
        await page.waitForTimeout(100);
      }
      await waitForStabilization(page, 2000);

      const zoomedPath = generateFilename(prefix, 'zoomed-out');
      await captureScreenshot(page, zoomedPath, fullPage);
      filepaths.push(zoomedPath);

      // Reset zoom by zooming back in
      for (let i = 0; i < 15; i++) {
        await zoomCamera(page, -1000);
        await page.waitForTimeout(100);
      }
      await waitForStabilization(page, 500);
    }

    // Save metadata
    await saveMetadata(prefix, page, DEFAULT_URL);

    console.log('\n✅ Capture completed successfully!');
    console.log(`📁 Files saved to: ${TEMP_DIR}`);
    console.log('📸 Screenshots captured:');
    filepaths.forEach(filepath => console.log(`   • ${path.basename(filepath)}`));

  } catch (error) {
    console.error('❌ Error during capture:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Handle CLI help
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Debug Screenshot Capture Tool

Usage: node scripts/capture-debug.mjs [prefix] [options]

Arguments:
  prefix              Filename prefix for screenshots (default: "debug")

Options:
  --comprehensive     Capture all angles (normal, panned, tilted, zoomed-out)
  --full-page         Capture full page instead of just canvas
  --help, -h          Show this help message

Examples:
  node scripts/capture-debug.mjs feature-test
  node scripts/capture-debug.mjs building-issue --comprehensive
  node scripts/capture-debug.mjs ui-layout --full-page
  node scripts/capture-debug.mjs bug-report --comprehensive --full-page

Screenshots are saved to: tests/temp-screenshots/
`);
  process.exit(0);
}

main().catch(console.error);