/* tslint:disable */
/* eslint-disable */
export function main(): void;
export function init(config: any): void;
export function init_with_seed(config: any, seed: bigint): void;
export function tick(): void;
export function getAgentStates(): any;
export function getTrafficData(): any;
export function start(): void;
export function pause(): void;
export function setSpeed(multiplier: number): void;
export function isRunning(): boolean;
export function getSimulationTime(): number;
export function getAgentCount(): number;
export function getSeed(): bigint;
export class AdaptiveScaler {
  free(): void;
  constructor();
  static new_with_profile(profile: PerformanceProfile): AdaptiveScaler;
  update_fps(fps: number, delta_time: number): void;
  set_scaling_enabled(enabled: boolean): void;
  force_profile_update(max_agents: number): void;
  get_current_profile(): PerformanceProfile;
  set_target_fps(fps: number): void;
  update_fps_simple(current_fps: number): void;
  should_adapt(): boolean;
  get_adaptation_direction(): number;
  readonly current_max_agents: number;
  readonly current_fps: number;
  readonly target_fps: number;
  readonly fps_stability: number;
  readonly render_distance: number;
  readonly scaling_enabled: boolean;
}
export class DeviceBenchmark {
  free(): void;
  constructor();
  run_cpu_benchmark(): number;
  set_device_info(refresh_rate: number, is_mobile: boolean, memory_mb: number, gpu_tier: string): void;
  generate_profile(): PerformanceProfile;
  run_cpu_test(): number;
  test_memory_bandwidth(): number;
  get_recommended_profile(cpu_score: number, memory_mb: number, refresh_rate: number): PerformanceProfile;
  readonly cpu_score: number;
  readonly refresh_rate: number;
  readonly is_mobile: boolean;
  readonly memory_mb: number;
  readonly gpu_tier: string;
}
export class PerformanceProfile {
  free(): void;
  constructor();
  static auto_detect(): PerformanceProfile;
  static for_ultra_gaming(): PerformanceProfile;
  static for_high_end(): PerformanceProfile;
  static for_standard(): PerformanceProfile;
  static for_mobile(): PerformanceProfile;
  target_fps: number;
  max_agents: number;
  render_distance: number;
  update_frequency: number;
  lod_levels: number;
  culling_enabled: boolean;
}
export class WasmAdaptiveScaler {
  free(): void;
  constructor();
  set_target_fps(fps: number): void;
  update_fps(current_fps: number): void;
  should_adapt(): boolean;
  get_adaptation_direction(): number;
}
export class WasmDeviceBenchmark {
  free(): void;
  constructor();
  run_cpu_test(): number;
  test_memory_bandwidth(): number;
  get_recommended_profile(cpu_score: number, memory_mb: number, refresh_rate: number): WasmPerformanceProfile;
}
export class WasmPerformanceProfile {
  free(): void;
  constructor();
  readonly target_fps: number;
  readonly max_agents: number;
  readonly render_distance: number;
  readonly update_frequency: number;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_adaptivescaler_free: (a: number, b: number) => void;
  readonly adaptivescaler_new: () => number;
  readonly adaptivescaler_new_with_profile: (a: number) => number;
  readonly adaptivescaler_update_fps: (a: number, b: number, c: number) => void;
  readonly adaptivescaler_set_scaling_enabled: (a: number, b: number) => void;
  readonly adaptivescaler_force_profile_update: (a: number, b: number) => void;
  readonly adaptivescaler_get_current_profile: (a: number) => number;
  readonly adaptivescaler_current_max_agents: (a: number) => number;
  readonly adaptivescaler_current_fps: (a: number) => number;
  readonly adaptivescaler_target_fps: (a: number) => number;
  readonly adaptivescaler_fps_stability: (a: number) => number;
  readonly adaptivescaler_render_distance: (a: number) => number;
  readonly adaptivescaler_scaling_enabled: (a: number) => number;
  readonly adaptivescaler_set_target_fps: (a: number, b: number) => void;
  readonly adaptivescaler_update_fps_simple: (a: number, b: number) => void;
  readonly adaptivescaler_should_adapt: (a: number) => number;
  readonly adaptivescaler_get_adaptation_direction: (a: number) => number;
  readonly main: () => void;
  readonly init: (a: any) => [number, number];
  readonly init_with_seed: (a: any, b: bigint) => [number, number];
  readonly tick: () => void;
  readonly getAgentStates: () => any;
  readonly getTrafficData: () => any;
  readonly start: () => void;
  readonly pause: () => void;
  readonly setSpeed: (a: number) => void;
  readonly isRunning: () => number;
  readonly getSimulationTime: () => number;
  readonly getAgentCount: () => number;
  readonly getSeed: () => bigint;
  readonly __wbg_wasmperformanceprofile_free: (a: number, b: number) => void;
  readonly wasmperformanceprofile_new: () => number;
  readonly wasmperformanceprofile_target_fps: (a: number) => number;
  readonly wasmperformanceprofile_max_agents: (a: number) => number;
  readonly wasmperformanceprofile_render_distance: (a: number) => number;
  readonly wasmperformanceprofile_update_frequency: (a: number) => number;
  readonly __wbg_wasmdevicebenchmark_free: (a: number, b: number) => void;
  readonly wasmdevicebenchmark_new: () => number;
  readonly wasmdevicebenchmark_run_cpu_test: (a: number) => number;
  readonly wasmdevicebenchmark_test_memory_bandwidth: (a: number) => number;
  readonly wasmdevicebenchmark_get_recommended_profile: (a: number, b: number, c: number, d: number) => number;
  readonly __wbg_wasmadaptivescaler_free: (a: number, b: number) => void;
  readonly wasmadaptivescaler_new: () => number;
  readonly wasmadaptivescaler_set_target_fps: (a: number, b: number) => void;
  readonly wasmadaptivescaler_update_fps: (a: number, b: number) => void;
  readonly wasmadaptivescaler_should_adapt: (a: number) => number;
  readonly wasmadaptivescaler_get_adaptation_direction: (a: number) => number;
  readonly __wbg_devicebenchmark_free: (a: number, b: number) => void;
  readonly devicebenchmark_new: () => number;
  readonly devicebenchmark_run_cpu_benchmark: (a: number) => number;
  readonly devicebenchmark_set_device_info: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly devicebenchmark_generate_profile: (a: number) => number;
  readonly devicebenchmark_cpu_score: (a: number) => number;
  readonly devicebenchmark_refresh_rate: (a: number) => number;
  readonly devicebenchmark_is_mobile: (a: number) => number;
  readonly devicebenchmark_memory_mb: (a: number) => number;
  readonly devicebenchmark_gpu_tier: (a: number) => [number, number];
  readonly devicebenchmark_run_cpu_test: (a: number) => number;
  readonly devicebenchmark_test_memory_bandwidth: (a: number) => number;
  readonly devicebenchmark_get_recommended_profile: (a: number, b: number, c: number, d: number) => number;
  readonly __wbg_performanceprofile_free: (a: number, b: number) => void;
  readonly performanceprofile_new: () => number;
  readonly performanceprofile_auto_detect: () => number;
  readonly performanceprofile_for_ultra_gaming: () => number;
  readonly performanceprofile_for_high_end: () => number;
  readonly performanceprofile_for_standard: () => number;
  readonly performanceprofile_for_mobile: () => number;
  readonly performanceprofile_target_fps: (a: number) => number;
  readonly performanceprofile_max_agents: (a: number) => number;
  readonly performanceprofile_render_distance: (a: number) => number;
  readonly performanceprofile_update_frequency: (a: number) => number;
  readonly performanceprofile_lod_levels: (a: number) => number;
  readonly performanceprofile_culling_enabled: (a: number) => number;
  readonly performanceprofile_set_target_fps: (a: number, b: number) => void;
  readonly performanceprofile_set_max_agents: (a: number, b: number) => void;
  readonly performanceprofile_set_render_distance: (a: number, b: number) => void;
  readonly performanceprofile_set_update_frequency: (a: number, b: number) => void;
  readonly performanceprofile_set_lod_levels: (a: number, b: number) => void;
  readonly performanceprofile_set_culling_enabled: (a: number, b: number) => void;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_export_2: WebAssembly.Table;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
