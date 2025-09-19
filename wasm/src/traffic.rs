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
        let flow_matrix = Vec::new();
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