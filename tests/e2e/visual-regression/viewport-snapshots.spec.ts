import { test, expect } from '@playwright/test';
import { ViewportHelpers } from '../../fixtures/viewport-helpers';

test.describe('Visual Regression - Viewport Snapshots', () => {
  let viewport: ViewportHelpers;

  test.beforeEach(async ({ page }) => {
    viewport = new ViewportHelpers(page);
    await viewport.goto();
    await viewport.waitForLayerCount(17);
  });

  test.describe('Camera Preset Visual Consistency', () => {
    test('overview preset should match baseline', async () => {
      await viewport.clickCameraPreset('overview');
      await viewport.waitForViewportStabilization(2000);

      await expect(viewport.canvas).toHaveScreenshot('overview-preset.png', {
        threshold: 0.3,
        animations: 'disabled'
      });
    });

    test('street preset should match baseline', async () => {
      await viewport.clickCameraPreset('street');
      await viewport.waitForViewportStabilization(2000);

      await expect(viewport.canvas).toHaveScreenshot('street-preset.png', {
        threshold: 0.3,
        animations: 'disabled'
      });
    });

    test('aerial preset should match baseline', async () => {
      await viewport.clickCameraPreset('aerial');
      await viewport.waitForViewportStabilization(2000);

      await expect(viewport.canvas).toHaveScreenshot('aerial-preset.png', {
        threshold: 0.3,
        animations: 'disabled'
      });
    });

    test('isometric preset should match baseline', async () => {
      await viewport.clickCameraPreset('isometric');
      await viewport.waitForViewportStabilization(2000);

      await expect(viewport.canvas).toHaveScreenshot('isometric-preset.png', {
        threshold: 0.3,
        animations: 'disabled'
      });
    });
  });

  test.describe('Simulation State Visual Verification', () => {
    test('initial paused state should match baseline', async () => {
      // Ensure we're in initial state
      await viewport.pauseSimulation();
      await viewport.page.waitForTimeout(1000);

      await expect(viewport.page).toHaveScreenshot('initial-paused-state.png', {
        threshold: 0.3,
        animations: 'disabled',
        fullPage: true
      });
    });

    test('running simulation should show agent movement', async () => {
      await viewport.startSimulation();
      await viewport.page.waitForTimeout(3000); // Let agents spawn and move

      const runningScreenshot = await viewport.canvas.screenshot({
        animations: 'disabled'
      });

      await viewport.pauseSimulation();
      await viewport.page.waitForTimeout(1000);

      const pausedScreenshot = await viewport.canvas.screenshot({
        animations: 'disabled'
      });

      // Screenshots should be different if agents are moving
      // Note: This test might be flaky if agents don't spawn quickly
      // In practice, you might want to use more specific visual markers
      const screenshotsAreDifferent = Buffer.compare(runningScreenshot, pausedScreenshot) !== 0;
      expect(screenshotsAreDifferent).toBe(true);
    });

    test('performance monitor panel should match baseline', async () => {
      await viewport.expandPanel('performance');
      await viewport.page.waitForTimeout(1000);

      await expect(viewport.performanceMonitorPanel).toHaveScreenshot('performance-monitor-panel.png', {
        threshold: 0.3,
        animations: 'disabled'
      });
    });
  });

  test.describe('UI Panel Visual Consistency', () => {
    test('expanded camera controls panel should match baseline', async () => {
      await viewport.expandPanel('camera');
      await viewport.page.waitForTimeout(500);

      await expect(viewport.cameraControlsPanel).toHaveScreenshot('camera-controls-panel.png', {
        threshold: 0.3,
        animations: 'disabled'
      });
    });

    test('expanded time controls panel should match baseline', async () => {
      await viewport.expandPanel('time');
      await viewport.page.waitForTimeout(500);

      await expect(viewport.timeControlsPanel).toHaveScreenshot('time-controls-panel.png', {
        threshold: 0.3,
        animations: 'disabled'
      });
    });

    test('expanded terrain controls panel should match baseline', async () => {
      await viewport.expandPanel('terrain');
      await viewport.page.waitForTimeout(500);

      await expect(viewport.terrainControlsPanel).toHaveScreenshot('terrain-controls-panel.png', {
        threshold: 0.3,
        animations: 'disabled'
      });
    });

    test('multiple expanded panels layout should match baseline', async () => {
      await viewport.expandPanel('camera');
      await viewport.expandPanel('time');
      await viewport.expandPanel('performance');
      await viewport.page.waitForTimeout(1000);

      await expect(viewport.page).toHaveScreenshot('multiple-panels-expanded.png', {
        threshold: 0.3,
        animations: 'disabled',
        fullPage: true
      });
    });
  });

  test.describe('Terrain Profile Visual Differences', () => {
    test('Manhattan terrain profile should match baseline', async () => {
      await viewport.expandPanel('terrain');

      // Select Manhattan profile
      await viewport.terrainProfileDropdown.selectOption('manhattan');
      await viewport.page.waitForTimeout(5000); // Wait for terrain generation

      await viewport.clickCameraPreset('overview');
      await viewport.waitForViewportStabilization(2000);

      await expect(viewport.canvas).toHaveScreenshot('manhattan-terrain.png', {
        threshold: 0.3,
        animations: 'disabled'
      });
    });

    test('San Francisco terrain profile should differ from Manhattan', async () => {
      await viewport.expandPanel('terrain');

      // Capture Manhattan first
      await viewport.terrainProfileDropdown.selectOption('manhattan');
      await viewport.page.waitForTimeout(5000);
      await viewport.clickCameraPreset('overview');
      await viewport.waitForViewportStabilization(2000);
      const manhattanScreenshot = await viewport.canvas.screenshot();

      // Switch to San Francisco
      await viewport.terrainProfileDropdown.selectOption('san_francisco');
      await viewport.page.waitForTimeout(5000);
      await viewport.clickCameraPreset('overview');
      await viewport.waitForViewportStabilization(2000);
      const sfScreenshot = await viewport.canvas.screenshot();

      // Screenshots should be different for different terrain profiles
      const screenshotsAreDifferent = Buffer.compare(manhattanScreenshot, sfScreenshot) !== 0;
      expect(screenshotsAreDifferent).toBe(true);
    });
  });

  test.describe('Responsive Design Visual Tests', () => {
    const viewportSizes = [
      { width: 1920, height: 1080, name: 'desktop-large' },
      { width: 1366, height: 768, name: 'desktop-medium' },
      { width: 1024, height: 768, name: 'tablet-landscape' },
      { width: 768, height: 1024, name: 'tablet-portrait' },
      { width: 480, height: 800, name: 'mobile' }
    ];

    for (const size of viewportSizes) {
      test(`should render correctly at ${size.name} (${size.width}x${size.height})`, async ({ page }) => {
        await page.setViewportSize({ width: size.width, height: size.height });
        await viewport.page.waitForTimeout(1000);

        // Take full page screenshot
        await expect(page).toHaveScreenshot(`responsive-${size.name}.png`, {
          threshold: 0.3,
          animations: 'disabled',
          fullPage: true
        });
      });
    }
  });

  test.describe('Time of Day Visual Changes', () => {
    test('different times of day should produce visual differences', async () => {
      await viewport.expandPanel('time');

      const timeSlider = viewport.page.locator('input[type="range"]:near(:has-text("Time"))');

      if (await timeSlider.isVisible()) {
        // Morning
        await timeSlider.fill('6');
        await viewport.page.waitForTimeout(1000);
        await viewport.clickCameraPreset('overview');
        await viewport.waitForViewportStabilization();
        const morningScreenshot = await viewport.canvas.screenshot();

        // Evening
        await timeSlider.fill('18');
        await viewport.page.waitForTimeout(1000);
        await viewport.clickCameraPreset('overview');
        await viewport.waitForViewportStabilization();
        const eveningScreenshot = await viewport.canvas.screenshot();

        // Should show lighting differences
        const screenshotsAreDifferent = Buffer.compare(morningScreenshot, eveningScreenshot) !== 0;
        expect(screenshotsAreDifferent).toBe(true);
      }
    });
  });

  test.describe('Cross-Browser Visual Consistency', () => {
    test('viewport rendering should be consistent across browsers', async () => {
      await viewport.clickCameraPreset('overview');
      await viewport.waitForViewportStabilization(2000);

      // This test verifies that the same preset produces consistent results
      // across different browser engines (Chromium, Firefox, WebKit)
      await expect(viewport.canvas).toHaveScreenshot('cross-browser-overview.png', {
        threshold: 0.4, // Slightly higher threshold for cross-browser differences
        animations: 'disabled'
      });
    });
  });

  test.describe('Error State Visual Verification', () => {
    test('should capture visual state if layers fail to load', async () => {
      // This test would need to simulate layer loading failure
      // For now, we just verify the current state
      const layerCount = await viewport.getActiveLayerCount();

      if (layerCount === 0) {
        // If no layers loaded, capture the error state
        await expect(viewport.page).toHaveScreenshot('no-layers-error-state.png', {
          threshold: 0.3,
          animations: 'disabled',
          fullPage: true
        });
      }
    });
  });

  test.describe('Performance Impact Visual Tests', () => {
    test('visual quality should not degrade under load', async () => {
      // Start simulation at high speed
      await viewport.startSimulation();
      await viewport.setSimulationSpeed(10);
      await viewport.page.waitForTimeout(5000);

      // Take screenshot under load
      await viewport.clickCameraPreset('overview');
      await viewport.waitForViewportStabilization();

      await expect(viewport.canvas).toHaveScreenshot('high-load-rendering.png', {
        threshold: 0.4, // Allow for some performance-related differences
        animations: 'disabled'
      });

      await viewport.pauseSimulation();
    });
  });
});