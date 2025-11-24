import {
  PerformanceProfile,
  PerformanceLevel,
  DeviceMetrics,
  DeviceBenchmarkResult,
  PerformanceState,
  AdaptationSettings,
  PerformanceMetrics,
} from '../types/performance';

export class PerformanceProfiler {
  private wasmBenchmark: any;
  private wasmScaler: any;
  private frameTimeHistory: number[] = [];
  private lastFrameTime = performance.now();
  private rafId?: number;

  constructor() {
    this.initializeWasm();
  }

  private async initializeWasm() {
    try {
      const wasmModule = await import('../wasm/urbansynth_sim');
      this.wasmBenchmark = new wasmModule.DeviceBenchmark();
      this.wasmScaler = new wasmModule.AdaptiveScaler();
    } catch (error) {
      console.warn('WASM performance modules not available, using JS fallback');
    }
  }

  async detectDeviceCapabilities(): Promise<DeviceMetrics> {
    const metrics: DeviceMetrics = {
      cpu_cores: navigator.hardwareConcurrency || 4,
      memory_gb: (navigator as any).deviceMemory || this.estimateMemory(),
      gpu_score: await this.benchmarkGPU(),
      refresh_rate: await this.detectRefreshRate(),
    };

    // Add battery info if available
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        metrics.battery_level = battery.level;
        metrics.is_charging = battery.charging;
      } catch (e) {
        // Battery API not available
      }
    }

    return metrics;
  }

  private estimateMemory(): number {
    // Fallback memory estimation
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        // Basic heuristics based on GPU
        if (renderer.includes('Intel')) return 8;
        if (renderer.includes('RTX') || renderer.includes('RX')) return 16;
        return 4;
      }
    }
    return 4; // Default assumption
  }

  private async benchmarkGPU(): Promise<number> {
    return new Promise(resolve => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

      if (!gl) {
        resolve(100); // Very basic fallback
        return;
      }

      // Simple GPU benchmark - render many triangles and measure performance
      const startTime = performance.now();
      let score = 1000;

      // Create a simple shader program
      const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
      gl.shaderSource(
        vertexShader,
        `
        attribute vec2 position;
        void main() {
          gl_Position = vec4(position, 0.0, 1.0);
        }
      `
      );
      gl.compileShader(vertexShader);

      const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
      gl.shaderSource(
        fragmentShader,
        `
        precision mediump float;
        void main() {
          gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
        }
      `
      );
      gl.compileShader(fragmentShader);

      const program = gl.createProgram()!;
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      gl.useProgram(program);

      // Render many triangles
      for (let i = 0; i < 1000; i++) {
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }

      gl.finish(); // Wait for GPU

      const duration = performance.now() - startTime;
      score = Math.max(100, Math.min(10000, 10000 / duration));

      resolve(score);
    });
  }

  private async detectRefreshRate(): Promise<number> {
    return new Promise(resolve => {
      let frameCount = 0;
      const startTime = performance.now();

      const countFrames = () => {
        frameCount++;
        if (frameCount < 60) {
          requestAnimationFrame(countFrames);
        } else {
          const duration = performance.now() - startTime;
          const fps = (frameCount / duration) * 1000;

          // Round to common refresh rates
          if (fps > 200) resolve(240);
          else if (fps > 140) resolve(165);
          else if (fps > 110) resolve(144);
          else if (fps > 100) resolve(120);
          else if (fps > 50) resolve(60);
          else resolve(30);
        }
      };

      requestAnimationFrame(countFrames);
    });
  }

  async runBenchmark(): Promise<DeviceBenchmarkResult> {
    console.log('🔍 Running device benchmark...');
    const startTime = performance.now();

    const deviceMetrics = await this.detectDeviceCapabilities();

    // Calculate scores
    const cpuScore = this.calculateCPUScore(deviceMetrics);
    const memoryScore = this.calculateMemoryScore(deviceMetrics);
    const renderScore = deviceMetrics.gpu_score;

    const overallScore = (cpuScore + memoryScore + renderScore) / 3;
    const recommendedProfile = this.selectOptimalProfile(overallScore, deviceMetrics);

    const result: DeviceBenchmarkResult = {
      overall_score: overallScore,
      recommended_profile: recommendedProfile,
      benchmark_duration_ms: performance.now() - startTime,
      test_results: {
        cpu_score: cpuScore,
        memory_score: memoryScore,
        render_score: renderScore,
      },
    };

    console.log('✅ Benchmark complete:', result);
    return result;
  }

  private calculateCPUScore(metrics: DeviceMetrics): number {
    // Base score on core count and rough performance estimate
    return Math.min(10000, metrics.cpu_cores * 1000);
  }

  private calculateMemoryScore(metrics: DeviceMetrics): number {
    // More memory = higher score, but with diminishing returns
    return Math.min(10000, Math.pow(metrics.memory_gb, 1.5) * 500);
  }

  private selectOptimalProfile(score: number, metrics: DeviceMetrics): PerformanceProfile {
    // Ultra Gaming (240fps capable)
    if (score > 8000 && metrics.refresh_rate >= 240) {
      return {
        target_fps: 240,
        max_agents: 50000,
        render_distance: 1000.0,
        update_frequency: 120,
        level: PerformanceLevel.Ultra,
      };
    }

    // High Performance (120fps capable)
    if (score > 6000 && metrics.refresh_rate >= 120) {
      return {
        target_fps: 120,
        max_agents: 15000,
        render_distance: 800.0,
        update_frequency: 60,
        level: PerformanceLevel.High,
      };
    }

    // Medium (60fps standard)
    if (score > 3000) {
      return {
        target_fps: 60,
        max_agents: 5000,
        render_distance: 600.0,
        update_frequency: 30,
        level: PerformanceLevel.Medium,
      };
    }

    // Low (30fps basic)
    if (score > 1500) {
      return {
        target_fps: 30,
        max_agents: 2000,
        render_distance: 400.0,
        update_frequency: 15,
        level: PerformanceLevel.Low,
      };
    }

    // Ultra Low (15fps potato mode)
    return {
      target_fps: 15,
      max_agents: 500,
      render_distance: 200.0,
      update_frequency: 10,
      level: PerformanceLevel.UltraLow,
    };
  }

  startFrameMonitoring(callback: (metrics: PerformanceMetrics) => void): void {
    const monitor = () => {
      const currentTime = performance.now();
      const frameTime = currentTime - this.lastFrameTime;
      this.lastFrameTime = currentTime;

      // Keep history of last 60 frames
      this.frameTimeHistory.push(frameTime);
      if (this.frameTimeHistory.length > 60) {
        this.frameTimeHistory.shift();
      }

      // Calculate average FPS
      const avgFrameTime =
        this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length;
      const currentFps = 1000 / avgFrameTime;

      // Estimate memory usage (rough approximation)
      const memoryUsage = (performance as any).memory?.usedJSHeapSize / (1024 * 1024) || 0;

      const metrics: PerformanceMetrics = {
        current_fps: Math.round(currentFps * 10) / 10,
        target_fps: 60, // Will be updated by consumer
        frame_time_ms: Math.round(avgFrameTime * 10) / 10,
        agent_count: 0, // Will be updated by consumer
        memory_usage_mb: Math.round(memoryUsage),
        gpu_utilization: 0, // Difficult to measure in browser
        cpu_utilization: 0, // Difficult to measure in browser
      };

      callback(metrics);
      this.rafId = requestAnimationFrame(monitor);
    };

    this.rafId = requestAnimationFrame(monitor);
  }

  stopFrameMonitoring(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = undefined;
    }
  }

  createDefaultAdaptationSettings(): AdaptationSettings {
    return {
      enable_auto_scaling: true,
      fps_tolerance: 5.0,
      adaptation_delay_ms: 2000,
      min_stable_frames: 30,
      performance_priority: 'balanced',
    };
  }
}

export const performanceProfiler = new PerformanceProfiler();
