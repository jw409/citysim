mod agent;
mod world;
mod simulation;
mod traffic;
mod pathfinding;

use wasm_bindgen::prelude::*;
use serde_wasm_bindgen::to_value;
use std::cell::RefCell;
use std::rc::Rc;

use simulation::Simulation;
use world::CityModel;

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