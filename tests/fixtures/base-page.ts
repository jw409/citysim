import { Page, Locator, expect } from '@playwright/test';

export class BasePage {
  readonly page: Page;

  // Core selectors
  readonly appTitle: Locator;
  readonly statusBar: Locator;
  readonly layersActiveIndicator: Locator;
  readonly viewport: Locator;
  readonly canvas: Locator;

  // UI Panels
  readonly cameraControlsPanel: Locator;
  readonly timeControlsPanel: Locator;
  readonly terrainControlsPanel: Locator;
  readonly performanceMonitorPanel: Locator;

  // Panel controls
  readonly cameraControlsToggle: Locator;
  readonly timeControlsToggle: Locator;
  readonly terrainControlsToggle: Locator;
  readonly performanceMonitorToggle: Locator;

  // Simulation controls
  readonly startSimulationButton: Locator;
  readonly pauseSimulationButton: Locator;
  readonly speedSlider: Locator;
  readonly simulationStatus: Locator;

  // Camera controls
  readonly overviewPresetButton: Locator;
  readonly streetPresetButton: Locator;
  readonly aerialPresetButton: Locator;
  readonly isometricPresetButton: Locator;
  readonly showZonesCheckbox: Locator;

  // Terrain controls
  readonly terrainProfileDropdown: Locator;
  readonly terrainSeedInput: Locator;
  readonly scaleSlider: Locator;
  readonly enableTerrainCheckbox: Locator;

  // Performance monitor
  readonly fpsDisplay: Locator;
  readonly memoryDisplay: Locator;
  readonly agentsCount: Locator;
  readonly timeDisplay: Locator;

  constructor(page: Page) {
    this.page = page;

    // Core selectors
    this.appTitle = page.locator('text=UrbanSynth');
    this.statusBar = page.locator('[class*="status-bar"]');
    this.layersActiveIndicator = page.locator('text=/\\d+ layers active/');
    this.viewport = page.locator('[class*="cityscape"], [class*="viewport"]');
    this.canvas = page.locator('canvas');

    // UI Panels
    this.cameraControlsPanel = page.locator('[class*="floating-panel"]:has-text("Camera Controls")');
    this.timeControlsPanel = page.locator('[class*="floating-panel"]:has-text("Time Controls")');
    this.terrainControlsPanel = page.locator('[class*="floating-panel"]:has-text("Terrain Controls")');
    this.performanceMonitorPanel = page.locator('[class*="floating-panel"]:has-text("Performance Monitor")');

    // Panel toggles (collapsed state)
    this.cameraControlsToggle = page.locator('text=📷 Camera Controls');
    this.timeControlsToggle = page.locator('text=⏱️ Time Controls');
    this.terrainControlsToggle = page.locator('text=🏔️ Terrain Controls');
    this.performanceMonitorToggle = page.locator('text=📊 Performance Monitor');

    // Simulation controls
    this.startSimulationButton = page.locator('button:has-text("START SIMULATION")');
    this.pauseSimulationButton = page.locator('button:has-text("PAUSE")');
    this.speedSlider = page.locator('input[type="range"]', { hasText: 'speed' });
    this.simulationStatus = page.locator('text=/Status: (Loading|Paused|Running)/');

    // Camera controls
    this.overviewPresetButton = page.locator('button:has-text("Overview")');
    this.streetPresetButton = page.locator('button:has-text("Street")');
    this.aerialPresetButton = page.locator('button:has-text("Aerial")');
    this.isometricPresetButton = page.locator('button:has-text("Isometric")');
    this.showZonesCheckbox = page.locator('input[type="checkbox"]:near(:has-text("Show Zones"))');

    // Terrain controls
    this.terrainProfileDropdown = page.locator('select').filter({ hasText: 'Manhattan' });
    this.terrainSeedInput = page.locator('input[type="text"]:near(:has-text("Terrain Seed"))');
    this.scaleSlider = page.locator('input[type="range"]:near(:has-text("Scale"))');
    this.enableTerrainCheckbox = page.locator('input[type="checkbox"]:near(:has-text("Enable Terrain"))');

    // Performance monitor
    this.fpsDisplay = page.locator('text=/FPS: \\d+/');
    this.memoryDisplay = page.locator('text=/Memory: [\\d.]+ KB/');
    this.agentsCount = page.locator('text=/Agents: \\d+/');
    this.timeDisplay = page.locator('text=/Time: [\\d.]+h/');
  }

  async goto() {
    await this.page.goto('/');
    await this.waitForInitialLoad();
  }

  async waitForInitialLoad() {
    // Wait for the app title
    await expect(this.appTitle).toBeVisible();

    // Wait for canvas to be rendered
    await expect(this.canvas).toBeVisible();

    // Wait for layers to be active (indicating city has loaded)
    await expect(this.layersActiveIndicator).toBeVisible({ timeout: 60_000 });

    // Small delay to ensure everything is settled
    await this.page.waitForTimeout(1000);
  }

  async getActiveLayerCount(): Promise<number> {
    const text = await this.layersActiveIndicator.textContent();
    const match = text?.match(/(\\d+) layers active/);
    return match ? parseInt(match[1], 10) : 0;
  }

  async waitForLayerCount(expectedCount: number, timeout: number = 30_000) {
    await expect(async () => {
      const count = await this.getActiveLayerCount();
      expect(count).toBe(expectedCount);
    }).toPass({ timeout });
  }

  async expandPanel(panelName: 'camera' | 'time' | 'terrain' | 'performance') {
    const toggleMap = {
      camera: this.cameraControlsToggle,
      time: this.timeControlsToggle,
      terrain: this.terrainControlsToggle,
      performance: this.performanceMonitorToggle
    };

    const toggle = toggleMap[panelName];
    if (await toggle.isVisible()) {
      await toggle.click();
      // Wait for panel to expand
      await this.page.waitForTimeout(500);
    }
  }

  async collapsePanel(panelName: 'camera' | 'time' | 'terrain' | 'performance') {
    const panelMap = {
      camera: this.cameraControlsPanel,
      time: this.timeControlsPanel,
      terrain: this.terrainControlsPanel,
      performance: this.performanceMonitorPanel
    };

    const panel = panelMap[panelName];
    if (await panel.isVisible()) {
      // Click the collapse button in the panel header
      await panel.locator('button:has-text("▲")').click();
      // Wait for panel to collapse
      await this.page.waitForTimeout(500);
    }
  }

  async startSimulation() {
    if (await this.startSimulationButton.isVisible()) {
      await this.startSimulationButton.click();
      await expect(this.simulationStatus).toHaveText(/Status: Running/);
    }
  }

  async pauseSimulation() {
    if (await this.pauseSimulationButton.isVisible()) {
      await this.pauseSimulationButton.click();
      await expect(this.simulationStatus).toHaveText(/Status: Paused/);
    }
  }

  async setSimulationSpeed(speed: number) {
    await this.speedSlider.fill(speed.toString());
  }

  async clickCameraPreset(preset: 'overview' | 'street' | 'aerial' | 'isometric') {
    const presetMap = {
      overview: this.overviewPresetButton,
      street: this.streetPresetButton,
      aerial: this.aerialPresetButton,
      isometric: this.isometricPresetButton
    };

    await this.expandPanel('camera');
    await presetMap[preset].click();

    // Wait for camera transition
    await this.page.waitForTimeout(1000);
  }

  async takeViewportScreenshot(name: string) {
    // Focus on the main viewport area
    return await this.viewport.screenshot({
      path: `tests/screenshots/${name}.png`,
      animations: 'disabled'
    });
  }

  async dragPanel(panelName: 'camera' | 'time' | 'terrain' | 'performance', deltaX: number, deltaY: number) {
    const panelMap = {
      camera: this.cameraControlsPanel,
      time: this.timeControlsPanel,
      terrain: this.terrainControlsPanel,
      performance: this.performanceMonitorPanel
    };

    const panel = panelMap[panelName];
    const header = panel.locator('[class*="panel-header"]');

    await header.dragTo(header, {
      targetPosition: { x: deltaX, y: deltaY }
    });
  }

  async waitForStableFramerate(minFps: number = 30, duration: number = 3000) {
    const startTime = Date.now();

    while (Date.now() - startTime < duration) {
      const fpsText = await this.fpsDisplay.textContent();
      const fps = parseInt(fpsText?.match(/FPS: (\\d+)/)?.[1] || '0', 10);

      if (fps < minFps) {
        await this.page.waitForTimeout(100);
        continue;
      }

      await this.page.waitForTimeout(100);
    }
  }

  async clearLocalStorage() {
    await this.page.evaluate(() => localStorage.clear());
  }

  async getPerformanceMetrics() {
    return await this.page.evaluate(() => {
      return {
        fps: parseInt(document.querySelector('[class*="fps"]')?.textContent?.match(/\\d+/)?.[0] || '0'),
        memory: parseFloat(document.querySelector('[class*="memory"]')?.textContent?.match(/[\\d.]+/)?.[0] || '0'),
        agents: parseInt(document.querySelector('[class*="agents"]')?.textContent?.match(/\\d+/)?.[0] || '0'),
        timestamp: Date.now()
      };
    });
  }
}