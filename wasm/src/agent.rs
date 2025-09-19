use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use rand::prelude::*;
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Point2D {
    pub x: f32,
    pub y: f32,
}

impl Point2D {
    pub fn new(x: f32, y: f32) -> Self {
        Self { x, y }
    }

    pub fn distance_to(&self, other: &Point2D) -> f32 {
        let dx = self.x - other.x;
        let dy = self.y - other.y;
        (dx * dx + dy * dy).sqrt()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Agent {
    pub id: u32,
    pub position: Point2D,
    pub destination: Option<String>,
    pub current_poi: Option<String>,
    pub agent_type: AgentType,
    pub schedule: Vec<ScheduleEntry>,
    pub current_schedule_index: usize,
    pub speed: f32,
    pub path: Vec<Point2D>,
    pub path_progress: f32,
    pub needs: AgentNeeds,
    pub state: AgentState,

    // Hidden extensibility: Component-like system for future use
    #[serde(skip)]
    pub behaviors: Vec<Box<dyn Behavior>>,

    // Future extensibility: Custom properties
    pub properties: HashMap<String, f32>,

    // Hidden extensibility: Relationships (dormant in v1.0)
    pub relationships: HashMap<u32, f32>, // agent_id -> relationship_strength
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AgentType {
    Pedestrian,
    Car,
    Bus,
    Truck,
    // Future extensibility: easily add new types
    // Worker, Student, Tourist, Emergency, etc.
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScheduleEntry {
    pub poi_type: u32,
    pub start_time: f32,
    pub duration: f32,
    pub preferred_poi_id: Option<String>,
    pub priority: f32, // Hidden extensibility: priority system
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentNeeds {
    pub work: f32,
    pub food: f32,
    pub shopping: f32,
    pub leisure: f32,
    pub home: f32,

    // Hidden extensibility: easily add new needs
    // pub social: f32,
    // pub health: f32,
    // pub safety: f32,
    // pub education: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AgentState {
    Traveling,
    AtDestination,
    FindingPath,
    Waiting,
    // Hidden extensibility: more complex states
    // Working, Shopping, Socializing, Resting, etc.
}

// Hidden extensibility: Trait-based behavior system
pub trait Behavior: Send + Sync {
    fn update(&mut self, agent: &mut Agent, dt: f32, world_context: &dyn WorldContext);
    fn name(&self) -> &str;
    fn priority(&self) -> f32 { 1.0 }
}

// Hidden extensibility: World context for behaviors
pub trait WorldContext {
    fn get_current_time(&self) -> f32;
    fn get_day(&self) -> u32;
    // Future: weather, events, other agents, etc.
}

// Simple implementation for v1.0
pub struct BasicWorldContext {
    pub time: f32,
    pub day: u32,
}

impl WorldContext for BasicWorldContext {
    fn get_current_time(&self) -> f32 { self.time }
    fn get_day(&self) -> u32 { self.day }
}

impl Agent {
    pub fn new(id: u32, home_position: Point2D) -> Self {
        Self {
            id,
            position: home_position.clone(),
            destination: None,
            current_poi: None,
            agent_type: AgentType::Car,
            schedule: Vec::new(),
            current_schedule_index: 0,
            speed: 5.0,
            path: Vec::new(),
            path_progress: 0.0,
            needs: AgentNeeds {
                work: 0.0,
                food: 0.0,
                shopping: 0.0,
                leisure: 0.0,
                home: 1.0,
            },
            state: AgentState::AtDestination,
            behaviors: Vec::new(),
            properties: HashMap::new(),
            relationships: HashMap::new(),
        }
    }

    // Hidden extensibility: Add behaviors dynamically
    pub fn add_behavior(&mut self, behavior: Box<dyn Behavior>) {
        self.behaviors.push(behavior);
    }

    // Hidden extensibility: Get/set custom properties
    pub fn set_property(&mut self, key: String, value: f32) {
        self.properties.insert(key, value);
    }

    pub fn get_property(&self, key: &str) -> Option<f32> {
        self.properties.get(key).copied()
    }

    pub fn generate_daily_schedule(&mut self, rng: &mut impl Rng) {
        self.schedule.clear();

        // Morning routine: Home -> Work
        self.schedule.push(ScheduleEntry {
            poi_type: 1, // OFFICE
            start_time: 8.0 + rng.gen::<f32>() * 2.0,
            duration: 8.0,
            preferred_poi_id: None,
            priority: 1.0,
        });

        // Lunch break
        if rng.gen::<f32>() < 0.6 {
            self.schedule.push(ScheduleEntry {
                poi_type: 3, // RESTAURANT
                start_time: 12.0 + rng.gen::<f32>() * 2.0,
                duration: 1.0,
                preferred_poi_id: None,
                priority: 0.7,
            });
        }

        // Evening: Work -> Shopping/Leisure -> Home
        if rng.gen::<f32>() < 0.4 {
            self.schedule.push(ScheduleEntry {
                poi_type: 2, // SHOP
                start_time: 17.0 + rng.gen::<f32>() * 2.0,
                duration: 1.5,
                preferred_poi_id: None,
                priority: 0.5,
            });
        }

        if rng.gen::<f32>() < 0.3 {
            self.schedule.push(ScheduleEntry {
                poi_type: 6, // PARK_POI
                start_time: 19.0 + rng.gen::<f32>() * 2.0,
                duration: 2.0,
                preferred_poi_id: None,
                priority: 0.4,
            });
        }

        // Return home
        self.schedule.push(ScheduleEntry {
            poi_type: 0, // HOME
            start_time: 21.0 + rng.gen::<f32>() * 2.0,
            duration: 10.0,
            preferred_poi_id: None,
            priority: 0.9,
        });

        // Hidden extensibility: Sort by priority for complex scheduling
        self.schedule.sort_by(|a, b| b.priority.partial_cmp(&a.priority).unwrap_or(std::cmp::Ordering::Equal));
    }

    pub fn update(&mut self, dt: f32, current_time: f32, world_context: &dyn WorldContext) {
        // Update behaviors first (extensibility hook)
        for behavior in &mut self.behaviors {
            behavior.update(self, dt, world_context);
        }

        // Basic update logic for v1.0
        self.update_needs(dt);
        self.update_schedule(current_time);
        self.update_movement(dt);
    }

    fn update_needs(&mut self, dt: f32) {
        // Needs decay over time
        self.needs.work = (self.needs.work - dt * 0.1).max(0.0);
        self.needs.food = (self.needs.food - dt * 0.15).max(0.0);
        self.needs.shopping = (self.needs.shopping - dt * 0.05).max(0.0);
        self.needs.leisure = (self.needs.leisure - dt * 0.08).max(0.0);
        self.needs.home = (self.needs.home - dt * 0.12).max(0.0);
    }

    fn update_schedule(&mut self, current_time: f32) {
        if self.current_schedule_index < self.schedule.len() {
            let current_entry = &self.schedule[self.current_schedule_index];
            if current_time >= current_entry.start_time {
                // Time to move to the next scheduled activity
                self.state = AgentState::FindingPath;
            }
        }
    }

    fn update_movement(&mut self, dt: f32) {
        match self.state {
            AgentState::Traveling => {
                if !self.path.is_empty() {
                    self.path_progress += self.speed * dt;
                    if self.path_progress >= 1.0 {
                        // Move to next path segment
                        self.path.remove(0);
                        self.path_progress = 0.0;
                        if self.path.is_empty() {
                            self.state = AgentState::AtDestination;
                            self.current_schedule_index += 1;
                        }
                    } else {
                        // Interpolate position along current path segment
                        if self.path.len() > 1 {
                            let start = &self.path[0];
                            let end = &self.path[1];
                            self.position.x = start.x + (end.x - start.x) * self.path_progress;
                            self.position.y = start.y + (end.y - start.y) * self.path_progress;
                        }
                    }
                }
            }
            _ => {}
        }
    }

    // Hidden extensibility: Social interactions
    pub fn interact_with(&mut self, other_agent_id: u32, interaction_strength: f32) {
        let current_relationship = self.relationships.get(&other_agent_id).unwrap_or(&0.0);
        self.relationships.insert(other_agent_id, (current_relationship + interaction_strength).clamp(-1.0, 1.0));
    }

    // Hidden extensibility: Get most urgent need
    pub fn get_most_urgent_need(&self) -> (String, f32) {
        let needs = vec![
            ("work".to_string(), self.needs.work),
            ("food".to_string(), self.needs.food),
            ("shopping".to_string(), self.needs.shopping),
            ("leisure".to_string(), self.needs.leisure),
            ("home".to_string(), self.needs.home),
        ];

        needs.into_iter()
            .min_by(|a, b| a.1.partial_cmp(&b.1).unwrap_or(std::cmp::Ordering::Equal))
            .unwrap_or(("home".to_string(), 1.0))
    }
}

// Hidden extensibility: Example behavior implementations for future use
#[derive(Debug)]
pub struct WanderBehavior {
    pub radius: f32,
    pub center: Point2D,
}

impl Behavior for WanderBehavior {
    fn update(&mut self, agent: &mut Agent, _dt: f32, _world_context: &dyn WorldContext) {
        // Simple wandering behavior - could be expanded
        if agent.path.is_empty() && matches!(agent.state, AgentState::AtDestination) {
            // Generate a random point within radius
            let mut rng = rand::thread_rng();
            let angle = rng.gen::<f32>() * 2.0 * std::f32::consts::PI;
            let distance = rng.gen::<f32>() * self.radius;

            let new_x = self.center.x + angle.cos() * distance;
            let new_y = self.center.y + angle.sin() * distance;

            agent.path = vec![agent.position.clone(), Point2D::new(new_x, new_y)];
            agent.state = AgentState::Traveling;
        }
    }

    fn name(&self) -> &str { "wander" }
}