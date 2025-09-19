export interface OptimizationConfig {
  maxStations: number;
  coverageRadius: number;
  budget: number;
}

export interface OptimizationResult {
  stations: ChargingStation[];
  coverage_map: CoverageData;
  total_cost: number;
  coverage_percentage: number;
  objective_value: number;
}

export interface ChargingStation {
  id: string;
  longitude: number;
  latitude: number;
  cost: number;
  coverage_radius: number;
}

export interface CoverageData {
  covered_roads: string[];
  coverage_score: number;
}

export interface SolverProgress {
  phase: 'preparing' | 'solving' | 'complete' | 'error';
  progress: number;
  message: string;
}