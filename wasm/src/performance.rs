use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct PerformanceProfile {
    target_fps: u32,           // 15, 30, 60, 120, 144, 165, 240+
    max_agents: u32,           // Dynamic based on benchmark
    render_distance: f32,      // How far agents are visible
    update_frequency: u32,     // Simulation ticks per second
    lod_levels: u32,          // Level of detail steps
    culling_enabled: bool,     // Frustum culling for performance
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

    // Getters for wasm_bindgen
    #[wasm_bindgen(getter)]
    pub fn target_fps(&self) -> u32 { self.target_fps }

    #[wasm_bindgen(getter)]
    pub fn max_agents(&self) -> u32 { self.max_agents }

    #[wasm_bindgen(getter)]
    pub fn render_distance(&self) -> f32 { self.render_distance }

    #[wasm_bindgen(getter)]
    pub fn update_frequency(&self) -> u32 { self.update_frequency }

    #[wasm_bindgen(getter)]
    pub fn lod_levels(&self) -> u32 { self.lod_levels }

    #[wasm_bindgen(getter)]
    pub fn culling_enabled(&self) -> bool { self.culling_enabled }

    // Setters for wasm_bindgen
    #[wasm_bindgen(setter)]
    pub fn set_target_fps(&mut self, value: u32) { self.target_fps = value; }

    #[wasm_bindgen(setter)]
    pub fn set_max_agents(&mut self, value: u32) { self.max_agents = value; }

    #[wasm_bindgen(setter)]
    pub fn set_render_distance(&mut self, value: f32) { self.render_distance = value; }

    #[wasm_bindgen(setter)]
    pub fn set_update_frequency(&mut self, value: u32) { self.update_frequency = value; }

    #[wasm_bindgen(setter)]
    pub fn set_lod_levels(&mut self, value: u32) { self.lod_levels = value; }

    #[wasm_bindgen(setter)]
    pub fn set_culling_enabled(&mut self, value: bool) { self.culling_enabled = value; }
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