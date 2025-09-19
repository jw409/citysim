use serde::{Deserialize, Serialize};
use rand::prelude::*;

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
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Point2D {
    pub x: f32,
    pub y: f32,
}

impl Point2D {
    pub fn new(x: f32, y: f32) -> Self {
        Self { x, y }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AgentType {
    Pedestrian,
    Car,
    Bus,
    Truck,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScheduleEntry {
    pub poi_type: u32,
    pub start_time: f32,
    pub duration: f32,
    pub preferred_poi_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentNeeds {
    pub work: f32,
    pub food: f32,
    pub shopping: f32,
    pub leisure: f32,
    pub home: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AgentState {
    Traveling,
    AtDestination,
    FindingPath,
    Waiting,
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
        }
    }

    pub fn generate_daily_schedule(&mut self, rng: &mut impl Rng) {
        self.schedule.clear();

        // Morning routine: Home -> Work
        self.schedule.push(ScheduleEntry {
            poi_type: 1, // OFFICE
            start_time: 8.0 + rng.gen::<f32>() * 2.0,
            duration: 8.0,
            preferred_poi_id: None,
        });

        // Lunch break
        if rng.gen::<f32>() < 0.6 {
            self.schedule.push(ScheduleEntry {
                poi_type: 3, // RESTAURANT
                start_time: 12.0 + rng.gen::<f32>() * 2.0,
                duration: 1.0,
                preferred_poi_id: None,
            });
        }

        // Evening: Work -> Shopping/Leisure -> Home
        if rng.gen::<f32>() < 0.4 {
            self.schedule.push(ScheduleEntry {
                poi_type: 2, // SHOP
                start_time: 17.0 + rng.gen::<f32>() * 2.0,
                duration: 1.5,
                preferred_poi_id: None,
            });
        }

        if rng.gen::<f32>() < 0.3 {
            self.schedule.push(ScheduleEntry {
                poi_type: 6, // PARK_POI
                start_time: 19.0 + rng.gen::<f32>() * 2.0,
                duration: 2.0,
                preferred_poi_id: None,
            });
        }

        // Return home
        self.schedule.push(ScheduleEntry {
            poi_type: 0, // HOME
            start_time: 21.0 + rng.gen::<f32>() * 2.0,
            duration: 10.0,
            preferred_poi_id: None,
        });
    }

    pub fn update(&mut self, dt: f32, current_time: f32) {
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
}