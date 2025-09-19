use serde::{Deserialize, Serialize};
use crate::world::{World, CityModel};
use crate::traffic::TrafficData;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimulationConfig {
    pub speed_multiplier: f32,
    pub max_agents: u32,
}

impl Default for SimulationConfig {
    fn default() -> Self {
        Self {
            speed_multiplier: 1.0,
            max_agents: 1000,
        }
    }
}

pub struct Simulation {
    pub world: World,
    pub running: bool,
    pub speed_multiplier: f32,
    pub config: SimulationConfig,
    pub seed: u64,
}

impl Simulation {
    pub fn new() -> Self {
        Self::new_with_seed(js_sys::Date::now() as u64)
    }

    pub fn new_with_seed(seed: u64) -> Self {
        Self {
            world: World::new(),
            running: false,
            speed_multiplier: 1.0,
            config: SimulationConfig::default(),
            seed,
        }
    }

    pub fn init(&mut self, city_data: CityModel) {
        self.init_with_config(city_data, SimulationConfig::default());
    }

    pub fn init_with_config(&mut self, city_data: CityModel, config: SimulationConfig) {
        self.config = config;
        self.speed_multiplier = self.config.speed_multiplier;
        self.world.load_city_with_seed(city_data, self.seed);
        self.running = false;
    }

    pub fn init_with_seed(&mut self, city_data: CityModel, seed: u64) {
        self.seed = seed;
        self.init_with_config(city_data, SimulationConfig::default());
    }

    pub fn tick(&mut self) {
        if self.running {
            let dt = 0.016 * self.speed_multiplier; // ~60 FPS
            self.world.update(dt);
        }
    }

    pub fn start(&mut self) {
        self.running = true;
    }

    pub fn pause(&mut self) {
        self.running = false;
    }

    pub fn set_speed(&mut self, multiplier: f32) {
        self.speed_multiplier = multiplier.max(0.1).min(10.0);
        self.config.speed_multiplier = self.speed_multiplier;
    }

    pub fn get_agent_states(&self) -> Vec<&crate::agent::Agent> {
        self.world.agents.iter().collect()
    }

    pub fn get_traffic_data(&self) -> TrafficData {
        TrafficData::from_agents(&self.world.agents, &self.world.city.roads)
    }

    pub fn is_running(&self) -> bool {
        self.running
    }

    pub fn get_time(&self) -> f32 {
        self.world.time
    }

    pub fn get_agent_count(&self) -> u32 {
        self.world.agents.len() as u32
    }

    pub fn get_seed(&self) -> u64 {
        self.seed
    }
}