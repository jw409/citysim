import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class ViewportHelpers extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Perform camera rotation by dragging on the viewport
   */
  async rotateCamera(deltaX: number, deltaY: number) {
    const canvas = this.canvas;
    const canvasBox = await canvas.boundingBox();

    if (!canvasBox) throw new Error('Canvas not found');

    const centerX = canvasBox.x + canvasBox.width / 2;
    const centerY = canvasBox.y + canvasBox.height / 2;

    // Left-click and drag to rotate in OrbitView
    await this.page.mouse.move(centerX, centerY);
    await this.page.mouse.down({ button: 'left' });
    await this.page.mouse.move(centerX + deltaX, centerY + deltaY, { steps: 10 });
    await this.page.mouse.up({ button: 'left' });

    // Wait for camera transition to settle
    await this.page.waitForTimeout(500);
  }

  /**
   * Perform camera panning by right-click dragging
   */
  async panCamera(deltaX: number, deltaY: number) {
    const canvas = this.canvas;
    const canvasBox = await canvas.boundingBox();

    if (!canvasBox) throw new Error('Canvas not found');

    const centerX = canvasBox.x + canvasBox.width / 2;
    const centerY = canvasBox.y + canvasBox.height / 2;

    // Right-click and drag to pan
    await this.page.mouse.move(centerX, centerY);
    await this.page.mouse.down({ button: 'right' });
    await this.page.mouse.move(centerX + deltaX, centerY + deltaY, { steps: 10 });
    await this.page.mouse.up({ button: 'right' });

    // Wait for camera transition to settle
    await this.page.waitForTimeout(500);
  }

  /**
   * Zoom using mouse wheel
   */
  async zoomCamera(zoomDelta: number) {
    const canvas = this.canvas;
    const canvasBox = await canvas.boundingBox();

    if (!canvasBox) throw new Error('Canvas not found');

    const centerX = canvasBox.x + canvasBox.width / 2;
    const centerY = canvasBox.y + canvasBox.height / 2;

    // Move to canvas center and zoom
    await this.page.mouse.move(centerX, centerY);
    await this.page.mouse.wheel(0, zoomDelta);

    // Wait for zoom transition to settle
    await this.page.waitForTimeout(300);
  }

  /**
   * Simulate keyboard camera controls
   */
  async useCameraKeyboardShortcut(key: '1' | '2' | '3' | '4' | 'z') {
    await this.page.keyboard.press(key);
    await this.page.waitForTimeout(1000); // Wait for preset transition
  }

  /**
   * Test camera responsiveness by performing a series of movements
   */
  async testCameraResponsiveness() {
    const movements = [
      { action: 'rotate', x: 100, y: 0 },
      { action: 'rotate', x: -100, y: 0 },
      { action: 'rotate', x: 0, y: 100 },
      { action: 'rotate', x: 0, y: -100 },
      { action: 'zoom', delta: -300 },
      { action: 'zoom', delta: 300 },
      { action: 'pan', x: 50, y: 50 },
      { action: 'pan', x: -50, y: -50 }
    ];

    for (const movement of movements) {
      switch (movement.action) {
        case 'rotate':
          await this.rotateCamera(movement.x, movement.y);
          break;
        case 'zoom':
          await this.zoomCamera(movement.delta);
          break;
        case 'pan':
          await this.panCamera(movement.x, movement.y);
          break;
      }
    }
  }

  /**
   * Click on a specific object in the viewport
   */
  async clickOnViewportObject(x: number, y: number) {
    const canvas = this.canvas;
    const canvasBox = await canvas.boundingBox();

    if (!canvasBox) throw new Error('Canvas not found');

    await this.page.mouse.click(canvasBox.x + x, canvasBox.y + y);
    await this.page.waitForTimeout(200);
  }

  /**
   * Verify that the viewport is rendering correctly
   */
  async verifyViewportRendering() {
    // Check that canvas is visible and has content
    await expect(this.canvas).toBeVisible();

    // Verify layer count indicates content is loaded
    const layerCount = await this.getActiveLayerCount();
    expect(layerCount).toBeGreaterThan(0);

    // Take a screenshot to verify visual content
    const screenshot = await this.canvas.screenshot({ type: 'png' });
    expect(screenshot.length).toBeGreaterThan(1000); // Should have substantial content
  }

  /**
   * Wait for viewport to stabilize after camera movement
   */
  async waitForViewportStabilization(timeout: number = 2000) {
    // Wait for any ongoing animations to complete
    await this.page.waitForTimeout(timeout);

    // Verify layers are still active
    await expect(this.layersActiveIndicator).toBeVisible();
  }

  /**
   * Get current camera view bounds or state (if exposed by the app)
   */
  async getCameraState() {
    return await this.page.evaluate(() => {
      // This would need to be implemented based on how the app exposes camera state
      // For now, return a placeholder
      return {
        zoom: 12,
        rotation: 0,
        pitch: 45,
        bearing: 0
      };
    });
  }

  /**
   * Verify that zooming works by checking visual changes
   */
  async verifyZoomFunctionality() {
    // Take screenshot at initial zoom
    const initialScreenshot = await this.canvas.screenshot({ type: 'png' });

    // Zoom in
    await this.zoomCamera(-500);
    const zoomedInScreenshot = await this.canvas.screenshot({ type: 'png' });

    // Zoom out
    await this.zoomCamera(1000);
    const zoomedOutScreenshot = await this.canvas.screenshot({ type: 'png' });

    // Verify screenshots are different (indicating zoom worked)
    expect(Buffer.compare(initialScreenshot, zoomedInScreenshot)).not.toBe(0);
    expect(Buffer.compare(initialScreenshot, zoomedOutScreenshot)).not.toBe(0);
  }

  /**
   * Test all camera presets and verify they produce different views
   */
  async testAllCameraPresets() {
    const presets = ['overview', 'street', 'aerial', 'isometric'] as const;
    const screenshots: Buffer[] = [];

    for (const preset of presets) {
      await this.clickCameraPreset(preset);
      await this.waitForViewportStabilization(1500);

      const screenshot = await this.canvas.screenshot({ type: 'png' });
      screenshots.push(screenshot);
    }

    // Verify all presets produce different views
    for (let i = 0; i < screenshots.length; i++) {
      for (let j = i + 1; j < screenshots.length; j++) {
        expect(Buffer.compare(screenshots[i], screenshots[j])).not.toBe(0);
      }
    }
  }

  /**
   * Stress test camera controls with rapid movements
   */
  async stressTestCameraControls() {
    const movements = 50;

    for (let i = 0; i < movements; i++) {
      const randomAction = Math.random();

      if (randomAction < 0.33) {
        await this.rotateCamera(
          Math.random() * 200 - 100,
          Math.random() * 200 - 100
        );
      } else if (randomAction < 0.66) {
        await this.zoomCamera(Math.random() * 1000 - 500);
      } else {
        await this.panCamera(
          Math.random() * 100 - 50,
          Math.random() * 100 - 50
        );
      }

      // Short pause between movements
      await this.page.waitForTimeout(50);
    }

    // Verify viewport is still responsive after stress test
    await this.waitForViewportStabilization();
    await expect(this.layersActiveIndicator).toBeVisible();
  }

  /**
   * Test viewport interaction during simulation
   */
  async testViewportDuringSimulation() {
    // Start simulation
    await this.startSimulation();

    // Perform camera movements while simulation is running
    await this.rotateCamera(90, 45);
    await this.zoomCamera(-200);
    await this.panCamera(30, 30);

    // Verify viewport remains responsive
    await this.waitForViewportStabilization();
    await expect(this.layersActiveIndicator).toBeVisible();

    // Pause simulation
    await this.pauseSimulation();
  }
}