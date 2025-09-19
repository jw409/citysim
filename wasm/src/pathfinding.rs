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