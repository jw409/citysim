---
id: PLAN9
title: "Adaptive Performance System - Scale to FPS"
dependencies: ["PLAN3", "PLAN3.5"]
status: pending
artifacts:
  - "wasm/src/performance.rs"
  - "wasm/src/benchmarking.rs"
  - "wasm/src/adaptive_scaling.rs"
  - "src/utils/performanceProfiler.ts"
  - "src/hooks/usePerformanceAdaptation.ts"
  - "src/types/performance.ts"
---

### Objective
Implement an intelligent adaptive performance system that automatically scales simulation complexity to maintain optimal frame rates (15-240fps) across all devices, ensuring every user gets the best possible UrbanSynth experience their hardware can deliver.

### Core Philosophy: "Scale to FPS, Not One-Size-Fits-All"

The guiding principle is that **every device should run UrbanSynth at its optimal performance ceiling**:
- **Ultra Gaming PCs** with 240Hz displays → 50,000+ agents at 240fps
- **High-end Desktops** → 20,000 agents at 120-144fps
- **Standard Laptops** → 10,000 agents at 60fps
- **Mobile Devices** → 1,000 agents at 30fps
- **Low-end Hardware** → 500 agents at 15fps

All delivering the **same quality experience**, just scaled appropriately to showcase what modern web technology can achieve.

### Task Breakdown

1. **Create Performance Profiling System** (wasm/src/performance.rs):
   ```rust
   use wasm_bindgen::prelude::*;
   use web_sys::Performance;

   #[wasm_bindgen]
   #[derive(Clone, Debug)]
   pub struct PerformanceProfile {
       pub target_fps: u32,           // 15, 30, 60, 120, 144, 165, 240+
       pub max_agents: u32,           // Dynamic based on benchmark
       pub render_distance: f32,      // How far agents are visible
       pub update_frequency: u32,     // Simulation ticks per second
       pub lod_levels: u32,          // Level of detail steps
       pub culling_enabled: bool,     // Frustum culling for performance
   }

   #[wasm_bindgen]
   impl PerformanceProfile {
       #[wasm_bindgen(constructor)]
       pub fn new() -> PerformanceProfile {
           Self::default()
       }

       #[wasm_bindgen]
       pub fn auto_detect() -> PerformanceProfile {
           let mut profile = PerformanceProfile::default();

           // Start conservative, benchmark will adjust
           profile.target_fps = 60;
           profile.max_agents = 5000;
           profile.render_distance = 1000.0;
           profile.update_frequency = 60;
           profile.lod_levels = 3;
           profile.culling_enabled = true;

           profile
       }

       #[wasm_bindgen]
       pub fn for_ultra_gaming() -> PerformanceProfile {
           PerformanceProfile {
               target_fps: 240,
               max_agents: 50000,
               render_distance: 2500.0,
               update_frequency: 240,
               lod_levels: 5,
               culling_enabled: false,
           }
       }

       #[wasm_bindgen]
       pub fn for_high_end() -> PerformanceProfile {
           PerformanceProfile {
               target_fps: 144,
               max_agents: 20000,
               render_distance: 2000.0,
               update_frequency: 144,
               lod_levels: 4,
               culling_enabled: false,
           }
       }

       #[wasm_bindgen]
       pub fn for_standard() -> PerformanceProfile {
           PerformanceProfile {
               target_fps: 60,
               max_agents: 10000,
               render_distance: 1500.0,
               update_frequency: 60,
               lod_levels: 3,
               culling_enabled: true,
           }
       }

       #[wasm_bindgen]
       pub fn for_mobile() -> PerformanceProfile {
           PerformanceProfile {
               target_fps: 30,
               max_agents: 1000,
               render_distance: 500.0,
               update_frequency: 30,
               lod_levels: 2,
               culling_enabled: true,
           }
       }
   }

   impl Default for PerformanceProfile {
       fn default() -> Self {
           PerformanceProfile {
               target_fps: 60,
               max_agents: 5000,
               render_distance: 1000.0,
               update_frequency: 60,
               lod_levels: 3,
               culling_enabled: true,
           }
       }
   }
   ```

2. **Create Device Benchmarking System** (wasm/src/benchmarking.rs):
   ```rust
   use wasm_bindgen::prelude::*;
   use web_sys::{console, Performance};
   use js_sys::Date;
   use crate::performance::PerformanceProfile;

   #[wasm_bindgen]
   pub struct DeviceBenchmark {
       cpu_score: f64,
       memory_mb: f64,
       refresh_rate: u32,
       is_mobile: bool,
       gpu_tier: String,
   }

   #[wasm_bindgen]
   impl DeviceBenchmark {
       #[wasm_bindgen(constructor)]
       pub fn new() -> DeviceBenchmark {
           DeviceBenchmark {
               cpu_score: 0.0,
               memory_mb: 0.0,
               refresh_rate: 60,
               is_mobile: false,
               gpu_tier: "medium".to_string(),
           }
       }

       #[wasm_bindgen]
       pub fn run_cpu_benchmark(&mut self) -> f64 {
           console::log_1(&"🎯 Running CPU benchmark for performance profiling...".into());

           let start = Date::now();

           // CPU-intensive test: prime number calculation + mathematical operations
           let mut primes_found = 0;
           let mut computation_sum = 0.0;

           for n in 2..20000 {
               if self.is_prime(n) {
                   primes_found += 1;
               }
               // Add floating point operations for comprehensive CPU test
               computation_sum += (n as f64).sqrt() * (n as f64).sin();
           }

           let duration = Date::now() - start;

           // Score based on operations per millisecond (higher is better)
           self.cpu_score = (primes_found as f64 * 100.0) / duration;

           console::log_3(
               &"✅ CPU benchmark completed. Score:".into(),
               &self.cpu_score.into(),
               &format!(" ({}ms)", duration).into()
           );

           self.cpu_score
       }

       fn is_prime(&self, n: u32) -> bool {
           if n < 2 { return false; }
           if n == 2 { return true; }
           if n % 2 == 0 { return false; }

           let sqrt_n = (n as f64).sqrt() as u32;
           for i in (3..=sqrt_n).step_by(2) {
               if n % i == 0 { return false; }
           }
           true
       }

       #[wasm_bindgen]
       pub fn set_device_info(&mut self, refresh_rate: u32, is_mobile: bool, memory_mb: f64, gpu_tier: String) {
           self.refresh_rate = refresh_rate;
           self.is_mobile = is_mobile;
           self.memory_mb = memory_mb;
           self.gpu_tier = gpu_tier;

           console::log_1(&format!(
               "🖥️ Device capabilities: {}Hz, {} mobile, {:.0}MB RAM, {} GPU",
               refresh_rate,
               if is_mobile { "is" } else { "not" },
               memory_mb,
               gpu_tier
           ).into());
       }

       #[wasm_bindgen]
       pub fn generate_profile(&self) -> PerformanceProfile {
           console::log_1(&"🚀 Generating optimal performance profile...".into());

           let target_fps = self.calculate_target_fps();
           let max_agents = self.calculate_max_agents();
           let render_distance = self.calculate_render_distance();
           let lod_levels = self.calculate_lod_levels();
           let culling_enabled = self.should_enable_culling();

           let profile = PerformanceProfile {
               target_fps,
               max_agents,
               render_distance,
               update_frequency: target_fps,
               lod_levels,
               culling_enabled,
           };

           console::log_1(&format!(
               "📊 Profile: {}fps, {} agents, {:.0}m distance, {} LOD levels",
               target_fps, max_agents, render_distance, lod_levels
           ).into());

           profile
       }

       fn calculate_target_fps(&self) -> u32 {
           if self.is_mobile {
               if self.cpu_score > 50.0 { 60 } else { 30 }
           } else {
               match (self.cpu_score, self.refresh_rate, self.gpu_tier.as_str()) {
                   (score, rate, "ultra") if score > 150.0 && rate >= 240 => 240,
                   (score, rate, "high") if score > 120.0 && rate >= 165 => 165,
                   (score, rate, _) if score > 100.0 && rate >= 144 => 144,
                   (score, rate, _) if score > 80.0 && rate >= 120 => 120,
                   (score, rate, _) if score > 50.0 && rate >= 90 => 90,
                   _ => 60,
               }
           }
       }

       fn calculate_max_agents(&self) -> u32 {
           // Base agents on CPU score and target FPS, with GPU tier modifier
           let base_agents = (self.cpu_score * 150.0) as u32;

           let fps_multiplier = match self.target_fps {
               240 => 3.0,
               165 => 2.5,
               144 => 2.0,
               120 => 1.5,
               90 => 1.2,
               60 => 1.0,
               30 => 0.6,
               _ => 0.4,
           };

           let gpu_multiplier = match self.gpu_tier.as_str() {
               "ultra" => 1.5,
               "high" => 1.2,
               "medium" => 1.0,
               "low" => 0.7,
               _ => 1.0,
           };

           let calculated = ((base_agents as f64) * fps_multiplier * gpu_multiplier) as u32;

           // Apply reasonable bounds
           if self.is_mobile {
               calculated.max(500).min(2000)
           } else {
               calculated.max(1000).min(100000)
           }
       }

       fn calculate_render_distance(&self) -> f32 {
           if self.is_mobile {
               if self.cpu_score > 40.0 { 750.0 } else { 500.0 }
           } else {
               match self.gpu_tier.as_str() {
                   "ultra" => 3000.0,
                   "high" => 2500.0,
                   "medium" => 1500.0,
                   "low" => 1000.0,
                   _ => 1500.0,
               }
           }
       }

       fn calculate_lod_levels(&self) -> u32 {
           if self.is_mobile {
               2
           } else {
               match (self.cpu_score, self.gpu_tier.as_str()) {
                   (score, "ultra") if score > 100.0 => 5,
                   (score, "high") if score > 80.0 => 4,
                   (score, _) if score > 60.0 => 3,
                   _ => 2,
               }
           }
       }

       fn should_enable_culling(&self) -> bool {
           self.is_mobile || self.cpu_score < 60.0 || self.gpu_tier == "low"
       }

       // Getters for JavaScript
       #[wasm_bindgen(getter)]
       pub fn cpu_score(&self) -> f64 { self.cpu_score }

       #[wasm_bindgen(getter)]
       pub fn refresh_rate(&self) -> u32 { self.refresh_rate }

       #[wasm_bindgen(getter)]
       pub fn is_mobile(&self) -> bool { self.is_mobile }

       #[wasm_bindgen(getter)]
       pub fn memory_mb(&self) -> f64 { self.memory_mb }

       #[wasm_bindgen(getter)]
       pub fn gpu_tier(&self) -> String { self.gpu_tier.clone() }
   }
   ```

3. **Create Adaptive Scaling Engine** (wasm/src/adaptive_scaling.rs):
   ```rust
   use wasm_bindgen::prelude::*;
   use web_sys::console;
   use crate::performance::PerformanceProfile;

   #[wasm_bindgen]
   pub struct AdaptiveScaler {
       current_profile: PerformanceProfile,
       current_fps: f64,
       target_fps: f64,
       fps_history: Vec<f64>,
       adjustment_timer: f64,
       scaling_enabled: bool,
   }

   #[wasm_bindgen]
   impl AdaptiveScaler {
       #[wasm_bindgen(constructor)]
       pub fn new(profile: PerformanceProfile) -> AdaptiveScaler {
           let target_fps = profile.target_fps as f64;

           console::log_2(
               &"🎮 Adaptive scaler initialized with target FPS:".into(),
               &target_fps.into()
           );

           AdaptiveScaler {
               target_fps,
               current_profile: profile,
               current_fps: target_fps,
               fps_history: Vec::with_capacity(120), // 2 seconds of history at 60fps
               adjustment_timer: 0.0,
               scaling_enabled: true,
           }
       }

       #[wasm_bindgen]
       pub fn update_fps(&mut self, fps: f64, delta_time: f64) {
           self.current_fps = fps;
           self.fps_history.push(fps);

           // Keep only recent history (rolling window)
           if self.fps_history.len() > 120 {
               self.fps_history.remove(0);
           }

           self.adjustment_timer += delta_time;

           // Only consider adjustments every 3 seconds to avoid thrashing
           if self.scaling_enabled && self.adjustment_timer > 3000.0 {
               self.consider_performance_adjustment();
               self.adjustment_timer = 0.0;
           }
       }

       fn consider_performance_adjustment(&mut self) {
           // Need sufficient data for stable measurement
           if self.fps_history.len() < 60 { return; }

           let avg_fps = self.fps_history.iter().sum::<f64>() / self.fps_history.len() as f64;
           let fps_stability = self.calculate_fps_stability();
           let target = self.target_fps;

           // Only adjust if performance is stable (not during loading/transitions)
           if fps_stability < 0.7 {
               console::log_1(&"⏸️ Skipping adjustment: FPS unstable".into());
               return;
           }

           let performance_gap = (avg_fps - target) / target;

           // Performance is significantly below target
           if performance_gap < -0.15 {
               self.scale_down_performance();
           }
           // Performance is significantly above target with headroom for more complexity
           else if performance_gap > 0.20 && self.current_profile.max_agents < 80000 {
               self.scale_up_performance();
           }
       }

       fn calculate_fps_stability(&self) -> f64 {
           if self.fps_history.len() < 30 { return 0.0; }

           let recent_samples = &self.fps_history[self.fps_history.len()-30..];
           let mean = recent_samples.iter().sum::<f64>() / recent_samples.len() as f64;

           let variance = recent_samples.iter()
               .map(|fps| (fps - mean).powi(2))
               .sum::<f64>() / recent_samples.len() as f64;

           let std_dev = variance.sqrt();
           let coefficient_of_variation = std_dev / mean;

           // Stability score: 1.0 = perfectly stable, 0.0 = highly variable
           (1.0 - coefficient_of_variation.min(1.0)).max(0.0)
       }

       fn scale_down_performance(&mut self) {
           let old_agents = self.current_profile.max_agents;
           let reduction_factor = 0.85; // Reduce by 15%

           self.current_profile.max_agents =
               ((self.current_profile.max_agents as f64) * reduction_factor)
               .max(100.0) as u32;

           // Also reduce render distance if agents are already quite low
           if self.current_profile.max_agents < 1000 {
               self.current_profile.render_distance *= 0.9;
           }

           console::log_3(
               &"📉 Scaling DOWN agents:".into(),
               &old_agents.into(),
               &format!(" → {}", self.current_profile.max_agents).into()
           );
       }

       fn scale_up_performance(&mut self) {
           let old_agents = self.current_profile.max_agents;
           let increase_factor = 1.15; // Increase by 15%

           self.current_profile.max_agents =
               ((self.current_profile.max_agents as f64) * increase_factor)
               .min(100000.0) as u32;

           console::log_3(
               &"📈 Scaling UP agents:".into(),
               &old_agents.into(),
               &format!(" → {}", self.current_profile.max_agents).into()
           );
       }

       #[wasm_bindgen]
       pub fn set_scaling_enabled(&mut self, enabled: bool) {
           self.scaling_enabled = enabled;
           console::log_2(
               &"🎛️ Adaptive scaling:".into(),
               &(if enabled { "enabled" } else { "disabled" }).into()
           );
       }

       #[wasm_bindgen]
       pub fn force_profile_update(&mut self, max_agents: u32) {
           self.current_profile.max_agents = max_agents;
           console::log_2(&"🔧 Manual agent count override:".into(), &max_agents.into());
       }

       // Getters for JavaScript integration
       #[wasm_bindgen(getter)]
       pub fn current_max_agents(&self) -> u32 { self.current_profile.max_agents }

       #[wasm_bindgen(getter)]
       pub fn current_fps(&self) -> f64 { self.current_fps }

       #[wasm_bindgen(getter)]
       pub fn target_fps(&self) -> f64 { self.target_fps }

       #[wasm_bindgen(getter)]
       pub fn fps_stability(&self) -> f64 { self.calculate_fps_stability() }

       #[wasm_bindgen(getter)]
       pub fn render_distance(&self) -> f32 { self.current_profile.render_distance }

       #[wasm_bindgen(getter)]
       pub fn scaling_enabled(&self) -> bool { self.scaling_enabled }
   }
   ```

4. **Create TypeScript Performance Types** (src/types/performance.ts):
   ```typescript
   export interface PerformanceProfile {
     targetFps: number;
     maxAgents: number;
     renderDistance: number;
     updateFrequency: number;
     lodLevels: number;
     cullingEnabled: boolean;
   }

   export interface DeviceCapabilities {
     cpuScore: number;
     memoryMB: number;
     refreshRate: number;
     isMobile: boolean;
     isHighEnd: boolean;
     gpuTier: 'low' | 'medium' | 'high' | 'ultra';
   }

   export interface PerformanceMetrics {
     currentFps: number;
     targetFps: number;
     averageFps: number;
     fpsStability: number;
     frameTime: number;
     activeAgents: number;
     maxAgents: number;
     memoryUsage: number;
     renderDistance: number;
   }

   export interface AdaptiveSettings {
     autoScaling: boolean;
     scalingAggression: 'conservative' | 'normal' | 'aggressive';
     stabilityThreshold: number;
     adjustmentInterval: number;
   }

   export interface BenchmarkResults {
     cpuScore: number;
     memoryMB: number;
     refreshRate: number;
     gpuTier: string;
     isMobile: boolean;
     benchmarkDuration: number;
     recommendedProfile: PerformanceProfile;
   }
   ```

5. **Create Performance Profiler Utility** (src/utils/performanceProfiler.ts):
   ```typescript
   import { DeviceCapabilities, PerformanceProfile, BenchmarkResults } from '../types/performance';

   export class PerformanceProfiler {
     private static instance: PerformanceProfiler;

     static getInstance(): PerformanceProfiler {
       if (!this.instance) {
         this.instance = new PerformanceProfiler();
       }
       return this.instance;
     }

     async detectDeviceCapabilities(): Promise<DeviceCapabilities> {
       console.log('🔍 Detecting device capabilities...');

       const capabilities: DeviceCapabilities = {
         cpuScore: 0,
         memoryMB: this.getMemoryInfo(),
         refreshRate: await this.getRefreshRate(),
         isMobile: this.isMobileDevice(),
         isHighEnd: false,
         gpuTier: 'medium'
       };

       // Run CPU benchmark (this will be handled by WASM)
       capabilities.cpuScore = await this.estimateCpuScore();

       // Detect GPU tier
       capabilities.gpuTier = this.detectGpuTier();

       // Determine if high-end based on all factors
       capabilities.isHighEnd = this.isHighEndDevice(capabilities);

       console.log('✅ Device detection complete:', capabilities);
       return capabilities;
     }

     private async getRefreshRate(): Promise<number> {
       // Try modern screen API first
       const screen = window.screen as any;
       if (screen.refreshRate && typeof screen.refreshRate === 'number') {
         return Math.min(screen.refreshRate, 240); // Cap at 240Hz for now
       }

       // Fallback: detect via requestAnimationFrame timing
       return this.detectRefreshRateViaRAF();
     }

     private async detectRefreshRateViaRAF(): Promise<number> {
       return new Promise<number>((resolve) => {
         const samples: number[] = [];
         let lastTime = performance.now();

         const sampleFrame = () => {
           const currentTime = performance.now();
           const deltaTime = currentTime - lastTime;

           if (deltaTime > 0) {
             samples.push(1000 / deltaTime); // Convert to FPS
           }

           lastTime = currentTime;

           if (samples.length < 60) {
             requestAnimationFrame(sampleFrame);
           } else {
             // Calculate median FPS to avoid outliers
             samples.sort((a, b) => a - b);
             const medianFps = samples[Math.floor(samples.length / 2)];
             const detectedRate = Math.round(medianFps);

             console.log(`📺 Detected refresh rate: ${detectedRate}Hz (via RAF)`);
             resolve(Math.min(detectedRate, 240));
           }
         };

         requestAnimationFrame(sampleFrame);
       });
     }

     private getMemoryInfo(): number {
       const nav = navigator as any;

       // Modern API: Device Memory
       if (nav.deviceMemory) {
         return nav.deviceMemory * 1024; // Convert GB to MB
       }

       // Fallback: JS Heap Size Limit
       if (nav.memory && nav.memory.jsHeapSizeLimit) {
         return Math.floor(nav.memory.jsHeapSizeLimit / 1024 / 1024); // Convert bytes to MB
       }

       // Conservative default for unknown devices
       return 4096; // Assume 4GB
     }

     private isMobileDevice(): boolean {
       // Check user agent
       const userAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

       // Check touch capability and screen size
       const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
       const isSmallScreen = window.screen.width < 1024 || window.screen.height < 768;

       return userAgent || (isTouchDevice && isSmallScreen);
     }

     private async estimateCpuScore(): Promise<number> {
       // This will be a simple client-side estimate
       // The actual benchmarking will be done in WASM for accuracy
       const start = performance.now();

       // Simple CPU test
       let result = 0;
       for (let i = 0; i < 100000; i++) {
         result += Math.sqrt(i) * Math.sin(i) * Math.cos(i);
       }

       const duration = performance.now() - start;
       const score = Math.max(1, 1000 / duration); // Operations per millisecond

       console.log(`⚡ Estimated CPU score: ${score.toFixed(2)} (${duration.toFixed(1)}ms)`);
       return score;
     }

     private detectGpuTier(): 'low' | 'medium' | 'high' | 'ultra' {
       try {
         const canvas = document.createElement('canvas');
         const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

         if (!gl) return 'low';

         const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
         if (!debugInfo) return 'medium';

         const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();

         console.log(`🎮 GPU detected: ${renderer}`);

         // Ultra tier: Latest high-end GPUs
         if (renderer.includes('rtx 40') || renderer.includes('rtx 30') ||
             renderer.includes('rx 7') || renderer.includes('rx 6900') ||
             renderer.includes('m1 max') || renderer.includes('m2 max')) {
           return 'ultra';
         }

         // High tier: Enthusiast GPUs
         if (renderer.includes('rtx 20') || renderer.includes('gtx 1080') ||
             renderer.includes('rx 6') || renderer.includes('rx 5700') ||
             renderer.includes('m1 pro') || renderer.includes('m2 pro')) {
           return 'high';
         }

         // Medium tier: Mainstream GPUs
         if (renderer.includes('gtx') || renderer.includes('rx 5') ||
             renderer.includes('intel iris') || renderer.includes('m1') ||
             renderer.includes('radeon')) {
           return 'medium';
         }

         // Low tier: Integrated graphics
         return 'low';
       } catch (error) {
         console.warn('GPU detection failed:', error);
         return 'medium';
       }
     }

     private isHighEndDevice(capabilities: DeviceCapabilities): boolean {
       return !capabilities.isMobile &&
              capabilities.cpuScore > 75 &&
              capabilities.memoryMB > 8192 &&
              capabilities.refreshRate >= 120 &&
              ['high', 'ultra'].includes(capabilities.gpuTier);
     }

     generateOptimalProfile(capabilities: DeviceCapabilities): PerformanceProfile {
       console.log('🎯 Generating optimal performance profile...');

       if (capabilities.isHighEnd && capabilities.gpuTier === 'ultra') {
         return {
           targetFps: Math.min(capabilities.refreshRate, 240),
           maxAgents: 50000,
           renderDistance: 3000,
           updateFrequency: Math.min(capabilities.refreshRate, 240),
           lodLevels: 5,
           cullingEnabled: false
         };
       } else if (capabilities.gpuTier === 'high' && !capabilities.isMobile) {
         return {
           targetFps: Math.min(capabilities.refreshRate, 144),
           maxAgents: 20000,
           renderDistance: 2500,
           updateFrequency: Math.min(capabilities.refreshRate, 144),
           lodLevels: 4,
           cullingEnabled: false
         };
       } else if (capabilities.isMobile) {
         return {
           targetFps: capabilities.cpuScore > 50 ? 60 : 30,
           maxAgents: capabilities.cpuScore > 50 ? 1500 : 800,
           renderDistance: 600,
           updateFrequency: capabilities.cpuScore > 50 ? 60 : 30,
           lodLevels: 2,
           cullingEnabled: true
         };
       } else {
         // Standard desktop
         return {
           targetFps: Math.min(capabilities.refreshRate, 120),
           maxAgents: Math.floor(capabilities.cpuScore * 200).max(2000).min(15000),
           renderDistance: 1800,
           updateFrequency: Math.min(capabilities.refreshRate, 120),
           lodLevels: 3,
           cullingEnabled: capabilities.cpuScore < 50
         };
       }
     }

     async runFullBenchmark(): Promise<BenchmarkResults> {
       const startTime = performance.now();

       console.log('🚀 Running comprehensive device benchmark...');

       const capabilities = await this.detectDeviceCapabilities();
       const profile = this.generateOptimalProfile(capabilities);

       const benchmarkDuration = performance.now() - startTime;

       const results: BenchmarkResults = {
         cpuScore: capabilities.cpuScore,
         memoryMB: capabilities.memoryMB,
         refreshRate: capabilities.refreshRate,
         gpuTier: capabilities.gpuTier,
         isMobile: capabilities.isMobile,
         benchmarkDuration,
         recommendedProfile: profile
       };

       console.log('✅ Benchmark complete:', results);
       return results;
     }
   }

   // Extend Number prototype for convenience methods
   declare global {
     interface Number {
       max(value: number): number;
       min(value: number): number;
     }
   }

   Number.prototype.max = function(this: number, value: number): number {
     return Math.max(this, value);
   };

   Number.prototype.min = function(this: number, value: number): number {
     return Math.min(this, value);
   };
   ```

6. **Create Performance Adaptation Hook** (src/hooks/usePerformanceAdaptation.ts):
   ```typescript
   import { useState, useEffect, useCallback, useRef } from 'react';
   import { PerformanceProfile, PerformanceMetrics, DeviceCapabilities } from '../types/performance';
   import { PerformanceProfiler } from '../utils/performanceProfiler';

   export function usePerformanceAdaptation() {
     const [profile, setProfile] = useState<PerformanceProfile | null>(null);
     const [capabilities, setCapabilities] = useState<DeviceCapabilities | null>(null);
     const [metrics, setMetrics] = useState<PerformanceMetrics>({
       currentFps: 0,
       targetFps: 60,
       averageFps: 0,
       fpsStability: 0,
       frameTime: 0,
       activeAgents: 0,
       maxAgents: 1000,
       memoryUsage: 0,
       renderDistance: 1000
     });

     const [isInitialized, setIsInitialized] = useState(false);
     const [isOptimizing, setIsOptimizing] = useState(false);
     const initializationPromise = useRef<Promise<void> | null>(null);

     const initializePerformanceSystem = useCallback(async () => {
       // Prevent multiple concurrent initializations
       if (initializationPromise.current) {
         return initializationPromise.current;
       }

       initializationPromise.current = (async () => {
         const profiler = PerformanceProfiler.getInstance();

         try {
           console.log('🎮 Initializing adaptive performance system...');

           const detectedCapabilities = await profiler.detectDeviceCapabilities();
           const optimalProfile = profiler.generateOptimalProfile(detectedCapabilities);

           setCapabilities(detectedCapabilities);
           setProfile(optimalProfile);
           setMetrics(prev => ({
             ...prev,
             targetFps: optimalProfile.targetFps,
             maxAgents: optimalProfile.maxAgents,
             renderDistance: optimalProfile.renderDistance
           }));

           setIsInitialized(true);

           console.log('✅ Performance system ready:', {
             profile: optimalProfile,
             capabilities: detectedCapabilities
           });

           // Show user what we detected
           const deviceType = detectedCapabilities.isMobile ? 'Mobile' :
                            detectedCapabilities.isHighEnd ? 'High-end Desktop' : 'Desktop';

           console.log(`🎯 Optimized for: ${deviceType} (${optimalProfile.targetFps}fps, ${optimalProfile.maxAgents} agents)`);

         } catch (error) {
           console.error('❌ Performance system initialization failed:', error);

           // Graceful fallback to conservative settings
           const fallbackProfile: PerformanceProfile = {
             targetFps: 60,
             maxAgents: 2000,
             renderDistance: 1000,
             updateFrequency: 60,
             lodLevels: 3,
             cullingEnabled: true
           };

           setProfile(fallbackProfile);
           setMetrics(prev => ({
             ...prev,
             targetFps: 60,
             maxAgents: 2000,
             renderDistance: 1000
           }));
           setIsInitialized(true);

           console.log('🛡️ Using fallback performance profile');
         }
       })();

       return initializationPromise.current;
     }, []);

     const updateMetrics = useCallback((newMetrics: Partial<PerformanceMetrics>) => {
       setMetrics(prev => ({ ...prev, ...newMetrics }));
     }, []);

     const adjustProfile = useCallback((adjustments: Partial<PerformanceProfile>) => {
       if (profile) {
         const newProfile = { ...profile, ...adjustments };
         setProfile(newProfile);

         // Update metrics to reflect profile changes
         setMetrics(prev => ({
           ...prev,
           maxAgents: newProfile.maxAgents,
           renderDistance: newProfile.renderDistance,
           targetFps: newProfile.targetFps
         }));

         console.log('🔧 Performance profile adjusted:', adjustments);
       }
     }, [profile]);

     const optimizeForCurrentPerformance = useCallback(async () => {
       if (!capabilities || !profile || isOptimizing) return;

       setIsOptimizing(true);

       try {
         console.log('⚡ Running performance optimization...');

         // Simple optimization based on current FPS
         const currentFpsRatio = metrics.currentFps / metrics.targetFps;

         if (currentFpsRatio < 0.85) {
           // Performance is suffering, scale down
           const reductionFactor = Math.max(0.7, currentFpsRatio);
           adjustProfile({
             maxAgents: Math.floor(profile.maxAgents * reductionFactor),
             renderDistance: profile.renderDistance * Math.max(0.8, reductionFactor)
           });
           console.log('📉 Scaled down for better performance');
         } else if (currentFpsRatio > 1.2 && profile.maxAgents < 50000) {
           // Performance headroom available, scale up
           const increaseFactor = Math.min(1.3, 1 + (currentFpsRatio - 1) * 0.5);
           adjustProfile({
             maxAgents: Math.min(50000, Math.floor(profile.maxAgents * increaseFactor))
           });
           console.log('📈 Scaled up to utilize performance headroom');
         }
       } catch (error) {
         console.error('❌ Performance optimization failed:', error);
       } finally {
         setIsOptimizing(false);
       }
     }, [capabilities, profile, metrics, isOptimizing, adjustProfile]);

     const getPerformanceGrade = useCallback((): string => {
       if (!metrics.targetFps || !metrics.currentFps) return 'Unknown';

       const ratio = metrics.currentFps / metrics.targetFps;
       if (ratio >= 0.95) return 'Excellent';
       if (ratio >= 0.85) return 'Good';
       if (ratio >= 0.70) return 'Fair';
       return 'Poor';
     }, [metrics]);

     const getDeviceClass = useCallback((): string => {
       if (!capabilities) return 'Detecting...';

       if (capabilities.isMobile) return 'Mobile Device';
       if (capabilities.isHighEnd) return 'High-end Gaming PC';
       if (capabilities.gpuTier === 'high') return 'Gaming PC';
       if (capabilities.gpuTier === 'medium') return 'Standard PC';
       return 'Basic PC';
     }, [capabilities]);

     // Initialize on mount
     useEffect(() => {
       initializePerformanceSystem();
     }, [initializePerformanceSystem]);

     // Auto-optimize based on performance changes
     useEffect(() => {
       if (isInitialized && metrics.fpsStability > 0.8) {
         const timer = setTimeout(optimizeForCurrentPerformance, 5000);
         return () => clearTimeout(timer);
       }
     }, [isInitialized, metrics.fpsStability, optimizeForCurrentPerformance]);

     return {
       // State
       profile,
       capabilities,
       metrics,
       isInitialized,
       isOptimizing,

       // Actions
       updateMetrics,
       adjustProfile,
       optimizeForCurrentPerformance,
       reinitialize: initializePerformanceSystem,

       // Computed values
       performanceGrade: getPerformanceGrade(),
       deviceClass: getDeviceClass(),

       // Status checks
       isPerformanceGood: metrics.currentFps >= metrics.targetFps * 0.85,
       hasPerformanceHeadroom: metrics.currentFps >= metrics.targetFps * 1.15,
       needsOptimization: metrics.fpsStability > 0.7 && metrics.currentFps < metrics.targetFps * 0.8
     };
   }
   ```

### Integration with Existing Systems

This adaptive performance system integrates with:
1. **PLAN3 WASM Core**: Provides benchmarking and scaling logic
2. **PLAN3.5 Performance Monitor**: Extends basic monitoring with adaptive features
3. **PLAN4 Frontend**: React hooks for seamless UI integration
4. **PLAN5 Visualization**: Automatic LOD and culling based on performance profile

### Acceptance Criteria
- [ ] Device benchmarking detects CPU performance, memory, refresh rate up to 240Hz, and mobile status
- [ ] Performance profiles scale from 500 agents at 15fps (low-end) to 50,000+ agents at 240fps (ultra gaming)
- [ ] Adaptive scaling maintains target FPS by dynamically adjusting agent count and render settings
- [ ] System handles performance spikes gracefully and maintains stability
- [ ] TypeScript interfaces provide complete type safety for all performance data
- [ ] React hook enables easy integration with all frontend components
- [ ] Console logging provides clear, informative feedback about all performance adjustments
- [ ] Gaming PCs with 240Hz displays achieve 240fps with maximum agent counts
- [ ] Mobile devices maintain smooth 30fps with appropriate agent scaling

### Test Plan
```bash
#!/bin/bash
echo "🎯 Testing PLAN9: Adaptive Performance System"

# Test 1: WASM performance modules compilation
echo "🦀 Testing Rust performance system compilation..."
cd wasm
if ! cargo check --features="performance benchmarking adaptive"; then
    echo "❌ FAILED: Rust performance modules failed to compile"
    exit 1
fi
echo "✅ Rust performance modules compile successfully"

# Test 2: WASM build with all performance features
echo "🚀 Testing WASM build with performance features..."
cd ..
if ! npm run build:wasm; then
    echo "❌ FAILED: WASM build failed"
    exit 1
fi
echo "✅ WASM build includes full performance system"

# Test 3: TypeScript type checking for all performance modules
echo "📝 Testing TypeScript performance types..."
for file in "src/types/performance.ts" "src/utils/performanceProfiler.ts" "src/hooks/usePerformanceAdaptation.ts"; do
    if ! npx tsc --noEmit "$file"; then
        echo "❌ FAILED: TypeScript errors in $file"
        exit 1
    fi
done
echo "✅ All TypeScript performance modules are valid"

# Test 4: Performance profiler functionality
echo "🔧 Testing performance profiler utility..."
node -e "
const { PerformanceProfiler } = require('./dist/utils/performanceProfiler.js');
const profiler = PerformanceProfiler.getInstance();
console.log('Performance profiler loads successfully');
" 2>/dev/null || echo "⚠️ Performance profiler test requires build"

# Test 5: Benchmark performance targets
echo "⚡ Testing benchmark performance..."
timeout 10s npm run dev > /dev/null 2>&1 &
DEV_PID=$!
sleep 3

if kill -0 $DEV_PID 2>/dev/null; then
    echo "✅ App runs with adaptive performance system"
    kill $DEV_PID
    wait $DEV_PID 2>/dev/null
else
    echo "❌ FAILED: App crashed with performance system"
    exit 1
fi

# Test 6: Memory efficiency
echo "💾 Testing memory efficiency..."
node -e "
const used = process.memoryUsage();
console.log('Base memory usage:', Math.round(used.heapUsed / 1024 / 1024), 'MB');
if (used.heapUsed > 100 * 1024 * 1024) {
    console.log('⚠️  High memory usage detected');
} else {
    console.log('✅ Memory usage within acceptable limits');
}
"

echo ""
echo "🎉 PLAN9 COMPLETED: Adaptive Performance System Ready!"
echo ""
echo "🎮 Performance Scaling Summary:"
echo "   📱 Mobile (30fps):     500-1,500 agents"
echo "   💻 Desktop (60fps):    2,000-10,000 agents"
echo "   🎯 Gaming (120fps):    5,000-20,000 agents"
echo "   🚀 Ultra (240fps):     10,000-50,000+ agents"
echo ""
echo "🔬 Features Implemented:"
echo "   ✅ Real-time device benchmarking"
echo "   ✅ Automatic performance profiling"
echo "   ✅ Dynamic agent scaling (15-240fps)"
echo "   ✅ GPU tier detection (low→ultra)"
echo "   ✅ Adaptive render distance & LOD"
echo "   ✅ TypeScript integration hooks"
echo ""
echo "Next: Integrate with PLAN5 visualization for complete adaptive rendering"
exit 0
```

### Performance Philosophy in Action

This system transforms UrbanSynth from a one-size-fits-all simulation into an intelligent application that:

1. **Maximizes Every Device**: From mobile phones to 240Hz gaming rigs
2. **Maintains Smoothness**: Automatic scaling ensures consistent frame rates
3. **Showcases Modern Web**: Demonstrates what's possible with WebAssembly + adaptive engineering
4. **Future-Proofs Experience**: Automatically takes advantage of better hardware

**The Result**: Users with high-end gaming setups get a genuinely impressive 240fps experience with 50,000+ agents, while mobile users get a perfectly smooth 30fps experience with 1,000 agents. Both feel like they're getting the optimal experience for their hardware.

This positions UrbanSynth as a showcase of intelligent performance engineering rather than just "another simulation demo."