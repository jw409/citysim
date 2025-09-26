use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use crate::agent::{Agent, Point2D};
use rand::SeedableRng;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CityModel {
    pub zones: Vec<Zone>,
    pub roads: Vec<Road>,
    pub pois: Vec<POI>,
    pub buildings: Vec<Building>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Zone {
    pub id: String,
    pub zone_type: u32,
    pub boundary: Vec<Point2D>,
    pub density: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Road {
    pub id: String,
    pub road_type: u32,
    pub path: Vec<Point2D>,
    pub width: f32,
    pub lanes: u32,
    pub speed_limit: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct POI {
    pub id: String,
    pub poi_type: u32,
    pub position: Point2D,
    pub zone_id: String,
    pub capacity: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Building {
    pub id: String,
    pub footprint: Vec<Point2D>,
    pub height: f32,
    pub zone_id: String,
    pub building_type: u32,
}

pub struct World {
    pub city: CityModel,
    pub agents: Vec<Agent>,
    pub time: f32,
    pub day: u32,
    pub poi_lookup: HashMap<String, usize>,
    pub zone_lookup: HashMap<String, usize>,
}

impl World {
    pub fn new() -> Self {
        Self {
            city: CityModel {
                zones: Vec::new(),
                roads: Vec::new(),
                pois: Vec::new(),
                buildings: Vec::new(),
            },
            agents: Vec::new(),
            time: 0.0,
            day: 0,
            poi_lookup: HashMap::new(),
            zone_lookup: HashMap::new(),
        }
    }

    #[allow(dead_code)]
    pub fn load_city(&mut self, city_data: CityModel) {
        self.city = city_data;
        self.build_lookups();
        self.spawn_agents();
    }

    pub fn load_city_with_seed(&mut self, city_data: CityModel, seed: u64) {
        self.city = city_data;
        self.build_lookups();
        self.spawn_agents_with_seed(seed);
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
    }

    #[allow(dead_code)]
    fn spawn_agents(&mut self) {
        let mut agent_id = 0;

        // Spawn agents at residential POIs
        let pois = self.city.pois.clone(); // Clone to avoid borrow checker issues
        for poi in pois {
            if poi.poi_type == 0 { // HOME
                let num_agents = (poi.capacity as f32 * 0.3) as u32; // 30% occupancy
                for _ in 0..num_agents {
                    let mut agent = Agent::new(agent_id, poi.position.clone());
                    agent.generate_daily_schedule(&mut rand::thread_rng());
                    self.agents.push(agent);
                    agent_id += 1;
                }
            }
        }
    }

    fn spawn_agents_with_seed(&mut self, seed: u64) {
        let mut rng = rand_chacha::ChaCha8Rng::seed_from_u64(seed);
        let mut agent_id = 0;

        // Spawn agents at residential POIs
        let pois = self.city.pois.clone(); // Clone to avoid borrow checker issues
        for poi in pois {
            if poi.poi_type == 0 { // HOME
                let num_agents = (poi.capacity as f32 * 0.3) as u32; // 30% occupancy
                for _ in 0..num_agents {
                    let mut agent = Agent::new(agent_id, poi.position.clone());
                    agent.generate_daily_schedule(&mut rng);
                    self.agents.push(agent);
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

        // Update all agents
        for agent in &mut self.agents {
            agent.update(dt, self.time);
        }
    }

    fn regenerate_schedules(&mut self) {
        for agent in &mut self.agents {
            agent.generate_daily_schedule(&mut rand::thread_rng());
            agent.current_schedule_index = 0;
        }
    }

    #[allow(dead_code)]
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

    #[allow(dead_code)]
    pub fn add_poi(&mut self, poi: POI) {
        let index = self.city.pois.len();
        self.poi_lookup.insert(poi.id.clone(), index);
        self.city.pois.push(poi);
    }

    #[allow(dead_code)]
    pub fn remove_poi(&mut self, poi_id: &str) {
        if let Some(&index) = self.poi_lookup.get(poi_id) {
            self.city.pois.remove(index);
            self.build_lookups(); // Rebuild lookups after removal
        }
    }
}