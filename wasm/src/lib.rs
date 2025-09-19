mod agent;
mod world;
mod simulation;
mod traffic;
mod pathfinding;
mod performance;
mod benchmarking;
mod adaptive_scaling;

use wasm_bindgen::prelude::*;
use serde_wasm_bindgen::to_value;
use std::cell::RefCell;
use std::rc::Rc;

use simulation::Simulation;
use world::CityModel;
use performance::PerformanceProfile;
use benchmarking::DeviceBenchmark;
use adaptive_scaling::AdaptiveScaler;

#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

thread_local! {
    static SIMULATION: Rc<RefCell<Option<Simulation>>> = Rc::new(RefCell::new(None));
}

#[wasm_bindgen(start)]
pub fn main() {
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
pub fn init(config: &JsValue) -> Result<(), JsValue> {
    // Parse city model from JSON config
    let city_data: CityModel = serde_wasm_bindgen::from_value(config.clone())?;

    SIMULATION.with(|sim| {
        let mut simulation = Simulation::new();
        simulation.init(city_data);
        *sim.borrow_mut() = Some(simulation);
    });

    Ok(())
}

#[wasm_bindgen]
pub fn init_with_seed(config: &JsValue, seed: u64) -> Result<(), JsValue> {
    let city_data: CityModel = serde_wasm_bindgen::from_value(config.clone())?;

    SIMULATION.with(|sim| {
        let mut simulation = Simulation::new_with_seed(seed);
        simulation.init_with_seed(city_data, seed);
        *sim.borrow_mut() = Some(simulation);
    });

    Ok(())
}

#[wasm_bindgen]
pub fn tick() {
    SIMULATION.with(|sim| {
        if let Some(ref mut simulation) = *sim.borrow_mut() {
            simulation.tick();
        }
    });
}

#[wasm_bindgen]
pub fn getAgentStates() -> JsValue {
    SIMULATION.with(|sim| {
        if let Some(ref simulation) = *sim.borrow() {
            let agents = simulation.get_agent_states();
            to_value(&agents).unwrap_or(JsValue::NULL)
        } else {
            JsValue::NULL
        }
    })
}

#[wasm_bindgen]
pub fn getTrafficData() -> JsValue {
    SIMULATION.with(|sim| {
        if let Some(ref simulation) = *sim.borrow() {
            let traffic_data = simulation.get_traffic_data();
            to_value(&traffic_data).unwrap_or(JsValue::NULL)
        } else {
            JsValue::NULL
        }
    })
}

#[wasm_bindgen]
pub fn start() {
    SIMULATION.with(|sim| {
        if let Some(ref mut simulation) = *sim.borrow_mut() {
            simulation.start();
        }
    });
}

#[wasm_bindgen]
pub fn pause() {
    SIMULATION.with(|sim| {
        if let Some(ref mut simulation) = *sim.borrow_mut() {
            simulation.pause();
        }
    });
}

#[wasm_bindgen]
pub fn setSpeed(multiplier: f32) {
    SIMULATION.with(|sim| {
        if let Some(ref mut simulation) = *sim.borrow_mut() {
            simulation.set_speed(multiplier);
        }
    });
}

#[wasm_bindgen]
pub fn isRunning() -> bool {
    SIMULATION.with(|sim| {
        if let Some(ref simulation) = *sim.borrow() {
            simulation.is_running()
        } else {
            false
        }
    })
}

#[wasm_bindgen]
pub fn getSimulationTime() -> f32 {
    SIMULATION.with(|sim| {
        if let Some(ref simulation) = *sim.borrow() {
            simulation.get_time()
        } else {
            0.0
        }
    })
}

#[wasm_bindgen]
pub fn getAgentCount() -> u32 {
    SIMULATION.with(|sim| {
        if let Some(ref simulation) = *sim.borrow() {
            simulation.get_agent_count()
        } else {
            0
        }
    })
}

#[wasm_bindgen]
pub fn getSeed() -> u64 {
    SIMULATION.with(|sim| {
        if let Some(ref simulation) = *sim.borrow() {
            simulation.get_seed()
        } else {
            0
        }
    })
}

// Export performance system classes directly for JS usage
#[wasm_bindgen]
pub struct WasmPerformanceProfile {
    inner: PerformanceProfile,
}

#[wasm_bindgen]
impl WasmPerformanceProfile {
    #[wasm_bindgen(constructor)]
    pub fn new() -> WasmPerformanceProfile {
        WasmPerformanceProfile {
            inner: PerformanceProfile::default(),
        }
    }

    #[wasm_bindgen(getter)]
    pub fn target_fps(&self) -> u32 {
        self.inner.target_fps()
    }

    #[wasm_bindgen(getter)]
    pub fn max_agents(&self) -> u32 {
        self.inner.max_agents()
    }

    #[wasm_bindgen(getter)]
    pub fn render_distance(&self) -> f32 {
        self.inner.render_distance()
    }

    #[wasm_bindgen(getter)]
    pub fn update_frequency(&self) -> u32 {
        self.inner.update_frequency()
    }
}

#[wasm_bindgen]
pub struct WasmDeviceBenchmark {
    inner: DeviceBenchmark,
}

#[wasm_bindgen]
impl WasmDeviceBenchmark {
    #[wasm_bindgen(constructor)]
    pub fn new() -> WasmDeviceBenchmark {
        WasmDeviceBenchmark {
            inner: DeviceBenchmark::new(),
        }
    }

    #[wasm_bindgen]
    pub fn run_cpu_test(&self) -> f64 {
        self.inner.run_cpu_test()
    }

    #[wasm_bindgen]
    pub fn test_memory_bandwidth(&self) -> f64 {
        self.inner.test_memory_bandwidth()
    }

    #[wasm_bindgen]
    pub fn get_recommended_profile(&self, cpu_score: f64, memory_mb: f64, refresh_rate: u32) -> WasmPerformanceProfile {
        let profile = self.inner.get_recommended_profile(cpu_score, memory_mb, refresh_rate);
        WasmPerformanceProfile { inner: profile }
    }
}

#[wasm_bindgen]
pub struct WasmAdaptiveScaler {
    inner: AdaptiveScaler,
}

#[wasm_bindgen]
impl WasmAdaptiveScaler {
    #[wasm_bindgen(constructor)]
    pub fn new() -> WasmAdaptiveScaler {
        WasmAdaptiveScaler {
            inner: AdaptiveScaler::new(),
        }
    }

    #[wasm_bindgen]
    pub fn set_target_fps(&mut self, fps: f64) {
        self.inner.set_target_fps(fps);
    }

    #[wasm_bindgen]
    pub fn update_fps(&mut self, current_fps: f64) {
        self.inner.update_fps_simple(current_fps);
    }

    #[wasm_bindgen]
    pub fn should_adapt(&self) -> bool {
        self.inner.should_adapt()
    }

    #[wasm_bindgen]
    pub fn get_adaptation_direction(&self) -> i32 {
        self.inner.get_adaptation_direction()
    }
}