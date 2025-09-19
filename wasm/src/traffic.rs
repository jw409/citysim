use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use crate::agent::{Agent, Point2D};
use crate::world::{Road, System, WorldEvent, World};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrafficData {
    pub road_densities: HashMap<String, f32>,
    pub poi_popularity: HashMap<String, u32>,
    pub flow_matrix: Vec<TrafficFlow>,
    pub congestion_points: Vec<CongestionPoint>,

    // Hidden extensibility: Advanced analytics
    pub average_travel_time: f32,
    pub total_distance_traveled: f32,
    pub peak_hours: Vec<f32>, // Hours with highest traffic
    pub bottleneck_roads: Vec<String>,

    // Hidden extensibility: Economic data (dormant in v1.0)
    pub estimated_fuel_consumption: f32,
    pub estimated_emissions: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrafficFlow {
    pub from_poi: String,
    pub to_poi: String,
    pub flow_count: u32,
    pub average_travel_time: f32, // Hidden extensibility
    pub preferred_routes: Vec<String>, // Road IDs
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CongestionPoint {
    pub position: Point2D,
    pub severity: f32,
    pub road_id: String,
    pub duration: f32, // How long has this been congested
    pub affected_agents: u32, // Number of agents affected
}

// Hidden extensibility: Traffic analysis as a pluggable system
#[derive(Debug)]
pub struct TrafficAnalysisSystem {
    enabled: bool,
    analysis_frequency: f32, // How often to update analysis (in sim time)
    last_analysis: f32,

    // Data collection
    agent_paths: HashMap<u32, Vec<Point2D>>, // agent_id -> path history
    travel_times: HashMap<String, Vec<f32>>, // route_id -> travel times
    hourly_traffic: HashMap<u32, u32>, // hour -> agent count

    // Hidden extensibility: Configurable parameters
    congestion_threshold: f32,
    sample_window: f32, // Time window for analysis
    max_history_size: usize,
}

impl TrafficAnalysisSystem {
    pub fn new() -> Self {
        Self {
            enabled: true,
            analysis_frequency: 1.0, // Analyze every simulation hour
            last_analysis: 0.0,
            agent_paths: HashMap::new(),
            travel_times: HashMap::new(),
            hourly_traffic: HashMap::new(),
            congestion_threshold: 0.8,
            sample_window: 5.0, // 5 hour window
            max_history_size: 1000,
        }
    }

    pub fn configure(&mut self, config: &HashMap<String, f32>) {
        self.enabled = config.get("enabled").unwrap_or(&1.0) > 0.0;
        self.analysis_frequency = config.get("analysis_frequency").unwrap_or(&1.0);
        self.congestion_threshold = config.get("congestion_threshold").unwrap_or(&0.8);
        self.sample_window = config.get("sample_window").unwrap_or(&5.0);
    }

    // Collect agent movement data
    fn collect_agent_data(&mut self, agents: &[Agent], current_time: f32) {
        let current_hour = current_time as u32;

        // Update hourly traffic count
        *self.hourly_traffic.entry(current_hour).or_insert(0) += agents.len() as u32;

        // Track agent paths
        for agent in agents {
            let path_history = self.agent_paths.entry(agent.id).or_insert_with(Vec::new);

            // Add current position to path history
            path_history.push(agent.position.clone());

            // Limit history size for memory management
            if path_history.len() > self.max_history_size {
                path_history.remove(0);
            }
        }
    }

    // Analyze traffic patterns
    fn analyze_patterns(&self, world: &World) -> TrafficData {
        let mut road_densities = HashMap::new();
        let mut poi_popularity = HashMap::new();
        let mut congestion_points = Vec::new();
        let mut flow_matrix = Vec::new();

        // Analyze road densities and congestion
        for road in &world.city.roads {
            let density = self.calculate_road_density(&world.agents, road);
            road_densities.insert(road.id.clone(), density);

            // Identify congestion points
            if density > self.congestion_threshold {
                let midpoint_index = road.path.len() / 2;
                if let Some(midpoint) = road.path.get(midpoint_index) {
                    let affected_agents = world.agents.iter()
                        .filter(|agent| Self::is_agent_on_road(agent, road))
                        .count() as u32;

                    congestion_points.push(CongestionPoint {
                        position: midpoint.clone(),
                        severity: density,
                        road_id: road.id.clone(),
                        duration: 1.0, // Simplified for v1.0
                        affected_agents,
                    });
                }
            }
        }

        // Analyze POI popularity
        for agent in &world.agents {
            if let Some(current_poi) = &agent.current_poi {
                *poi_popularity.entry(current_poi.clone()).or_insert(0) += 1;
            }
        }

        // Build flow matrix (simplified for v1.0)
        flow_matrix = self.build_flow_matrix(world);

        // Calculate advanced metrics
        let average_travel_time = self.calculate_average_travel_time();
        let total_distance_traveled = self.calculate_total_distance_traveled();
        let peak_hours = self.identify_peak_hours();
        let bottleneck_roads = self.identify_bottleneck_roads(&road_densities);

        TrafficData {
            road_densities,
            poi_popularity,
            flow_matrix,
            congestion_points,
            average_travel_time,
            total_distance_traveled,
            peak_hours,
            bottleneck_roads,
            estimated_fuel_consumption: self.estimate_fuel_consumption(&world.agents),
            estimated_emissions: self.estimate_emissions(&world.agents),
        }
    }

    fn calculate_road_density(&self, agents: &[Agent], road: &Road) -> f32 {
        let agents_on_road = agents.iter()
            .filter(|agent| Self::is_agent_on_road(agent, road))
            .count() as f32;

        agents_on_road / road.lanes as f32
    }

    fn build_flow_matrix(&self, world: &World) -> Vec<TrafficFlow> {
        let mut flows = HashMap::new();

        // Analyze agent paths to build origin-destination matrix
        for agent in &world.agents {
            if let Some(path_history) = self.agent_paths.get(&agent.id) {
                if path_history.len() >= 2 {
                    // Simplified: use current and previous positions
                    let from_poi = self.find_nearest_poi_to_position(world, &path_history[path_history.len() - 2]);
                    let to_poi = self.find_nearest_poi_to_position(world, &path_history[path_history.len() - 1]);

                    if let (Some(from), Some(to)) = (from_poi, to_poi) {
                        let key = format!("{}_{}", from, to);
                        let flow = flows.entry(key).or_insert(TrafficFlow {
                            from_poi: from.clone(),
                            to_poi: to.clone(),
                            flow_count: 0,
                            average_travel_time: 0.0,
                            preferred_routes: Vec::new(),
                        });
                        flow.flow_count += 1;
                    }
                }
            }
        }

        flows.into_values().collect()
    }

    fn find_nearest_poi_to_position(&self, world: &World, position: &Point2D) -> Option<String> {
        world.city.pois
            .iter()
            .min_by_key(|poi| (position.distance_to(&poi.position) * 1000.0) as u32)
            .map(|poi| poi.id.clone())
    }

    fn calculate_average_travel_time(&self) -> f32 {
        let all_times: Vec<f32> = self.travel_times.values().flatten().copied().collect();
        if all_times.is_empty() {
            0.0
        } else {
            all_times.iter().sum::<f32>() / all_times.len() as f32
        }
    }

    fn calculate_total_distance_traveled(&self) -> f32 {
        self.agent_paths.values()
            .map(|path| {
                path.windows(2)
                    .map(|window| window[0].distance_to(&window[1]))
                    .sum::<f32>()
            })
            .sum()
    }

    fn identify_peak_hours(&self) -> Vec<f32> {
        let mut hour_counts: Vec<(u32, u32)> = self.hourly_traffic.iter()
            .map(|(&hour, &count)| (hour, count))
            .collect();

        hour_counts.sort_by_key(|&(_, count)| std::cmp::Reverse(count));

        // Return top 3 peak hours
        hour_counts.into_iter()
            .take(3)
            .map(|(hour, _)| hour as f32)
            .collect()
    }

    fn identify_bottleneck_roads(&self, road_densities: &HashMap<String, f32>) -> Vec<String> {
        let mut roads: Vec<(String, f32)> = road_densities.iter()
            .map(|(id, &density)| (id.clone(), density))
            .collect();

        roads.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));

        // Return roads with density > threshold
        roads.into_iter()
            .filter(|(_, density)| *density > self.congestion_threshold)
            .map(|(id, _)| id)
            .collect()
    }

    // Hidden extensibility: Environmental impact calculation
    fn estimate_fuel_consumption(&self, agents: &[Agent]) -> f32 {
        // Simplified calculation based on agent movement
        agents.iter()
            .filter(|agent| matches!(agent.agent_type, crate::agent::AgentType::Car))
            .map(|agent| {
                let distance = if agent.path.len() >= 2 {
                    agent.path[0].distance_to(&agent.path[1])
                } else {
                    0.0
                };
                distance * 0.1 // Simplified fuel consumption rate
            })
            .sum()
    }

    fn estimate_emissions(&self, agents: &[Agent]) -> f32 {
        // Emissions roughly proportional to fuel consumption
        self.estimate_fuel_consumption(agents) * 2.3 // kg CO2 per liter
    }

    fn is_agent_on_road(agent: &Agent, road: &Road) -> bool {
        const ROAD_PROXIMITY_THRESHOLD: f32 = 20.0;

        road.path.windows(2).any(|segment| {
            if let [start, end] = segment {
                Self::point_to_line_distance(&agent.position, start, end) < ROAD_PROXIMITY_THRESHOLD
            } else {
                false
            }
        })
    }

    fn point_to_line_distance(point: &Point2D, line_start: &Point2D, line_end: &Point2D) -> f32 {
        let dx = line_end.x - line_start.x;
        let dy = line_end.y - line_start.y;

        if dx == 0.0 && dy == 0.0 {
            // Line is actually a point
            return point.distance_to(line_start);
        }

        let t = ((point.x - line_start.x) * dx + (point.y - line_start.y) * dy) / (dx * dx + dy * dy);
        let t = t.max(0.0).min(1.0);

        let closest_x = line_start.x + t * dx;
        let closest_y = line_start.y + t * dy;
        let closest_point = Point2D::new(closest_x, closest_y);

        point.distance_to(&closest_point)
    }
}

impl System for TrafficAnalysisSystem {
    fn update(&mut self, world: &mut World, dt: f32) {
        if !self.enabled { return; }

        // Collect data continuously
        self.collect_agent_data(&world.agents, world.time);

        // Perform analysis at specified frequency
        if world.time - self.last_analysis >= self.analysis_frequency {
            let traffic_data = self.analyze_patterns(world);

            // Store analysis results in world for retrieval
            // (In a more complex system, this might trigger events)

            self.last_analysis = world.time;
        }
    }

    fn handle_event(&mut self, event: &WorldEvent) {
        match event {
            WorldEvent::AgentSpawned { agent_id } => {
                // Initialize tracking for new agent
                self.agent_paths.insert(*agent_id, Vec::new());
            }
            WorldEvent::AgentDestroyed { agent_id } => {
                // Clean up tracking data
                self.agent_paths.remove(agent_id);
            }
            WorldEvent::TrafficJam { road_id, severity } => {
                // React to traffic jam events
                web_sys::console::log_1(&format!("Traffic jam detected on {}: severity {}", road_id, severity).into());
            }
            _ => {}
        }
    }

    fn name(&self) -> &str { "traffic_analysis" }
    fn priority(&self) -> i32 { 5 } // Medium priority
}

// Public interface for creating traffic analysis
impl TrafficData {
    pub fn from_agents(agents: &[Agent], roads: &[Road]) -> Self {
        // Simplified analysis for direct API calls
        let mut system = TrafficAnalysisSystem::new();

        // Create a minimal world for analysis
        let mut temp_world = World::new();
        temp_world.agents = agents.to_vec();
        temp_world.city.roads = roads.to_vec();

        system.analyze_patterns(&temp_world)
    }

    // Hidden extensibility: Export data in different formats
    pub fn to_csv(&self) -> String {
        let mut csv = String::from("road_id,density\n");
        for (road_id, density) in &self.road_densities {
            csv.push_str(&format!("{},{}\n", road_id, density));
        }
        csv
    }

    pub fn to_geojson(&self) -> String {
        // Simplified GeoJSON export for mapping tools
        let mut features = Vec::new();

        for congestion in &self.congestion_points {
            features.push(format!(
                r#"{{"type":"Feature","geometry":{{"type":"Point","coordinates":[{},{}]}},"properties":{{"severity":{},"road_id":"{}"}}}}"#,
                congestion.position.x, congestion.position.y, congestion.severity, congestion.road_id
            ));
        }

        format!(
            r#"{{"type":"FeatureCollection","features":[{}]}}"#,
            features.join(",")
        )
    }
}