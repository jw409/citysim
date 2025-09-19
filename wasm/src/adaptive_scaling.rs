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
    pub fn new() -> AdaptiveScaler {
        let default_profile = PerformanceProfile::default();
        let target_fps = default_profile.target_fps() as f64;

        console::log_2(
            &"🎮 Adaptive scaler initialized with target FPS:".into(),
            &target_fps.into()
        );

        AdaptiveScaler {
            target_fps,
            current_profile: default_profile,
            current_fps: target_fps,
            fps_history: Vec::with_capacity(120), // 2 seconds of history at 60fps
            adjustment_timer: 0.0,
            scaling_enabled: true,
        }
    }

    #[wasm_bindgen]
    pub fn new_with_profile(profile: PerformanceProfile) -> AdaptiveScaler {
        let target_fps = profile.target_fps() as f64;

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
        else if performance_gap > 0.20 && self.current_profile.max_agents() < 80000 {
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
        let old_agents = self.current_profile.max_agents();
        let reduction_factor = 0.85; // Reduce by 15%

        let new_agents = ((old_agents as f64) * reduction_factor)
            .max(100.0) as u32;
        self.current_profile.set_max_agents(new_agents);

        // Also reduce render distance if agents are already quite low
        if new_agents < 1000 {
            let new_distance = self.current_profile.render_distance() * 0.9;
            self.current_profile.set_render_distance(new_distance);
        }

        console::log_3(
            &"📉 Scaling DOWN agents:".into(),
            &old_agents.into(),
            &format!(" → {}", new_agents).into()
        );
    }

    fn scale_up_performance(&mut self) {
        let old_agents = self.current_profile.max_agents();
        let increase_factor = 1.15; // Increase by 15%

        let new_agents = ((old_agents as f64) * increase_factor)
            .min(100000.0) as u32;
        self.current_profile.set_max_agents(new_agents);

        console::log_3(
            &"📈 Scaling UP agents:".into(),
            &old_agents.into(),
            &format!(" → {}", new_agents).into()
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
        self.current_profile.set_max_agents(max_agents);
        console::log_2(&"🔧 Manual agent count override:".into(), &max_agents.into());
    }

    #[wasm_bindgen]
    pub fn get_current_profile(&self) -> PerformanceProfile {
        self.current_profile.clone()
    }

    // Getters for JavaScript integration
    #[wasm_bindgen(getter)]
    pub fn current_max_agents(&self) -> u32 { self.current_profile.max_agents() }

    #[wasm_bindgen(getter)]
    pub fn current_fps(&self) -> f64 { self.current_fps }

    #[wasm_bindgen(getter)]
    pub fn target_fps(&self) -> f64 { self.target_fps }

    #[wasm_bindgen(getter)]
    pub fn fps_stability(&self) -> f64 { self.calculate_fps_stability() }

    #[wasm_bindgen(getter)]
    pub fn render_distance(&self) -> f32 { self.current_profile.render_distance() }

    #[wasm_bindgen(getter)]
    pub fn scaling_enabled(&self) -> bool { self.scaling_enabled }

    // Methods expected by lib.rs
    #[wasm_bindgen]
    pub fn set_target_fps(&mut self, fps: f64) {
        self.target_fps = fps;
    }

    #[wasm_bindgen]
    pub fn update_fps_simple(&mut self, current_fps: f64) {
        self.update_fps(current_fps, 16.67); // Assume 60fps delta time
    }

    #[wasm_bindgen]
    pub fn should_adapt(&self) -> bool {
        if !self.scaling_enabled || self.fps_history.len() < 30 {
            return false;
        }

        let avg_fps = self.fps_history.iter().sum::<f64>() / self.fps_history.len() as f64;
        let performance_gap = (avg_fps - self.target_fps) / self.target_fps;

        performance_gap.abs() > 0.15
    }

    #[wasm_bindgen]
    pub fn get_adaptation_direction(&self) -> i32 {
        if !self.should_adapt() {
            return 0; // No adaptation needed
        }

        let avg_fps = self.fps_history.iter().sum::<f64>() / self.fps_history.len() as f64;
        if avg_fps < self.target_fps * 0.85 {
            -1 // Scale down
        } else if avg_fps > self.target_fps * 1.20 {
            1 // Scale up
        } else {
            0 // No change
        }
    }
}