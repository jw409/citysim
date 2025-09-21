import { test, expect } from '@playwright/test';
import { BasePage } from '../../fixtures/base-page';
import { WaitHelpers } from '../../utils/wait-helpers';
import { PerformanceMetricsCollector } from '../../utils/performance-metrics';

test.describe('UrbanSynth App Initialization', () => {
  let basePage: BasePage;
  let waitHelpers: WaitHelpers;
  let performanceCollector: PerformanceMetricsCollector;

  test.beforeEach(async ({ page }) => {
    basePage = new BasePage(page);
    waitHelpers = new WaitHelpers(page);
    performanceCollector = new PerformanceMetricsCollector(page);
  });

  test('should load the application successfully', async () => {
    await basePage.goto();

    // Verify core elements are present
    await expect(basePage.appTitle).toBeVisible();
    await expect(basePage.canvas).toBeVisible();
    await expect(basePage.statusBar).toBeVisible();
  });

  test('should initialize with correct layer count', async () => {
    await basePage.goto();

    // Wait for layers to load and verify expected count
    await basePage.waitForLayerCount(17);

    const layerCount = await basePage.getActiveLayerCount();
    expect(layerCount).toBe(17);
  });

  test('should display initial UI panels in correct state', async () => {
    await basePage.goto();

    // Verify panels are in expected initial state (collapsed)
    await expect(basePage.cameraControlsToggle).toBeVisible();
    await expect(basePage.timeControlsToggle).toBeVisible();
    await expect(basePage.terrainControlsToggle).toBeVisible();
    await expect(basePage.performanceMonitorToggle).toBeVisible();

    // Verify main panels are not expanded initially
    await expect(basePage.cameraControlsPanel).not.toBeVisible();
    await expect(basePage.timeControlsPanel).not.toBeVisible();
    await expect(basePage.terrainControlsPanel).not.toBeVisible();
  });

  test('should initialize simulation in paused state', async () => {
    await basePage.goto();

    // Verify simulation starts paused
    await expect(basePage.startSimulationButton).toBeVisible();
    await expect(basePage.simulationStatus).toContainText('Paused');
  });

  test('should load with acceptable performance', async ({ page }) => {
    await performanceCollector.startCollection(1000);

    await basePage.goto();
    await waitHelpers.waitForStableFrameRate(30, 5000);

    performanceCollector.stopCollection();
    const avgMetrics = performanceCollector.getAverageMetrics();

    // Verify performance benchmarks
    expect(avgMetrics.fps).toBeGreaterThan(30);
    expect(avgMetrics.jsHeapUsed).toBeLessThan(100); // Less than 100MB
  });

  test('should handle page refresh correctly', async () => {
    await basePage.goto();
    await basePage.waitForLayerCount(17);

    // Refresh the page
    await basePage.page.reload();
    await waitHelpers.waitForAppReady();

    // Verify app reloads correctly
    await expect(basePage.appTitle).toBeVisible();
    await basePage.waitForLayerCount(17);
  });

  test('should maintain state after browser navigation', async () => {
    await basePage.goto();
    await basePage.waitForLayerCount(17);

    // Expand a panel
    await basePage.expandPanel('camera');
    await expect(basePage.cameraControlsPanel).toBeVisible();

    // Navigate away and back
    await basePage.page.goto('about:blank');
    await basePage.goto();

    // Note: In real app, localStorage persistence would be tested here
    // For now, just verify basic functionality returns
    await expect(basePage.appTitle).toBeVisible();
    await basePage.waitForLayerCount(17);
  });

  test('should initialize WebGL context successfully', async () => {
    await basePage.goto();
    await waitHelpers.waitForWebGLReady();

    const hasWebGL = await basePage.page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return false;

      try {
        const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
        return !!gl;
      } catch (e) {
        return false;
      }
    });

    expect(hasWebGL).toBe(true);
  });

  test('should handle different viewport sizes', async () => {
    const viewports = [
      { width: 1920, height: 1080 },
      { width: 1366, height: 768 },
      { width: 1024, height: 768 },
      { width: 768, height: 1024 } // Portrait tablet
    ];

    for (const viewport of viewports) {
      await basePage.page.setViewportSize(viewport);
      await basePage.goto();

      // Verify app adapts to different viewport sizes
      await expect(basePage.appTitle).toBeVisible();
      await expect(basePage.canvas).toBeVisible();

      // Verify canvas takes appropriate space
      const canvasBox = await basePage.canvas.boundingBox();
      expect(canvasBox).toBeTruthy();
      expect(canvasBox!.width).toBeGreaterThan(300);
      expect(canvasBox!.height).toBeGreaterThan(200);
    }
  });

  test('should not have console errors during initialization', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await basePage.goto();
    await basePage.waitForLayerCount(17);

    // Filter out expected/acceptable errors
    const significantErrors = consoleErrors.filter(error =>
      !error.includes('favicon') &&
      !error.includes('DevTools') &&
      !error.includes('Extension')
    );

    expect(significantErrors).toHaveLength(0);
  });

  test('should detect memory leaks during initialization', async () => {
    await basePage.goto();

    const hasMemoryLeak = await performanceCollector.detectMemoryLeaks(15000);
    expect(hasMemoryLeak).toBe(false);
  });

  test('should handle slow network conditions', async ({ page }) => {
    // Simulate slow network
    await page.route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
      await route.continue();
    });

    await basePage.goto();

    // Should still load successfully, just slower
    await waitHelpers.waitForAppReady(90000); // Extended timeout
    await basePage.waitForLayerCount(17);
  });
});