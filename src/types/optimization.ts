export interface ChargingStation {
  id: string;
  position: { x: number; y: number };
  capacity: number;
  cost: number;
  coverage_radius: number;
  traffic_coverage: number;
  poi_ids_covered: string[];
}

export interface OptimizationConfig {
  max_stations: number;
  max_budget: number;
  coverage_radius: number;
  min_traffic_threshold: number;
  cost_per_station: number;
  weight_coverage: number;
  weight_cost: number;
}

export interface OptimizationInput {
  traffic_data: TrafficDensityPoint[];
  roads: Road[];
  pois: POI[];
  existing_stations: ChargingStation[];
  config: OptimizationConfig;
}

export interface TrafficDensityPoint {
  position: { x: number; y: number };
  density: number;
  flow_volume: number;
  peak_hours: number[];
}

export interface OptimizationResult {
  stations: ChargingStation[];
  total_coverage: number;
  total_cost: number;
  objective_value: number;
  solve_time_ms: number;
  solution_status: 'OPTIMAL' | 'FEASIBLE' | 'INFEASIBLE' | 'UNBOUNDED';
  coverage_map: CoverageArea[];
}

export interface CoverageArea {
  center: { x: number; y: number };
  radius: number;
  traffic_covered: number;
  station_id: string;
}

export interface SolverProgress {
  phase: 'preparing' | 'solving' | 'processing' | 'complete';
  progress: number;
  message: string;
}

// Re-export commonly used types from simulation
export interface Road {
  id: string;
  path?: { x: number; y: number }[];
  width?: number;
  road_type?: number;
  lanes?: number;
  speed_limit?: number;
}

export interface POI {
  id: string;
  position: { x: number; y: number };
  properties?: {
    name?: string;
  };
  capacity?: number;
}