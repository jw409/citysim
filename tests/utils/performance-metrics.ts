import { Page } from '@playwright/test';

export interface PerformanceMetrics {
  fps: number;
  memory: number;
  agents: number;
  time: number;
  timestamp: number;
  webglContexts: number;
  domNodes: number;
  jsHeapUsed: number;
  jsHeapTotal: number;
}

export class PerformanceMetricsCollector {
  private page: Page;
  private metrics: PerformanceMetrics[] = [];
  private collecting = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(page: Page) {
    this.page = page;
  }

  async startCollection(intervalMs: number = 1000) {
    if (this.collecting) return;

    this.collecting = true;
    this.metrics = [];

    this.intervalId = setInterval(async () => {
      try {
        const metrics = await this.collectMetrics();
        this.metrics.push(metrics);
      } catch (error) {
        console.warn('Failed to collect metrics:', error);
      }
    }, intervalMs);
  }

  stopCollection() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.collecting = false;
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getAverageMetrics(): Partial<PerformanceMetrics> {
    if (this.metrics.length === 0) return {};

    const sum = this.metrics.reduce((acc, metric) => ({
      fps: acc.fps + metric.fps,
      memory: acc.memory + metric.memory,
      agents: acc.agents + metric.agents,
      jsHeapUsed: acc.jsHeapUsed + metric.jsHeapUsed,
      jsHeapTotal: acc.jsHeapTotal + metric.jsHeapTotal,
      webglContexts: acc.webglContexts + metric.webglContexts,
      domNodes: acc.domNodes + metric.domNodes
    }), {
      fps: 0,
      memory: 0,
      agents: 0,
      jsHeapUsed: 0,
      jsHeapTotal: 0,
      webglContexts: 0,
      domNodes: 0
    });

    const count = this.metrics.length;
    return {
      fps: sum.fps / count,
      memory: sum.memory / count,
      agents: sum.agents / count,
      jsHeapUsed: sum.jsHeapUsed / count,
      jsHeapTotal: sum.jsHeapTotal / count,
      webglContexts: sum.webglContexts / count,
      domNodes: sum.domNodes / count
    };
  }

  private async collectMetrics(): Promise<PerformanceMetrics> {
    return await this.page.evaluate(() => {
      // Collect performance metrics from the browser
      const performanceInfo = (performance as any).memory || {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0
      };

      // Get FPS from performance monitor if available
      const fpsElement = document.querySelector('[class*="fps"], [data-testid="fps"]');
      const fpsText = fpsElement?.textContent || '0';
      const fps = parseInt(fpsText.match(/\\d+/)?.[0] || '0', 10);

      // Get memory from performance monitor
      const memoryElement = document.querySelector('[class*="memory"], [data-testid="memory"]');
      const memoryText = memoryElement?.textContent || '0';
      const memory = parseFloat(memoryText.match(/[\\d.]+/)?.[0] || '0');

      // Get agent count
      const agentsElement = document.querySelector('[class*="agents"], [data-testid="agents"]');
      const agentsText = agentsElement?.textContent || '0';
      const agents = parseInt(agentsText.match(/\\d+/)?.[0] || '0', 10);

      // Get simulation time
      const timeElement = document.querySelector('[class*="time"], [data-testid="time"]');
      const timeText = timeElement?.textContent || '0';
      const time = parseFloat(timeText.match(/[\\d.]+/)?.[0] || '0');

      // Count WebGL contexts
      const canvas = document.querySelector('canvas');
      let webglContexts = 0;
      if (canvas) {
        try {
          const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
          webglContexts = gl ? 1 : 0;
        } catch (e) {
          webglContexts = 0;
        }
      }

      // Count DOM nodes
      const domNodes = document.querySelectorAll('*').length;

      return {
        fps,
        memory,
        agents,
        time,
        timestamp: Date.now(),
        webglContexts,
        domNodes,
        jsHeapUsed: performanceInfo.usedJSHeapSize / 1024 / 1024, // MB
        jsHeapTotal: performanceInfo.totalJSHeapSize / 1024 / 1024 // MB
      };
    });
  }

  async detectMemoryLeaks(durationMs: number = 30000): Promise<boolean> {
    this.metrics = [];
    await this.startCollection(1000);

    await new Promise(resolve => setTimeout(resolve, durationMs));

    this.stopCollection();

    if (this.metrics.length < 5) return false;

    // Check for consistent memory growth
    const firstQuarter = this.metrics.slice(0, Math.floor(this.metrics.length / 4));
    const lastQuarter = this.metrics.slice(-Math.floor(this.metrics.length / 4));

    const firstQuarterAvg = firstQuarter.reduce((sum, m) => sum + m.jsHeapUsed, 0) / firstQuarter.length;
    const lastQuarterAvg = lastQuarter.reduce((sum, m) => sum + m.jsHeapUsed, 0) / lastQuarter.length;

    // Consider it a leak if memory increased by more than 20MB
    const memoryIncrease = lastQuarterAvg - firstQuarterAvg;
    return memoryIncrease > 20;
  }

  async measurePerformanceImpact(
    action: () => Promise<void>,
    baselineDurationMs: number = 5000,
    testDurationMs: number = 5000
  ): Promise<{
    baseline: Partial<PerformanceMetrics>;
    withAction: Partial<PerformanceMetrics>;
    impact: Partial<PerformanceMetrics>;
  }> {
    // Collect baseline metrics
    await this.startCollection(500);
    await new Promise(resolve => setTimeout(resolve, baselineDurationMs));
    this.stopCollection();
    const baseline = this.getAverageMetrics();

    // Perform action and collect metrics
    await this.startCollection(500);
    await action();
    await new Promise(resolve => setTimeout(resolve, testDurationMs));
    this.stopCollection();
    const withAction = this.getAverageMetrics();

    // Calculate impact
    const impact: Partial<PerformanceMetrics> = {};
    Object.keys(baseline).forEach(key => {
      const k = key as keyof PerformanceMetrics;
      if (typeof baseline[k] === 'number' && typeof withAction[k] === 'number') {
        (impact as any)[k] = (withAction[k] as number) - (baseline[k] as number);
      }
    });

    return { baseline, withAction, impact };
  }

  exportMetrics(filename: string = 'performance-metrics.json') {
    return JSON.stringify({
      collectionTime: new Date().toISOString(),
      metrics: this.metrics,
      summary: this.getAverageMetrics()
    }, null, 2);
  }
}