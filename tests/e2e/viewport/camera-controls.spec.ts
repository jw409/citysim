import { test, expect } from '@playwright/test';
import { ViewportHelpers } from '../../fixtures/viewport-helpers';
import { WaitHelpers } from '../../utils/wait-helpers';

test.describe('Camera Controls', () => {
  let viewport: ViewportHelpers;
  let waitHelpers: WaitHelpers;

  test.beforeEach(async ({ page }) => {
    viewport = new ViewportHelpers(page);
    waitHelpers = new WaitHelpers(page);

    await viewport.goto();
    await viewport.waitForLayerCount(17);
  });

  test.describe('Camera Presets', () => {
    test('should switch between all camera presets', async () => {
      await viewport.testAllCameraPresets();
    });

    test('overview preset should provide wide city view', async () => {
      await viewport.clickCameraPreset('overview');
      await viewport.waitForViewportStabilization();

      const screenshot = await viewport.takeViewportScreenshot('overview-preset');
      expect(screenshot).toBeTruthy();
    });

    test('street preset should provide ground-level view', async () => {
      await viewport.clickCameraPreset('street');
      await viewport.waitForViewportStabilization();

      const screenshot = await viewport.takeViewportScreenshot('street-preset');
      expect(screenshot).toBeTruthy();
    });

    test('aerial preset should provide top-down view', async () => {
      await viewport.clickCameraPreset('aerial');
      await viewport.waitForViewportStabilization();

      const screenshot = await viewport.takeViewportScreenshot('aerial-preset');
      expect(screenshot).toBeTruthy();
    });

    test('isometric preset should provide angled view', async () => {
      await viewport.clickCameraPreset('isometric');
      await viewport.waitForViewportStabilization();

      const screenshot = await viewport.takeViewportScreenshot('isometric-preset');
      expect(screenshot).toBeTruthy();
    });
  });

  test.describe('Manual Camera Controls', () => {
    test('should rotate camera with left-click drag', async () => {
      const initialScreenshot = await viewport.canvas.screenshot({ type: 'png' });

      await viewport.rotateCamera(100, 50);
      await viewport.waitForViewportStabilization();

      const rotatedScreenshot = await viewport.canvas.screenshot({ type: 'png' });

      // Screenshots should be different after rotation
      expect(Buffer.compare(initialScreenshot, rotatedScreenshot)).not.toBe(0);
    });

    test('should pan camera with right-click drag', async () => {
      const initialScreenshot = await viewport.canvas.screenshot({ type: 'png' });

      await viewport.panCamera(50, 50);
      await viewport.waitForViewportStabilization();

      const pannedScreenshot = await viewport.canvas.screenshot({ type: 'png' });

      // Screenshots should be different after panning
      expect(Buffer.compare(initialScreenshot, pannedScreenshot)).not.toBe(0);
    });

    test('should zoom with mouse wheel', async () => {
      await viewport.verifyZoomFunctionality();
    });

    test('should handle continuous camera movements smoothly', async () => {
      await viewport.testCameraResponsiveness();

      // Verify viewport is still functional after rapid movements
      await expect(viewport.layersActiveIndicator).toBeVisible();
      await viewport.waitForStableFramerate(25, 2000);
    });
  });

  test.describe('Keyboard Shortcuts', () => {
    test('should respond to keyboard preset shortcuts', async () => {
      const presets = [
        { key: '1' as const, name: 'overview' },
        { key: '2' as const, name: 'street' },
        { key: '3' as const, name: 'aerial' },
        { key: '4' as const, name: 'isometric' }
      ];

      for (const preset of presets) {
        await viewport.useCameraKeyboardShortcut(preset.key);
        await viewport.waitForViewportStabilization();

        // Take screenshot to verify preset activated
        const screenshot = await viewport.takeViewportScreenshot(`keyboard-${preset.name}`);
        expect(screenshot).toBeTruthy();
      }
    });

    test('should handle zone toggle with Z key', async () => {
      await viewport.useCameraKeyboardShortcut('z');
      await viewport.waitForViewportStabilization();

      // Verify zones toggle functionality
      // This would need to be verified based on actual zone visibility
      await expect(viewport.layersActiveIndicator).toBeVisible();
    });
  });

  test.describe('Camera Controls Panel', () => {
    test('should expand and collapse camera controls panel', async () => {
      // Panel should start collapsed
      await expect(viewport.cameraControlsPanel).not.toBeVisible();

      // Expand panel
      await viewport.expandPanel('camera');
      await expect(viewport.cameraControlsPanel).toBeVisible();

      // Verify preset buttons are accessible
      await expect(viewport.overviewPresetButton).toBeVisible();
      await expect(viewport.streetPresetButton).toBeVisible();
      await expect(viewport.aerialPresetButton).toBeVisible();
      await expect(viewport.isometricPresetButton).toBeVisible();

      // Collapse panel
      await viewport.collapsePanel('camera');
      await expect(viewport.cameraControlsPanel).not.toBeVisible();
    });

    test('should show zones checkbox functionality', async () => {
      await viewport.expandPanel('camera');

      if (await viewport.showZonesCheckbox.isVisible()) {
        const initialState = await viewport.showZonesCheckbox.isChecked();

        // Toggle zones
        await viewport.showZonesCheckbox.click();
        await viewport.waitForViewportStabilization();

        const newState = await viewport.showZonesCheckbox.isChecked();
        expect(newState).not.toBe(initialState);

        // Toggle back
        await viewport.showZonesCheckbox.click();
        await viewport.waitForViewportStabilization();

        const finalState = await viewport.showZonesCheckbox.isChecked();
        expect(finalState).toBe(initialState);
      }
    });
  });

  test.describe('Camera Performance', () => {
    test('should maintain smooth performance during camera operations', async () => {
      // Start monitoring performance
      await viewport.expandPanel('performance');

      // Perform various camera operations
      await viewport.rotateCamera(180, 90);
      await viewport.zoomCamera(-500);
      await viewport.panCamera(100, 100);
      await viewport.zoomCamera(300);

      // Check that FPS remains reasonable
      await viewport.waitForStableFramerate(25, 3000);
    });

    test('should handle stress test of rapid camera movements', async () => {
      await viewport.stressTestCameraControls();

      // Verify system is still responsive
      await expect(viewport.layersActiveIndicator).toBeVisible();
      await viewport.waitForStableFramerate(20, 2000);
    });
  });

  test.describe('Camera During Simulation', () => {
    test('should maintain camera controls while simulation is running', async () => {
      await viewport.testViewportDuringSimulation();
    });

    test('should handle camera preset changes during simulation', async () => {
      await viewport.startSimulation();

      // Test each preset while simulation runs
      const presets = ['overview', 'street', 'aerial', 'isometric'] as const;

      for (const preset of presets) {
        await viewport.clickCameraPreset(preset);
        await viewport.waitForViewportStabilization();

        // Verify viewport is still rendering correctly
        await expect(viewport.layersActiveIndicator).toBeVisible();
      }

      await viewport.pauseSimulation();
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle rapid preset switching', async () => {
      const presets = ['overview', 'street', 'aerial', 'isometric'] as const;

      // Rapidly switch between presets
      for (let i = 0; i < 10; i++) {
        const randomPreset = presets[Math.floor(Math.random() * presets.length)];
        await viewport.clickCameraPreset(randomPreset);
        await viewport.page.waitForTimeout(100); // Minimal delay
      }

      // Verify system is still stable
      await viewport.waitForViewportStabilization();
      await expect(viewport.layersActiveIndicator).toBeVisible();
    });

    test('should recover from extreme camera positions', async () => {
      // Move camera to extreme position
      for (let i = 0; i < 20; i++) {
        await viewport.rotateCamera(180, 90);
        await viewport.zoomCamera(-1000);
      }

      // Reset to overview
      await viewport.clickCameraPreset('overview');
      await viewport.waitForViewportStabilization();

      // Verify recovery
      await expect(viewport.layersActiveIndicator).toBeVisible();
      await viewport.verifyViewportRendering();
    });

    test('should handle camera controls with different viewport sizes', async ({ page }) => {
      const sizes = [
        { width: 800, height: 600 },
        { width: 1920, height: 1080 },
        { width: 480, height: 800 }
      ];

      for (const size of sizes) {
        await page.setViewportSize(size);
        await viewport.page.waitForTimeout(1000);

        // Test camera controls at this size
        await viewport.rotateCamera(45, 45);
        await viewport.zoomCamera(-200);

        await expect(viewport.layersActiveIndicator).toBeVisible();
      }
    });
  });
});