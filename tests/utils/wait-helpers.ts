import { Page, expect } from '@playwright/test';

export class WaitHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for the application to be fully loaded and interactive
   */
  async waitForAppReady(timeout: number = 60000) {
    await expect(this.page.locator('text=UrbanSynth')).toBeVisible({ timeout });
    await expect(this.page.locator('canvas')).toBeVisible({ timeout });
    await expect(this.page.locator('text=/\\d+ layers active/')).toBeVisible({ timeout });

    // Wait for any initial animations to complete
    await this.page.waitForTimeout(2000);
  }

  /**
   * Wait for a specific number of layers to be active
   */
  async waitForLayerCount(expectedCount: number, timeout: number = 30000) {
    await expect(async () => {
      const layerText = await this.page.locator('text=/\\d+ layers active/').textContent();
      const count = parseInt(layerText?.match(/\\d+/)?.[0] || '0', 10);
      expect(count).toBe(expectedCount);
    }).toPass({ timeout });
  }

  /**
   * Wait for simulation to be in a specific state
   */
  async waitForSimulationState(state: 'Running' | 'Paused' | 'Loading', timeout: number = 10000) {
    await expect(this.page.locator(`text=/Status: ${state}/`)).toBeVisible({ timeout });
  }

  /**
   * Wait for stable frame rate
   */
  async waitForStableFrameRate(minFps: number = 30, durationMs: number = 3000, checkIntervalMs: number = 500) {
    const startTime = Date.now();

    while (Date.now() - startTime < durationMs) {
      const fpsText = await this.page.locator('text=/FPS: \\d+/').textContent();
      const fps = parseInt(fpsText?.match(/\\d+/)?.[0] || '0', 10);

      if (fps < minFps) {
        throw new Error(`FPS ${fps} below minimum ${minFps}`);
      }

      await this.page.waitForTimeout(checkIntervalMs);
    }
  }

  /**
   * Wait for memory usage to stabilize
   */
  async waitForMemoryStabilization(maxVariationMB: number = 5, durationMs: number = 5000) {
    const measurements: number[] = [];
    const startTime = Date.now();

    while (Date.now() - startTime < durationMs) {
      const memoryText = await this.page.locator('text=/Memory: [\\d.]+ KB/').textContent();
      const memoryKB = parseFloat(memoryText?.match(/[\\d.]+/)?.[0] || '0');
      const memoryMB = memoryKB / 1024;

      measurements.push(memoryMB);

      // Keep only recent measurements
      if (measurements.length > 10) {
        measurements.shift();
      }

      // Check variation in recent measurements
      if (measurements.length >= 5) {
        const min = Math.min(...measurements);
        const max = Math.max(...measurements);
        const variation = max - min;

        if (variation <= maxVariationMB) {
          return; // Memory is stable
        }
      }

      await this.page.waitForTimeout(500);
    }

    throw new Error(`Memory did not stabilize within ${durationMs}ms`);
  }

  /**
   * Wait for viewport rendering to complete
   */
  async waitForViewportRender(timeout: number = 10000) {
    // Wait for canvas to have actual content
    await expect(async () => {
      const canvas = this.page.locator('canvas');
      const screenshot = await canvas.screenshot({ type: 'png' });
      expect(screenshot.length).toBeGreaterThan(1000); // Should have substantial content
    }).toPass({ timeout });
  }

  /**
   * Wait for terrain generation to complete
   */
  async waitForTerrainGeneration(timeout: number = 30000) {
    // Look for indicators that terrain generation is complete
    await expect(this.page.locator('text=/\\d+ layers active/')).toBeVisible({ timeout });

    // Wait for any loading indicators to disappear
    await expect(this.page.locator('text=Loading'), { hasText: 'terrain' }).not.toBeVisible({ timeout: 5000 });

    // Additional stabilization time
    await this.page.waitForTimeout(2000);
  }

  /**
   * Wait for animation to complete
   */
  async waitForAnimation(duration: number = 1000) {
    await this.page.waitForTimeout(duration);
  }

  /**
   * Wait for network idle (useful for lazy loading)
   */
  async waitForNetworkIdle(timeout: number = 10000) {
    await this.page.waitForLoadState('networkidle', { timeout });
  }

  /**
   * Wait for specific element to be stable (not moving)
   */
  async waitForElementStability(selector: string, durationMs: number = 1000) {
    const element = this.page.locator(selector);
    let lastPosition: { x: number; y: number } | null = null;
    const startTime = Date.now();

    while (Date.now() - startTime < durationMs) {
      const box = await element.boundingBox();
      if (box) {
        if (lastPosition &&
            Math.abs(box.x - lastPosition.x) < 1 &&
            Math.abs(box.y - lastPosition.y) < 1) {
          // Position is stable
          await this.page.waitForTimeout(100);
          continue;
        }
        lastPosition = { x: box.x, y: box.y };
      }
      await this.page.waitForTimeout(100);
    }
  }

  /**
   * Wait for WebGL context to be ready
   */
  async waitForWebGLReady(timeout: number = 10000) {
    await expect(async () => {
      const hasWebGL = await this.page.evaluate(() => {
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
    }).toPass({ timeout });
  }

  /**
   * Wait for specific console message (useful for debugging)
   */
  async waitForConsoleMessage(messagePattern: string | RegExp, timeout: number = 10000) {
    return new Promise<string>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Console message "${messagePattern}" not found within ${timeout}ms`));
      }, timeout);

      const handler = (msg: any) => {
        const text = msg.text();
        const matches = typeof messagePattern === 'string'
          ? text.includes(messagePattern)
          : messagePattern.test(text);

        if (matches) {
          clearTimeout(timeoutId);
          this.page.off('console', handler);
          resolve(text);
        }
      };

      this.page.on('console', handler);
    });
  }

  /**
   * Wait with exponential backoff
   */
  async waitWithBackoff(
    condition: () => Promise<boolean>,
    maxAttempts: number = 10,
    baseDelayMs: number = 100
  ) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (await condition()) {
        return;
      }

      const delay = baseDelayMs * Math.pow(2, attempt);
      await this.page.waitForTimeout(Math.min(delay, 5000));
    }

    throw new Error(`Condition not met after ${maxAttempts} attempts`);
  }
}