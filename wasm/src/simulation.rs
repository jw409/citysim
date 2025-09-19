use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use crate::world::{World, CityModel, System, WorldEvent};
use crate::traffic::TrafficData;
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimulationConfig {
    pub speed_multiplier: f32,
    pub max_agents: u32,
    pub enable_traffic_analysis: bool,
    pub enable_economics: bool, // Hidden extensibility: future economic system
    pub enable_weather: bool,   // Hidden extensibility: future weather system

    // Hidden extensibility: Module configuration
    pub modules: HashMap<String, bool>,
    pub module_config: HashMap<String, HashMap<String, f32>>,
}

impl Default for SimulationConfig {
    fn default() -> Self {
        Self {
            speed_multiplier: 1.0,
            max_agents: 1000,
            enable_traffic_analysis: true,
            enable_economics: false,
            enable_weather: false,
            modules: HashMap::new(),
            module_config: HashMap::new(),
        }
    }
}

pub struct Simulation {
    pub world: World,
    pub running: bool,
    pub speed_multiplier: f32,
    pub config: SimulationConfig,
    pub seed: u64, // Deterministic seed for reproducible simulations

    // Hidden extensibility: Tick phases for complex systems
    pub pre_update_hooks: Vec<Box<dyn SimulationHook>>,
    pub post_update_hooks: Vec<Box<dyn SimulationHook>>,

    // Hidden extensibility: Performance monitoring
    pub tick_count: u64,
    pub total_time: f32,
    pub average_tick_time: f32,

    // Hidden extensibility: Command queue for replay/networking
    pub command_queue: Vec<SimulationCommand>,
    pub command_history: Vec<(f32, SimulationCommand)>, // (timestamp, command)

    // Hidden extensibility: Module registry
    pub loaded_modules: HashMap<String, Box<dyn SimulationModule>>,
}

// Hidden extensibility: Hook system for pre/post update logic
pub trait SimulationHook: Send + Sync {
    fn execute(&mut self, simulation: &mut Simulation, dt: f32);
    fn name(&self) -> &str;
}

// Hidden extensibility: Module system for game-like features
pub trait SimulationModule: Send + Sync {
    fn initialize(&mut self, world: &mut World, config: &HashMap<String, f32>);
    fn update(&mut self, world: &mut World, dt: f32);
    fn handle_command(&mut self, world: &mut World, command: &SimulationCommand) -> bool;
    fn name(&self) -> &str;
    fn version(&self) -> &str { "1.0.0" }
}

// Hidden extensibility: Command pattern for complex interactions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SimulationCommand {
    // Basic world modification commands
    AddPOI { poi_data: String },
    RemovePOI { poi_id: String },
    ModifyPOI { poi_id: String, property: String, value: f32 },

    // Agent commands
    SpawnAgent { position: (f32, f32), agent_type: String },
    RemoveAgent { agent_id: u32 },
    SetAgentDestination { agent_id: u32, destination: String },

    // System control commands
    SetSpeed { multiplier: f32 },
    PauseSimulation,
    ResumeSimulation,

    // Hidden extensibility: Economic commands
    // AddMoney { amount: f32 },
    // BuildBuilding { building_type: String, position: (f32, f32) },
    // SetTaxRate { rate: f32 },

    // Hidden extensibility: Social commands
    // CreateEvent { event_type: String, location: (f32, f32) },
    // SetAgentMood { agent_id: u32, mood: String },

    // Custom command for mods
    Custom { module_name: String, command_data: String },
}

impl Simulation {
    pub fn new() -> Self {
        Self {
            world: World::new(),
            running: false,
            speed_multiplier: 1.0,
            config: SimulationConfig::default(),
            pre_update_hooks: Vec::new(),
            post_update_hooks: Vec::new(),
            tick_count: 0,
            total_time: 0.0,
            average_tick_time: 0.0,
            command_queue: Vec::new(),
            command_history: Vec::new(),
            loaded_modules: HashMap::new(),
        }
    }

    pub fn init(&mut self, city_data: CityModel) {
        self.init_with_config(city_data, SimulationConfig::default());
    }

    pub fn init_with_config(&mut self, city_data: CityModel, config: SimulationConfig) {
        self.config = config;
        self.speed_multiplier = self.config.speed_multiplier;
        self.world.load_city(city_data);

        // Initialize modules based on config
        self.initialize_modules();

        self.running = false;
    }

    // Hidden extensibility: Module initialization
    fn initialize_modules(&mut self) {
        // Initialize enabled modules
        for (module_name, enabled) in &self.config.modules {
            if *enabled {
                if let Some(module) = self.create_module(module_name) {
                    let module_config = self.config.module_config
                        .get(module_name)
                        .cloned()
                        .unwrap_or_default();

                    let mut module = module;
                    module.initialize(&mut self.world, &module_config);
                    self.loaded_modules.insert(module_name.clone(), module);
                }
            }
        }
    }

    // Hidden extensibility: Module factory
    fn create_module(&self, module_name: &str) -> Option<Box<dyn SimulationModule>> {
        match module_name {
            // "economics" => Some(Box::new(EconomicsModule::new())),
            // "weather" => Some(Box::new(WeatherModule::new())),
            // "social" => Some(Box::new(SocialModule::new())),
            _ => None, // Future: load from plugin directory
        }
    }

    pub fn tick(&mut self) {
        if !self.running { return; }

        let start_time = js_sys::Date::now() as f32;
        let dt = 0.016 * self.speed_multiplier; // ~60 FPS

        // Execute pre-update hooks
        for hook in &mut self.pre_update_hooks {
            hook.execute(self, dt);
        }

        // Process command queue
        self.process_commands();

        // Update modules
        for module in self.loaded_modules.values_mut() {
            module.update(&mut self.world, dt);
        }

        // Update world
        self.world.update(dt);

        // Execute post-update hooks
        for hook in &mut self.post_update_hooks {
            hook.execute(self, dt);
        }

        // Update performance metrics
        self.tick_count += 1;
        let tick_time = js_sys::Date::now() as f32 - start_time;
        self.total_time += tick_time;
        self.average_tick_time = self.total_time / self.tick_count as f32;
    }

    fn process_commands(&mut self) {
        let commands = std::mem::take(&mut self.command_queue);

        for command in commands {
            // Store in history for replay
            self.command_history.push((self.world.time, command.clone()));

            // Try to handle with modules first
            let mut handled = false;
            for module in self.loaded_modules.values_mut() {
                if module.handle_command(&mut self.world, &command) {
                    handled = true;
                    break;
                }
            }

            // Handle core commands if not handled by modules
            if !handled {
                self.handle_core_command(command);
            }
        }
    }

    fn handle_core_command(&mut self, command: SimulationCommand) {
        match command {
            SimulationCommand::SetSpeed { multiplier } => {
                self.set_speed(multiplier);
            }
            SimulationCommand::PauseSimulation => {
                self.pause();
            }
            SimulationCommand::ResumeSimulation => {
                self.start();
            }
            SimulationCommand::RemovePOI { poi_id } => {
                self.world.remove_poi(&poi_id);
            }
            SimulationCommand::SpawnAgent { position, agent_type: _ } => {
                // Simple agent spawning for v1.0
                let agent_id = self.world.agents.len() as u32;
                let agent = crate::agent::Agent::new(agent_id, crate::agent::Point2D::new(position.0, position.1));
                self.world.agents.push(agent);
                self.world.post_event(WorldEvent::AgentSpawned { agent_id });
            }
            SimulationCommand::RemoveAgent { agent_id } => {
                self.world.agents.retain(|agent| agent.id != agent_id);
                self.world.post_event(WorldEvent::AgentDestroyed { agent_id });
            }
            _ => {
                // Unknown command - could be handled by future modules
            }
        }
    }

    pub fn execute_command(&mut self, command: SimulationCommand) {
        self.command_queue.push(command);
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

    // Hidden extensibility: Performance monitoring
    pub fn get_performance_stats(&self) -> PerformanceStats {
        PerformanceStats {
            tick_count: self.tick_count,
            average_tick_time: self.average_tick_time,
            agent_count: self.world.agents.len() as u32,
            active_systems: self.world.systems.len() as u32,
            total_entities: self.world.entities.len() as u32,
        }
    }

    // Hidden extensibility: Add hooks dynamically
    pub fn add_pre_update_hook(&mut self, hook: Box<dyn SimulationHook>) {
        self.pre_update_hooks.push(hook);
    }

    pub fn add_post_update_hook(&mut self, hook: Box<dyn SimulationHook>) {
        self.post_update_hooks.push(hook);
    }

    // Hidden extensibility: Save/load system
    pub fn save_simulation(&self) -> String {
        // For v1.0, just save the world state
        // Future: save entire simulation state including modules
        self.world.save_state()
    }

    pub fn load_simulation(&mut self, save_data: &str) {
        self.world.load_state(save_data);
    }

    // Hidden extensibility: Replay system
    pub fn start_recording(&mut self) {
        self.command_history.clear();
    }

    pub fn replay_from_history(&mut self, from_time: f32) {
        // Reset to initial state and replay commands
        // Implementation would depend on full save/load system
        for (timestamp, command) in &self.command_history {
            if *timestamp >= from_time {
                self.execute_command(command.clone());
            }
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceStats {
    pub tick_count: u64,
    pub average_tick_time: f32,
    pub agent_count: u32,
    pub active_systems: u32,
    pub total_entities: u32,
}

// Hidden extensibility: Example hook implementation
#[derive(Debug)]
pub struct PerformanceMonitorHook {
    warn_threshold: f32,
    last_warning: f32,
}

impl PerformanceMonitorHook {
    pub fn new(warn_threshold: f32) -> Self {
        Self {
            warn_threshold,
            last_warning: 0.0,
        }
    }
}

impl SimulationHook for PerformanceMonitorHook {
    fn execute(&mut self, simulation: &mut Simulation, _dt: f32) {
        if simulation.average_tick_time > self.warn_threshold {
            let current_time = simulation.world.time;
            if current_time - self.last_warning > 5.0 { // Warn at most every 5 seconds
                web_sys::console::warn_1(&format!("Performance warning: average tick time {:.2}ms", simulation.average_tick_time).into());
                self.last_warning = current_time;
            }
        }
    }

    fn name(&self) -> &str { "performance_monitor" }
}

// Hidden extensibility: Example module implementation
#[derive(Debug)]
pub struct DebugModule {
    enabled: bool,
    log_frequency: f32,
    last_log: f32,
}

impl DebugModule {
    pub fn new() -> Self {
        Self {
            enabled: true,
            log_frequency: 10.0, // Log every 10 seconds
            last_log: 0.0,
        }
    }
}

impl SimulationModule for DebugModule {
    fn initialize(&mut self, _world: &mut World, config: &HashMap<String, f32>) {
        self.enabled = config.get("enabled").unwrap_or(&1.0) > 0.0;
        self.log_frequency = config.get("log_frequency").unwrap_or(&10.0);
    }

    fn update(&mut self, world: &mut World, _dt: f32) {
        if !self.enabled { return; }

        if world.time - self.last_log >= self.log_frequency {
            web_sys::console::log_1(&format!(
                "Debug: Day {}, Time {:.1}, Agents: {}, Events: {}",
                world.day,
                world.time,
                world.agents.len(),
                world.event_queue.len()
            ).into());
            self.last_log = world.time;
        }
    }

    fn handle_command(&mut self, _world: &mut World, command: &SimulationCommand) -> bool {
        match command {
            SimulationCommand::Custom { module_name, command_data } => {
                if module_name == "debug" {
                    web_sys::console::log_1(&format!("Debug command: {}", command_data).into());
                    return true;
                }
            }
            _ => {}
        }
        false
    }

    fn name(&self) -> &str { "debug" }
}