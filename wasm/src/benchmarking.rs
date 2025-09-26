use wasm_bindgen::prelude::*;
use web_sys::console;
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
        let mut _computation_sum = 0.0;

        for n in 2..20000 {
            if self.is_prime(n) {
                primes_found += 1;
            }
            // Add floating point operations for comprehensive CPU test
            _computation_sum += (n as f64).sqrt() * (n as f64).sin();
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
        self.gpu_tier = gpu_tier.clone();

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

        let mut profile = PerformanceProfile::new();
        profile.set_target_fps(target_fps);
        profile.set_max_agents(max_agents);
        profile.set_render_distance(render_distance);
        profile.set_update_frequency(target_fps);
        profile.set_lod_levels(lod_levels);
        profile.set_culling_enabled(culling_enabled);

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

        let target_fps = self.calculate_target_fps();
        let fps_multiplier = match target_fps {
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

    // Methods expected by lib.rs
    #[wasm_bindgen]
    pub fn run_cpu_test(&self) -> f64 {
        self.cpu_score
    }

    #[wasm_bindgen]
    pub fn test_memory_bandwidth(&self) -> f64 {
        // Simple memory test score based on available memory
        (self.memory_mb / 1024.0) * 100.0 // Convert GB to score
    }

    #[wasm_bindgen]
    pub fn get_recommended_profile(&self, cpu_score: f64, memory_mb: f64, refresh_rate: u32) -> PerformanceProfile {
        let mut benchmark = DeviceBenchmark::new();
        benchmark.cpu_score = cpu_score;
        benchmark.memory_mb = memory_mb;
        benchmark.refresh_rate = refresh_rate;
        benchmark.generate_profile()
    }
}