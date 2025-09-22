import { Page, Locator } from '@playwright/test';
import { ViewportHelpers } from '../fixtures/viewport-helpers';
import * as fs from 'fs';
import * as path from 'path';

export interface CaptureConfig {
  prefix: string;
  timestamp?: boolean;
  fullPage?: boolean;
  directory?: string;
}

export interface MultiAngleConfig extends CaptureConfig {
  angles: {
    normal?: boolean;
    panned?: boolean;
    tilted?: boolean;
    zoomedOut?: boolean;
  };
  panDelta?: number;
  tiltDelta?: number;
  zoomDelta?: number;
}

export class ScreenshotHelpers {
  private viewport: ViewportHelpers;
  private tempDir: string;

  constructor(page: Page, tempDir = 'tests/temp-screenshots') {
    this.viewport = new ViewportHelpers(page);
    this.tempDir = tempDir;
    this.ensureTempDirectory();
  }

  private ensureTempDirectory() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  private generateFilename(config: CaptureConfig, suffix = '') {
    let filename = config.prefix;

    if (suffix) {
      filename += `-${suffix}`;
    }

    if (config.timestamp) {
      const timestamp = new Date().toISOString()
        .replace(/[:]/g, '-')
        .replace(/\..+/, '')
        .replace('T', '_');
      filename += `_${timestamp}`;
    }

    filename += '.png';

    const directory = config.directory || this.tempDir;
    return path.join(directory, filename);
  }

  /**
   * Capture a single screenshot with optional configuration
   */
  async captureScreenshot(config: CaptureConfig): Promise<string> {
    const filepath = this.generateFilename(config);

    if (config.fullPage) {
      await this.viewport.page.screenshot({
        path: filepath,
        fullPage: true
      });
    } else {
      await this.viewport.canvas.screenshot({
        path: filepath
      });
    }

    return filepath;
  }

  /**
   * Capture screenshots from multiple angles for better 3D visualization analysis
   */
  async captureMultiAngle(config: MultiAngleConfig): Promise<string[]> {
    const filepaths: string[] = [];
    const { angles, panDelta = 100, tiltDelta = 50, zoomDelta = -300 } = config;

    // Save initial camera state (if possible to restore later)
    const initialState = await this.viewport.getCameraState();

    try {
      // 1. Normal view (current state)
      if (angles.normal !== false) {
        const normalPath = this.generateFilename(config, 'normal');

        if (config.fullPage) {
          await this.viewport.page.screenshot({
            path: normalPath,
            fullPage: true
          });
        } else {
          await this.viewport.canvas.screenshot({
            path: normalPath
          });
        }

        filepaths.push(normalPath);
      }

      // 2. Panned view (rotate camera horizontally)
      if (angles.panned !== false) {
        await this.viewport.rotateCamera(panDelta, 0);
        await this.viewport.waitForViewportStabilization(1000);

        const pannedPath = this.generateFilename(config, 'panned');

        if (config.fullPage) {
          await this.viewport.page.screenshot({
            path: pannedPath,
            fullPage: true
          });
        } else {
          await this.viewport.canvas.screenshot({
            path: pannedPath
          });
        }

        filepaths.push(pannedPath);

        // Reset rotation for next view
        await this.viewport.rotateCamera(-panDelta, 0);
        await this.viewport.waitForViewportStabilization(500);
      }

      // 3. Tilted view (change vertical perspective)
      if (angles.tilted !== false) {
        await this.viewport.rotateCamera(0, tiltDelta);
        await this.viewport.waitForViewportStabilization(1000);

        const tiltedPath = this.generateFilename(config, 'tilted');

        if (config.fullPage) {
          await this.viewport.page.screenshot({
            path: tiltedPath,
            fullPage: true
          });
        } else {
          await this.viewport.canvas.screenshot({
            path: tiltedPath
          });
        }

        filepaths.push(tiltedPath);

        // Reset tilt for next view
        await this.viewport.rotateCamera(0, -tiltDelta);
        await this.viewport.waitForViewportStabilization(500);
      }

      // 4. Zoomed out view (broader perspective)
      if (angles.zoomedOut !== false) {
        await this.viewport.zoomCamera(zoomDelta);
        await this.viewport.waitForViewportStabilization(1000);

        const zoomedPath = this.generateFilename(config, 'zoomed-out');

        if (config.fullPage) {
          await this.viewport.page.screenshot({
            path: zoomedPath,
            fullPage: true
          });
        } else {
          await this.viewport.canvas.screenshot({
            path: zoomedPath
          });
        }

        filepaths.push(zoomedPath);

        // Reset zoom
        await this.viewport.zoomCamera(-zoomDelta);
        await this.viewport.waitForViewportStabilization(500);
      }

    } catch (error) {
      console.warn('Error during multi-angle capture:', error);
    }

    return filepaths;
  }

  /**
   * Quick debug capture - captures normal and panned views with timestamp
   */
  async captureDebug(prefix: string, fullPage = false): Promise<string[]> {
    return this.captureMultiAngle({
      prefix,
      timestamp: true,
      fullPage,
      angles: {
        normal: true,
        panned: true,
        tilted: false,
        zoomedOut: false
      }
    });
  }

  /**
   * Comprehensive capture - all angles for thorough analysis
   */
  async captureComprehensive(prefix: string, fullPage = false): Promise<string[]> {
    return this.captureMultiAngle({
      prefix,
      timestamp: true,
      fullPage,
      angles: {
        normal: true,
        panned: true,
        tilted: true,
        zoomedOut: true
      }
    });
  }

  /**
   * Capture before/after comparison shots
   */
  async captureComparison(
    beforeAction: () => Promise<void>,
    afterAction: () => Promise<void>,
    prefix: string,
    fullPage = false
  ): Promise<{ before: string[], after: string[] }> {
    await beforeAction();
    await this.viewport.waitForViewportStabilization(1000);

    const before = await this.captureDebug(`${prefix}-before`, fullPage);

    await afterAction();
    await this.viewport.waitForViewportStabilization(1000);

    const after = await this.captureDebug(`${prefix}-after`, fullPage);

    return { before, after };
  }

  /**
   * Clean up old screenshots (older than specified days)
   */
  async cleanupOldScreenshots(olderThanDays = 7) {
    const cutoff = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);

    try {
      const files = fs.readdirSync(this.tempDir);

      for (const file of files) {
        if (file.endsWith('.png')) {
          const filepath = path.join(this.tempDir, file);
          const stat = fs.statSync(filepath);

          if (stat.mtime.getTime() < cutoff) {
            fs.unlinkSync(filepath);
          }
        }
      }
    } catch (error) {
      console.warn('Error during cleanup:', error);
    }
  }

  /**
   * Get list of recent screenshots
   */
  getRecentScreenshots(limit = 10): string[] {
    try {
      const files = fs.readdirSync(this.tempDir)
        .filter(file => file.endsWith('.png'))
        .map(file => {
          const filepath = path.join(this.tempDir, file);
          const stat = fs.statSync(filepath);
          return { file, mtime: stat.mtime };
        })
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())
        .slice(0, limit)
        .map(item => path.join(this.tempDir, item.file));

      return files;
    } catch (error) {
      console.warn('Error reading recent screenshots:', error);
      return [];
    }
  }

  /**
   * Create a metadata file alongside screenshots with viewport state
   */
  async saveViewportMetadata(prefix: string) {
    const state = await this.viewport.getCameraState();
    const layerCount = await this.viewport.getActiveLayerCount();

    const metadata = {
      timestamp: new Date().toISOString(),
      viewport: state,
      layers: layerCount,
      url: this.viewport.page.url(),
      userAgent: await this.viewport.page.evaluate(() => navigator.userAgent)
    };

    const metadataPath = this.generateFilename({ prefix }, 'metadata').replace('.png', '.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    return metadataPath;
  }
}

/**
 * Convenience function to create screenshot helpers
 */
export function createScreenshotHelpers(page: Page, tempDir?: string): ScreenshotHelpers {
  return new ScreenshotHelpers(page, tempDir);
}