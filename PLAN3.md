---
id: PLAN3
title: "WASM Simulation Core (Rust)"
dependencies: ["PLAN1", "PLAN2"]
status: pending
artifacts:
  - "wasm/Cargo.toml"
  - "wasm/src/lib.rs"
  - "wasm/src/agent.rs"
  - "wasm/src/world.rs"
  - "wasm/src/simulation.rs"
  - "wasm/src/traffic.rs"
  - "wasm/src/pathfinding.rs"
  - "src/wasm/urbansynth_sim.js"
  - "src/wasm/urbansynth_sim_bg.wasm"
  - "src/types/simulation.ts"
---

### Objective
Implement a high-performance agent-based city simulation engine in Rust, compiled to WebAssembly, with a clean JavaScript interface for the frontend to control and query the simulation state.

### Task Breakdown

1. **Update Cargo.toml** with simulation dependencies:
   ```toml
   [package]
   name = "urbansynth-sim"
   version = "0.1.0"
   edition = "2021"

   [lib]
   crate-type = ["cdylib"]

   [dependencies]
   wasm-bindgen = "0.2"
   js-sys = "0.3"
   web-sys = "0.3"
   serde = { version = "1.0", features = ["derive"] }
   serde-wasm-bindgen = "0.6"
   console_error_panic_hook = "0.1"
   wee_alloc = "0.4"
   rand = { version = "0.8", features = ["small_rng"] }
   rand_chacha = "0.3"

   [dependencies.web-sys]
   version = "0.3"
   features = [
     "console",
     "Performance",
   ]

   [profile.release]
   opt-level = 3
   lto = true
   codegen-units = 1
   panic = "abort"
   ```

2. **Create core data structures** (wasm/src/agent.rs):
   ```rust
   use wasm_bindgen::prelude::*;
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
   ```

3. **Create world management** (wasm/src/world.rs):
   ```rust
   use wasm_bindgen::prelude::*;
   use serde::{Deserialize, Serialize};
   use std::collections::HashMap;
   use crate::agent::{Agent, Point2D};

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

       pub fn load_city(&mut self, city_data: CityModel) {
           self.city = city_data;
           self.build_lookups();
           self.spawn_agents();
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

       fn spawn_agents(&mut self) {
           let mut agent_id = 0;

           // Spawn agents at residential POIs
           for poi in &self.city.pois {
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

       pub fn add_poi(&mut self, poi: POI) {
           let index = self.city.pois.len();
           self.poi_lookup.insert(poi.id.clone(), index);
           self.city.pois.push(poi);
       }

       pub fn remove_poi(&mut self, poi_id: &str) {
           if let Some(&index) = self.poi_lookup.get(poi_id) {
               self.city.pois.remove(index);
               self.build_lookups(); // Rebuild lookups after removal
           }
       }
   }
   ```

4. **Create simulation engine** (wasm/src/simulation.rs):
   ```rust
   use wasm_bindgen::prelude::*;
   use crate::world::{World, CityModel};
   use crate::traffic::TrafficData;

   pub struct Simulation {
       pub world: World,
       pub running: bool,
       pub speed_multiplier: f32,
   }

   impl Simulation {
       pub fn new() -> Self {
           Self {
               world: World::new(),
               running: false,
               speed_multiplier: 1.0,
           }
       }

       pub fn init(&mut self, city_data: CityModel) {
           self.world.load_city(city_data);
           self.running = false;
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
       }

       pub fn get_agent_states(&self) -> Vec<&crate::agent::Agent> {
           self.world.agents.iter().collect()
       }

       pub fn get_traffic_data(&self) -> TrafficData {
           TrafficData::from_agents(&self.world.agents, &self.world.city.roads)
       }

       pub fn update_world(&mut self, event: WorldUpdateEvent) {
           match event.event_type.as_str() {
               "add_poi" => {
                   if let Some(poi_data) = event.data {
                       // Parse POI data and add to world
                       // Implementation depends on the exact format
                   }
               }
               "remove_poi" => {
                   if let Some(poi_id) = event.poi_id {
                       self.world.remove_poi(&poi_id);
                   }
               }
               _ => {}
           }
       }
   }

   #[derive(Debug, Clone)]
   pub struct WorldUpdateEvent {
       pub event_type: String,
       pub poi_id: Option<String>,
       pub data: Option<String>,
   }
   ```

5. **Create traffic analysis** (wasm/src/traffic.rs):
   ```rust
   use wasm_bindgen::prelude::*;
   use serde::{Deserialize, Serialize};
   use std::collections::HashMap;
   use crate::agent::{Agent, Point2D};
   use crate::world::Road;

   #[derive(Debug, Clone, Serialize, Deserialize)]
   pub struct TrafficData {
       pub road_densities: HashMap<String, f32>,
       pub poi_popularity: HashMap<String, u32>,
       pub flow_matrix: Vec<TrafficFlow>,
       pub congestion_points: Vec<CongestionPoint>,
   }

   #[derive(Debug, Clone, Serialize, Deserialize)]
   pub struct TrafficFlow {
       pub from_poi: String,
       pub to_poi: String,
       pub flow_count: u32,
   }

   #[derive(Debug, Clone, Serialize, Deserialize)]
   pub struct CongestionPoint {
       pub position: Point2D,
       pub severity: f32,
       pub road_id: String,
   }

   impl TrafficData {
       pub fn from_agents(agents: &[Agent], roads: &[Road]) -> Self {
           let mut road_densities = HashMap::new();
           let mut poi_popularity = HashMap::new();
           let mut flow_matrix = Vec::new();
           let mut congestion_points = Vec::new();

           // Analyze agent positions relative to roads
           for road in roads {
               let density = agents.iter()
                   .filter(|agent| Self::is_agent_on_road(agent, road))
                   .count() as f32 / road.lanes as f32;

               road_densities.insert(road.id.clone(), density);

               // Identify congestion points
               if density > 0.8 {
                   let midpoint_index = road.path.len() / 2;
                   if let Some(midpoint) = road.path.get(midpoint_index) {
                       congestion_points.push(CongestionPoint {
                           position: midpoint.clone(),
                           severity: density,
                           road_id: road.id.clone(),
                       });
                   }
               }
           }

           // Analyze POI popularity
           for agent in agents {
               if let Some(current_poi) = &agent.current_poi {
                   *poi_popularity.entry(current_poi.clone()).or_insert(0) += 1;
               }
           }

           // TODO: Build flow matrix by tracking agent movements

           Self {
               road_densities,
               poi_popularity,
               flow_matrix,
               congestion_points,
           }
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
               let dx = point.x - line_start.x;
               let dy = point.y - line_start.y;
               return (dx * dx + dy * dy).sqrt();
           }

           let t = ((point.x - line_start.x) * dx + (point.y - line_start.y) * dy) / (dx * dx + dy * dy);
           let t = t.max(0.0).min(1.0);

           let closest_x = line_start.x + t * dx;
           let closest_y = line_start.y + t * dy;

           let dx = point.x - closest_x;
           let dy = point.y - closest_y;
           (dx * dx + dy * dy).sqrt()
       }
   }
   ```

6. **Create pathfinding** (wasm/src/pathfinding.rs):
   ```rust
   use crate::agent::Point2D;
   use crate::world::{Road, POI};
   use std::collections::{HashMap, BinaryHeap};
   use std::cmp::Ordering;

   #[derive(Copy, Clone, PartialEq)]
   struct State {
       cost: f32,
       position: usize,
   }

   impl Eq for State {}

   impl Ord for State {
       fn cmp(&self, other: &Self) -> Ordering {
           other.cost.partial_cmp(&self.cost).unwrap_or(Ordering::Equal)
       }
   }

   impl PartialOrd for State {
       fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
           Some(self.cmp(other))
       }
   }

   pub struct PathFinder {
       road_graph: HashMap<usize, Vec<(usize, f32)>>,
       road_nodes: Vec<Point2D>,
   }

   impl PathFinder {
       pub fn new(roads: &[Road]) -> Self {
           let mut road_graph = HashMap::new();
           let mut road_nodes = Vec::new();

           // Build simplified road network
           for road in roads {
               for point in &road.path {
                   road_nodes.push(point.clone());
               }
           }

           // Connect adjacent road nodes
           for (i, _) in road_nodes.iter().enumerate() {
               let mut neighbors = Vec::new();
               for (j, _) in road_nodes.iter().enumerate() {
                   if i != j {
                       let dist = Self::distance(&road_nodes[i], &road_nodes[j]);
                       if dist < 200.0 { // Connect nearby nodes
                           neighbors.push((j, dist));
                       }
                   }
               }
               road_graph.insert(i, neighbors);
           }

           Self {
               road_graph,
               road_nodes,
           }
       }

       pub fn find_path(&self, start: &Point2D, end: &Point2D) -> Vec<Point2D> {
           let start_node = self.find_nearest_node(start);
           let end_node = self.find_nearest_node(end);

           if let Some(path_nodes) = self.dijkstra(start_node, end_node) {
               let mut path = vec![start.clone()];
               for &node_index in &path_nodes {
                   path.push(self.road_nodes[node_index].clone());
               }
               path.push(end.clone());
               path
           } else {
               vec![start.clone(), end.clone()]
           }
       }

       fn find_nearest_node(&self, point: &Point2D) -> usize {
           self.road_nodes
               .iter()
               .enumerate()
               .min_by_key(|(_, node)| (Self::distance(point, node) * 1000.0) as u32)
               .map(|(i, _)| i)
               .unwrap_or(0)
       }

       fn dijkstra(&self, start: usize, goal: usize) -> Option<Vec<usize>> {
           let mut dist = vec![f32::INFINITY; self.road_nodes.len()];
           let mut prev = vec![None; self.road_nodes.len()];
           let mut heap = BinaryHeap::new();

           dist[start] = 0.0;
           heap.push(State { cost: 0.0, position: start });

           while let Some(State { cost, position }) = heap.pop() {
               if position == goal {
                   let mut path = Vec::new();
                   let mut current = goal;
                   while let Some(p) = prev[current] {
                       path.push(current);
                       current = p;
                   }
                   path.reverse();
                   return Some(path);
               }

               if cost > dist[position] {
                   continue;
               }

               if let Some(neighbors) = self.road_graph.get(&position) {
                   for &(neighbor, edge_cost) in neighbors {
                       let next = State {
                           cost: cost + edge_cost,
                           position: neighbor,
                       };

                       if next.cost < dist[neighbor] {
                           heap.push(next);
                           dist[neighbor] = next.cost;
                           prev[neighbor] = Some(position);
                       }
                   }
               }
           }

           None
       }

       fn distance(a: &Point2D, b: &Point2D) -> f32 {
           let dx = a.x - b.x;
           let dy = a.y - b.y;
           (dx * dx + dy * dy).sqrt()
       }
   }
   ```

7. **Create main WASM interface** (wasm/src/lib.rs):
   ```rust
   mod agent;
   mod world;
   mod simulation;
   mod traffic;
   mod pathfinding;

   use wasm_bindgen::prelude::*;
   use serde_wasm_bindgen::to_value;
   use std::cell::RefCell;
   use std::rc::Rc;

   use simulation::{Simulation, WorldUpdateEvent};
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
   pub fn init(city_model_buffer: &[u8], config: &JsValue) -> Result<(), JsValue> {
       // Parse city model from protobuf buffer
       // This would require adding protobuf parsing to Rust
       // For now, we'll assume JSON for simplicity
       let city_data: CityModel = serde_wasm_bindgen::from_value(config.clone())?;

       SIMULATION.with(|sim| {
           let mut simulation = Simulation::new();
           simulation.init(city_data);
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
   pub fn updateWorld(event: &JsValue) -> Result<(), JsValue> {
       let update_event: WorldUpdateEvent = serde_wasm_bindgen::from_value(event.clone())?;

       SIMULATION.with(|sim| {
           if let Some(ref mut simulation) = *sim.borrow_mut() {
               simulation.update_world(update_event);
           }
       });

       Ok(())
   }

   #[wasm_bindgen]
   pub fn destroy() {
       SIMULATION.with(|sim| {
           *sim.borrow_mut() = None;
       });
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
   ```

8. **Create TypeScript definitions** (src/types/simulation.ts):
   ```typescript
   export interface Point2D {
     x: number;
     y: number;
   }

   export interface Agent {
     id: number;
     position: Point2D;
     destination?: string;
     current_poi?: string;
     agent_type: 'Pedestrian' | 'Car' | 'Bus' | 'Truck';
     state: 'Traveling' | 'AtDestination' | 'FindingPath' | 'Waiting';
   }

   export interface TrafficData {
     road_densities: Record<string, number>;
     poi_popularity: Record<string, number>;
     flow_matrix: Array<{
       from_poi: string;
       to_poi: string;
       flow_count: number;
     }>;
     congestion_points: Array<{
       position: Point2D;
       severity: number;
       road_id: string;
     }>;
   }

   export interface WorldUpdateEvent {
     event_type: string;
     poi_id?: string;
     data?: string;
   }

   export interface SimulationConfig {
     zones: Array<any>;
     roads: Array<any>;
     pois: Array<any>;
     buildings: Array<any>;
   }
   ```

9. **Update build scripts in package.json**:
   ```json
   {
     "scripts": {
       "build:wasm": "cd wasm && wasm-pack build --target web --out-dir ../src/wasm --dev",
       "build:wasm:release": "cd wasm && wasm-pack build --target web --out-dir ../src/wasm"
     }
   }
   ```

### Acceptance Criteria
- [ ] All Rust source files exist in wasm/src/ directory
- [ ] Cargo.toml contains all necessary dependencies
- [ ] Rust project compiles without errors
- [ ] WASM module builds successfully with wasm-pack
- [ ] Generated WASM files exist in src/wasm/
- [ ] All required JavaScript interface functions are exported
- [ ] TypeScript definitions are complete and accurate
- [ ] Simple agents can be created and move around the city
- [ ] Traffic data can be generated from agent states

### Test Plan
Execute from project root directory:

```bash
#!/bin/bash
set -e

echo "🧪 Testing PLAN3: WASM Simulation Core"

# Test 1: Verify Rust source files
echo "🦀 Testing Rust source files..."
required_files=("wasm/src/lib.rs" "wasm/src/agent.rs" "wasm/src/world.rs" "wasm/src/simulation.rs" "wasm/src/traffic.rs" "wasm/src/pathfinding.rs")
for file in "${required_files[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ Required file $file not found"
    exit 1
  fi
done
echo "✅ All Rust source files present"

# Test 2: Check Cargo.toml
echo "📦 Testing Cargo.toml..."
if [ ! -f "wasm/Cargo.toml" ]; then
  echo "❌ Cargo.toml not found"
  exit 1
fi
echo "✅ Cargo.toml exists"

# Test 3: Rust compilation
echo "🔨 Testing Rust compilation..."
cd wasm && cargo check > /dev/null 2>&1 || {
  echo "❌ Rust compilation failed"
  exit 1
}
cd ..
echo "✅ Rust compilation successful"

# Test 4: WASM build
echo "🕸️ Testing WASM build..."
npm run build:wasm > /dev/null 2>&1 || {
  echo "❌ WASM build failed"
  exit 1
}

# Check for generated files
wasm_files=("src/wasm/urbansynth_sim.js" "src/wasm/urbansynth_sim_bg.wasm")
for file in "${wasm_files[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ Generated WASM file $file not found"
    exit 1
  fi
done
echo "✅ WASM build successful"

# Test 5: TypeScript definitions
echo "📝 Testing TypeScript definitions..."
if [ ! -f "src/types/simulation.ts" ]; then
  echo "❌ TypeScript definitions not found"
  exit 1
fi
echo "✅ TypeScript definitions present"

# Test 6: API interface test (Node.js)
echo "🔍 Testing WASM API interface..."
node -e "
  (async () => {
    try {
      const fs = require('fs');
      const wasmFile = fs.readFileSync('./src/wasm/urbansynth_sim_bg.wasm');
      const wasmModule = await WebAssembly.instantiate(wasmFile);

      console.log('🕸️ WASM module loaded successfully');

      // Check for required exports
      const requiredExports = ['init', 'tick', 'getAgentStates', 'getTrafficData', 'updateWorld', 'destroy'];
      const actualExports = Object.keys(wasmModule.instance.exports);

      for (const exportName of requiredExports) {
        if (!actualExports.includes(exportName)) {
          console.log('❌ Missing required export:', exportName);
          process.exit(1);
        }
      }

      console.log('✅ All required exports present');
    } catch (error) {
      console.error('❌ WASM API test failed:', error.message);
      process.exit(1);
    }
  })();
" || exit 1

# Test 7: Memory and performance test
echo "⚡ Testing WASM performance..."
WASM_SIZE=$(wc -c < "src/wasm/urbansynth_sim_bg.wasm")
if [ $WASM_SIZE -gt 1048576 ]; then  # > 1MB
  echo "⚠️ WARNING: WASM file is large (${WASM_SIZE} bytes)"
else
  echo "✅ WASM file size acceptable (${WASM_SIZE} bytes)"
fi

echo "🎉 PLAN3 COMPLETED SUCCESSFULLY"
echo "📊 WASM Module Stats:"
echo "   - Size: $(echo "$WASM_SIZE / 1024" | bc -l | cut -d. -f1) KB"
echo "   - Exports: $(node -e "
     const fs = require('fs');
     const wasmFile = fs.readFileSync('./src/wasm/urbansynth_sim_bg.wasm');
     WebAssembly.instantiate(wasmFile).then(module => {
       console.log(Object.keys(module.instance.exports).length);
     });
   ")"
echo "Next: Execute PLAN4 for React frontend setup"
exit 0
```