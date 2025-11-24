export interface PerformanceProfile {
  target_fps: number;
  max_agents: number;
  render_distance: number;
  update_frequency: number;
  level: PerformanceLevel;
}

export enum PerformanceLevel {
  UltraLow = 0, // 500 agents, 15fps, potato devices
  Low = 1, // 2000 agents, 30fps, entry phones
  Medium = 2, // 5000 agents, 60fps, mid-range
  High = 3, // 15000 agents, 120fps, gaming laptops
  Ultra = 4, // 50000+ agents, 240fps, ultra gaming
}

export interface DeviceMetrics {
  cpu_cores: number;
  memory_gb: number;
  gpu_score: number;
  refresh_rate: number;
  battery_level?: number;
  is_charging?: boolean;
}

export interface PerformanceMetrics {
  current_fps: number;
  target_fps: number;
  frame_time_ms: number;
  agent_count: number;
  memory_usage_mb: number;
  gpu_utilization: number;
  cpu_utilization: number;
}

export interface AdaptationSettings {
  enable_auto_scaling: boolean;
  fps_tolerance: number;
  adaptation_delay_ms: number;
  min_stable_frames: number;
  performance_priority: 'quality' | 'performance' | 'balanced';
}

export interface PerformanceState {
  current_profile: PerformanceProfile;
  metrics: PerformanceMetrics;
  adaptation_settings: AdaptationSettings;
  is_adapting: boolean;
  last_adaptation_time: number;
}

export interface DeviceBenchmarkResult {
  overall_score: number;
  recommended_profile: PerformanceProfile;
  benchmark_duration_ms: number;
  test_results: {
    cpu_score: number;
    memory_score: number;
    render_score: number;
  };
}
