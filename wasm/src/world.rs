use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use crate::agent::{Agent, Point2D, BasicWorldContext, WorldContext};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CityModel {
    pub zones: Vec<Zone>,
    pub roads: Vec<Road>,
    pub pois: Vec<POI>,
    pub buildings: Vec<Building>,

    // Hidden extensibility: Additional entity types
    pub meta: HashMap<String, String>, // For storing arbitrary metadata
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Zone {
    pub id: String,
    pub zone_type: u32,
    pub boundary: Vec<Point2D>,
    pub density: f32,
    // Hidden extensibility: zone properties
    pub properties: HashMap<String, f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Road {
    pub id: String,
    pub road_type: u32,
    pub path: Vec<Point2D>,
    pub width: f32,
    pub lanes: u32,
    pub speed_limit: f32,
    // Hidden extensibility: road properties (traffic lights, tolls, etc.)
    pub properties: HashMap<String, f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct POI {
    pub id: String,
    pub poi_type: u32,
    pub position: Point2D,
    pub zone_id: String,
    pub capacity: u32,
    // Hidden extensibility: POI properties (operating hours, services, etc.)
    pub properties: HashMap<String, f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Building {
    pub id: String,
    pub footprint: Vec<Point2D>,
    pub height: f32,
    pub zone_id: String,
    pub building_type: u32,
    // Hidden extensibility: building properties (floors, units, etc.)
    pub properties: HashMap<String, f32>,
}

// Hidden extensibility: Event system for complex interactions
#[derive(Debug, Clone)]
pub enum WorldEvent {
    AgentSpawned { agent_id: u32 },
    AgentDestroyed { agent_id: u32 },
    AgentReachedDestination { agent_id: u32, poi_id: String },
    POIAdded { poi_id: String },
    POIRemoved { poi_id: String },
    TrafficJam { road_id: String, severity: f32 },
    // Future extensibility: weather, disasters, economic events, etc.
    // WeatherChanged { weather_type: String },
    // EconomicEvent { event_type: String, impact: f32 },
    // EmergencyEvent { event_type: String, location: Point2D },
}

// Hidden extensibility: System trait for pluggable systems
pub trait System: Send + Sync {
    fn update(&mut self, world: &mut World, dt: f32);
    fn handle_event(&mut self, event: &WorldEvent);
    fn name(&self) -> &str;
    fn priority(&self) -> i32 { 0 } // Higher priority systems run first
}

pub struct World {
    pub city: CityModel,
    pub agents: Vec<Agent>,
    pub time: f32,
    pub day: u32,

    // Lookup tables for performance
    pub poi_lookup: HashMap<String, usize>,
    pub zone_lookup: HashMap<String, usize>,
    pub road_lookup: HashMap<String, usize>,
    pub building_lookup: HashMap<String, usize>,

    // Hidden extensibility: Event system
    pub event_queue: Vec<WorldEvent>,
    pub event_history: Vec<(f32, WorldEvent)>, // (timestamp, event) for replay

    // Hidden extensibility: Pluggable systems
    #[serde(skip)]
    pub systems: Vec<Box<dyn System>>,

    // Hidden extensibility: Entity registry (simplified ECS)
    pub entities: HashMap<String, HashMap<String, f32>>, // entity_id -> component_name -> value

    // Hidden extensibility: Save/load state
    pub state_version: u32,

    // Hidden extensibility: Resource system (dormant in v1.0)
    pub resources: HashMap<String, f32>, // resource_name -> amount
}

impl World {
    pub fn new() -> Self {
        Self {
            city: CityModel {
                zones: Vec::new(),
                roads: Vec::new(),
                pois: Vec::new(),
                buildings: Vec::new(),
                meta: HashMap::new(),
            },
            agents: Vec::new(),
            time: 0.0,
            day: 0,
            poi_lookup: HashMap::new(),
            zone_lookup: HashMap::new(),
            road_lookup: HashMap::new(),
            building_lookup: HashMap::new(),
            event_queue: Vec::new(),
            event_history: Vec::new(),
            systems: Vec::new(),
            entities: HashMap::new(),
            state_version: 1,
            resources: HashMap::new(),
        }
    }

    pub fn load_city(&mut self, city_data: CityModel) {
        self.city = city_data;
        self.build_lookups();
        self.spawn_agents();
        self.post_event(WorldEvent::AgentSpawned { agent_id: 0 }); // Example event
    }

    fn build_lookups(&mut self) {
        self.poi_lookup.clear();
        for (i, poi) in self.city.pois.iter().enumerate() {
            self.poi_lookup.insert(poi.id.clone(), i);
        }

        self.zone_lookup.clear();
        for (i, zone) in self.city.zones.iter().enumerate() {
            self.zone_lookup.insert(zone.id.clone(), i);
        }

        self.road_lookup.clear();
        for (i, road) in self.city.roads.iter().enumerate() {
            self.road_lookup.insert(road.id.clone(), i);
        }

        self.building_lookup.clear();
        for (i, building) in self.city.buildings.iter().enumerate() {
            self.building_lookup.insert(building.id.clone(), i);
        }
    }

    fn spawn_agents(&mut self) {
        let mut agent_id = 0;

        // Spawn agents at residential POIs
        for poi in &self.city.pois {
            if poi.poi_type == 0 { // HOME
                let num_agents = (poi.capacity as f32 * 0.3) as u32; // 30% occupancy
                for _ in 0..num_agents {
                    let mut agent = Agent::new(agent_id, poi.position.clone());
                    agent.generate_daily_schedule(&mut rand::thread_rng());

                    // Hidden extensibility: Add custom properties based on POI
                    if let Some(income_level) = poi.properties.get("income_level") {
                        agent.set_property("income".to_string(), *income_level);
                    }

                    self.agents.push(agent);
                    self.post_event(WorldEvent::AgentSpawned { agent_id });
                    agent_id += 1;
                }
            }
        }
    }

    pub fn update(&mut self, dt: f32) {
        self.time += dt;

        // Handle day transitions
        if self.time >= 24.0 {
            self.time -= 24.0;
            self.day += 1;
            self.regenerate_schedules();
        }

        // Create world context for agents
        let world_context = BasicWorldContext {
            time: self.time,
            day: self.day,
        };

        // Update all systems (hidden extensibility)
        self.systems.sort_by_key(|s| -s.priority()); // Sort by priority (highest first)
        for system in &mut self.systems {
            system.update(self, dt);
        }

        // Update all agents
        for agent in &mut self.agents {
            agent.update(dt, self.time, &world_context);
        }

        // Process events
        self.process_events();
    }

    // Hidden extensibility: Event system
    pub fn post_event(&mut self, event: WorldEvent) {
        self.event_queue.push(event);
    }

    fn process_events(&mut self) {
        let events = std::mem::take(&mut self.event_queue);

        for event in events {
            // Store in history for replay capability
            self.event_history.push((self.time, event.clone()));

            // Notify all systems
            for system in &mut self.systems {
                system.handle_event(&event);
            }

            // Handle core world events
            self.handle_core_event(&event);
        }
    }

    fn handle_core_event(&mut self, event: &WorldEvent) {
        match event {
            WorldEvent::AgentReachedDestination { agent_id, poi_id } => {
                // Update agent's current POI
                if let Some(agent) = self.agents.iter_mut().find(|a| a.id == *agent_id) {
                    agent.current_poi = Some(poi_id.clone());
                }
            }
            WorldEvent::POIRemoved { poi_id } => {
                self.remove_poi(poi_id);
            }
            _ => {}
        }
    }

    fn regenerate_schedules(&mut self) {
        for agent in &mut self.agents {
            agent.generate_daily_schedule(&mut rand::thread_rng());
            agent.current_schedule_index = 0;
        }
    }

    pub fn find_nearest_poi(&self, position: &Point2D, poi_type: u32) -> Option<&POI> {
        self.city.pois
            .iter()
            .filter(|poi| poi.poi_type == poi_type)
            .min_by_key(|poi| {
                let dx = poi.position.x - position.x;
                let dy = poi.position.y - position.y;
                ((dx * dx + dy * dy) * 1000.0) as u32
            })
    }

    // Hidden extensibility: Query system
    pub fn query_entities_by_component(&self, component_name: &str) -> Vec<&str> {
        self.entities
            .iter()
            .filter(|(_, components)| components.contains_key(component_name))
            .map(|(id, _)| id.as_str())
            .collect()
    }

    pub fn add_poi(&mut self, poi: POI) {
        let index = self.city.pois.len();
        let poi_id = poi.id.clone();
        self.poi_lookup.insert(poi.id.clone(), index);
        self.city.pois.push(poi);
        self.post_event(WorldEvent::POIAdded { poi_id });
    }

    pub fn remove_poi(&mut self, poi_id: &str) {
        if let Some(&index) = self.poi_lookup.get(poi_id) {
            self.city.pois.remove(index);
            self.build_lookups(); // Rebuild lookups after removal
            self.post_event(WorldEvent::POIRemoved { poi_id: poi_id.to_string() });
        }
    }

    // Hidden extensibility: Add systems dynamically
    pub fn add_system(&mut self, system: Box<dyn System>) {
        self.systems.push(system);
    }

    // Hidden extensibility: Resource management
    pub fn add_resource(&mut self, resource_name: String, amount: f32) {
        *self.resources.entry(resource_name).or_insert(0.0) += amount;
    }

    pub fn get_resource(&self, resource_name: &str) -> f32 {
        *self.resources.get(resource_name).unwrap_or(&0.0)
    }

    // Hidden extensibility: Entity system (simplified ECS)
    pub fn add_entity(&mut self, entity_id: String) {
        self.entities.insert(entity_id, HashMap::new());
    }

    pub fn add_component(&mut self, entity_id: &str, component_name: String, value: f32) {
        if let Some(components) = self.entities.get_mut(entity_id) {
            components.insert(component_name, value);
        }
    }

    pub fn get_component(&self, entity_id: &str, component_name: &str) -> Option<f32> {
        self.entities
            .get(entity_id)
            .and_then(|components| components.get(component_name))
            .copied()
    }

    // Hidden extensibility: Save/load system
    pub fn save_state(&self) -> String {
        // In v1.0, just serialize the basic state
        // Future: full save system with mod support
        serde_json::to_string(&self.city).unwrap_or_default()
    }

    pub fn load_state(&mut self, state_data: &str) {
        if let Ok(city_data) = serde_json::from_str::<CityModel>(state_data) {
            self.load_city(city_data);
        }
    }
}

impl WorldContext for World {
    fn get_current_time(&self) -> f32 { self.time }
    fn get_day(&self) -> u32 { self.day }
}

// Hidden extensibility: Example system implementation
#[derive(Debug)]
pub struct PopulationSystem {
    spawn_rate: f32,
    max_population: usize,
}

impl PopulationSystem {
    pub fn new(spawn_rate: f32, max_population: usize) -> Self {
        Self { spawn_rate, max_population }
    }
}

impl System for PopulationSystem {
    fn update(&mut self, world: &mut World, dt: f32) {
        // Example: spawn new agents periodically
        if world.agents.len() < self.max_population {
            // Simplified spawning logic
            if rand::random::<f32>() < self.spawn_rate * dt {
                if let Some(home_poi) = world.city.pois.iter().find(|poi| poi.poi_type == 0) {
                    let agent_id = world.agents.len() as u32;
                    let mut agent = Agent::new(agent_id, home_poi.position.clone());
                    agent.generate_daily_schedule(&mut rand::thread_rng());
                    world.agents.push(agent);
                    world.post_event(WorldEvent::AgentSpawned { agent_id });
                }
            }
        }
    }

    fn handle_event(&mut self, _event: &WorldEvent) {
        // React to world events if needed
    }

    fn name(&self) -> &str { "population" }
    fn priority(&self) -> i32 { 10 } // High priority for population management
}