import { Page, expect } from '@playwright/test';
import { BasePage } from '../fixtures/base-page';
import * as fs from 'fs';
import * as path from 'path';

export interface DiagnosisReport {
  timestamp: string;
  url: string;
  logs: string[];
  errors: string[];
  networkRequests: NetworkRequest[];
  dom: DOMInspection;
  javascript: JavaScriptEnvironment;
  performance: PerformanceMetrics;
}

export interface NetworkRequest {
  url: string;
  status: number;
  ok: boolean;
  timestamp: string;
}

export interface DOMInspection {
  rootExists: boolean;
  canvasCount: number;
  reactComponents: number;
  bodyContentLength: number;
  stylesheets: number;
}

export interface JavaScriptEnvironment {
  reactAvailable: boolean;
  deckglAvailable: boolean;
  windowSize: { width: number; height: number };
  errors?: string;
}

export interface PerformanceMetrics {
  fps: number;
  memory: number;
  agents: number;
  timestamp: number;
}

export class DebugHelpers extends BasePage {
  private logs: string[] = [];
  private errors: string[] = [];
  private networkRequests: NetworkRequest[] = [];

  constructor(page: Page) {
    super(page);
    this.setupLogging();
  }

  private setupLogging() {
    // Console logging
    this.page.on('console', msg => {
      const log = `[${msg.type().toUpperCase()}] ${msg.text()}`;
      this.logs.push(log);
      console.log(log);
    });

    // Error tracking
    this.page.on('pageerror', error => {
      const errorLog = `[PAGE ERROR] ${error.message}`;
      this.errors.push(errorLog);
      console.error(errorLog);
    });

    // Network monitoring
    this.page.on('response', response => {
      const req: NetworkRequest = {
        url: response.url(),
        status: response.status(),
        ok: response.ok(),
        timestamp: new Date().toISOString()
      };
      this.networkRequests.push(req);

      if (!response.ok()) {
        console.warn(`[FAILED REQUEST] ${response.status()} ${response.url()}`);
      }
    });
  }

  /**
   * Run comprehensive diagnosis of the application state
   */
  async runDiagnosis(): Promise<DiagnosisReport> {
    console.log('🔍 Running comprehensive diagnosis...');

    const diagnosis: DiagnosisReport = {
      timestamp: new Date().toISOString(),
      url: this.page.url(),
      logs: [...this.logs],
      errors: [...this.errors],
      networkRequests: [...this.networkRequests],
      dom: await this.inspectDOM(),
      javascript: await this.inspectJavaScript(),
      performance: await this.getPerformanceMetrics()
    };

    console.log('\n📊 Diagnosis Results:');
    console.log(`- Console logs: ${diagnosis.logs.length}`);
    console.log(`- Errors: ${diagnosis.errors.length}`);
    console.log(`- Failed requests: ${diagnosis.networkRequests.filter(r => !r.ok).length}`);
    console.log(`- Canvas elements: ${diagnosis.dom.canvasCount}`);
    console.log(`- React available: ${diagnosis.javascript.reactAvailable}`);
    console.log(`- Current FPS: ${diagnosis.performance.fps}`);

    return diagnosis;
  }

  private async inspectDOM(): Promise<DOMInspection> {
    try {
      const rootExists = await this.page.locator('#root').count() > 0;
      const canvasCount = await this.page.locator('canvas').count();
      const reactComponents = await this.page.locator('[data-reactroot], .App, main').count();
      const stylesheets = await this.page.locator('link[rel="stylesheet"]').count();

      const bodyContent = await this.page.locator('body').innerHTML();
      const bodyContentLength = bodyContent.length;

      return {
        rootExists,
        canvasCount,
        reactComponents,
        bodyContentLength,
        stylesheets
      };
    } catch (e) {
      console.warn('DOM inspection failed:', e);
      return {
        rootExists: false,
        canvasCount: 0,
        reactComponents: 0,
        bodyContentLength: 0,
        stylesheets: 0
      };
    }
  }

  private async inspectJavaScript(): Promise<JavaScriptEnvironment> {
    try {
      return await this.page.evaluate(() => ({
        reactAvailable: typeof window.React !== 'undefined',
        deckglAvailable: typeof window.DeckGL !== 'undefined',
        windowSize: { width: window.innerWidth, height: window.innerHeight }
      }));
    } catch (e) {
      return {
        reactAvailable: false,
        deckglAvailable: false,
        windowSize: { width: 0, height: 0 },
        errors: e instanceof Error ? e.message : 'Unknown error'
      };
    }
  }

  /**
   * Test all camera presets and capture screenshots
   */
  async testCameraPresets(): Promise<string[]> {
    console.log('🎯 Testing camera presets...');
    const presets = ['overview', 'street', 'aerial', 'isometric'] as const;
    const screenshots: string[] = [];

    for (const preset of presets) {
      try {
        console.log(`Testing ${preset} preset...`);
        await this.clickCameraPreset(preset);
        await this.waitForViewportStabilization(2000);

        const timestamp = new Date().toISOString().replace(/[:]/g, '-').replace(/\..+/, '');
        const filename = `preset-${preset}-${timestamp}.png`;
        const filepath = path.join('tests/temp-screenshots', filename);

        await this.canvas.screenshot({ path: filepath });
        screenshots.push(filepath);
        console.log(`✅ ${preset} preset captured`);
      } catch (e) {
        console.warn(`Failed to test ${preset} preset: ${e}`);
      }
    }

    return screenshots;
  }

  /**
   * Test simulation controls and state changes
   */
  async testSimulationControls(): Promise<{ actions: string[]; screenshots: string[] }> {
    console.log('▶️  Testing simulation controls...');
    const actions: string[] = [];
    const screenshots: string[] = [];

    try {
      // Test starting simulation
      await this.startSimulation();
      actions.push('Started simulation');
      await this.page.waitForTimeout(3000); // Let agents spawn

      let filepath = await this.captureTimestampedScreenshot('simulation-running');
      screenshots.push(filepath);

      // Test pausing simulation
      await this.pauseSimulation();
      actions.push('Paused simulation');
      await this.page.waitForTimeout(1000);

      filepath = await this.captureTimestampedScreenshot('simulation-paused');
      screenshots.push(filepath);

      // Test speed changes
      if (await this.speedSlider.isVisible()) {
        await this.setSimulationSpeed(5);
        actions.push('Set speed to 5x');
        await this.page.waitForTimeout(1000);

        filepath = await this.captureTimestampedScreenshot('simulation-speed-5x');
        screenshots.push(filepath);
      }

    } catch (e) {
      console.warn(`Simulation control test failed: ${e}`);
    }

    return { actions, screenshots };
  }

  /**
   * Test UI panel interactions
   */
  async testPanelInteractions(): Promise<string[]> {
    console.log('🎛️  Testing panel interactions...');
    const screenshots: string[] = [];
    const panels = ['camera', 'time', 'terrain', 'performance'] as const;

    for (const panel of panels) {
      try {
        // Test expand
        await this.expandPanel(panel);
        await this.page.waitForTimeout(500);

        let filepath = await this.captureTimestampedScreenshot(`panel-${panel}-expanded`);
        screenshots.push(filepath);

        // Test collapse
        await this.collapsePanel(panel);
        await this.page.waitForTimeout(500);

        filepath = await this.captureTimestampedScreenshot(`panel-${panel}-collapsed`);
        screenshots.push(filepath);

      } catch (e) {
        console.warn(`Panel ${panel} test failed: ${e}`);
      }
    }

    return screenshots;
  }

  /**
   * Capture screenshot with timestamp
   */
  async captureTimestampedScreenshot(prefix: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:]/g, '-').replace(/\..+/, '');
    const filename = `${prefix}-${timestamp}.png`;
    const filepath = path.join('tests/temp-screenshots', filename);

    await this.canvas.screenshot({ path: filepath });
    return filepath;
  }

  /**
   * Wait for viewport to stabilize after camera movements
   */
  async waitForViewportStabilization(timeout: number = 2000) {
    await this.page.waitForTimeout(timeout);
    await expect(this.layersActiveIndicator).toBeVisible();
  }

  /**
   * Save diagnosis report to file
   */
  saveDiagnosisReport(diagnosis: DiagnosisReport, filename?: string): string {
    const timestamp = new Date().toISOString().replace(/[:]/g, '-').replace(/\..+/, '');
    const reportFilename = filename || `diagnosis-${timestamp}.json`;
    const filepath = path.join('tests/temp-screenshots', reportFilename);

    // Ensure directory exists
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filepath, JSON.stringify(diagnosis, null, 2));
    console.log(`📋 Diagnosis report saved: ${filepath}`);
    return filepath;
  }

  /**
   * Run comprehensive test suite
   */
  async runComprehensiveTest(): Promise<{
    diagnosis: DiagnosisReport;
    presetScreenshots: string[];
    simulationTest: { actions: string[]; screenshots: string[] };
    panelScreenshots: string[];
  }> {
    console.log('🚀 Running comprehensive test suite...');

    const diagnosis = await this.runDiagnosis();
    const presetScreenshots = await this.testCameraPresets();
    const simulationTest = await this.testSimulationControls();
    const panelScreenshots = await this.testPanelInteractions();

    // Save comprehensive report
    const report = {
      diagnosis,
      presetScreenshots,
      simulationTest,
      panelScreenshots,
      timestamp: new Date().toISOString()
    };

    const reportPath = path.join('tests/temp-screenshots', `comprehensive-test-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📊 Comprehensive test report saved: ${reportPath}`);

    return report;
  }

  /**
   * Clear accumulated logs and start fresh
   */
  clearLogs() {
    this.logs = [];
    this.errors = [];
    this.networkRequests = [];
  }
}

/**
 * Factory function to create debug helpers
 */
export function createDebugHelpers(page: Page): DebugHelpers {
  return new DebugHelpers(page);
}