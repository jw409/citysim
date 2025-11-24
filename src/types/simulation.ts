export interface Point2D {
  x: number;
  y: number;
}

export interface Agent {
  id: number;
  position: Point2D;
  initialPosition?: Point2D; // Initial starting position for agent
  destination?: string;
  current_poi?: string;
  agent_type: 'Pedestrian' | 'Car' | 'Bus' | 'Truck';
  schedule: ScheduleEntry[];
  current_schedule_index: number;
  speed: number;
  path: Point2D[];
  path_progress: number;
  needs: AgentNeeds;
  state: 'Traveling' | 'AtDestination' | 'FindingPath' | 'Waiting';
}

export interface ScheduleEntry {
  poi_type: number;
  start_time: number;
  duration: number;
  preferred_poi_id?: string;
}

export interface AgentNeeds {
  work: number;
  food: number;
  shopping: number;
  leisure: number;
  home: number;
}

export interface Zone {
  id: string;
  zone_type: number;
  boundary: Point2D[];
  density: number;
}

export interface Road {
  id: string;
  road_type: number;
  path: Point2D[];
  width: number;
  lanes: number;
  speed_limit: number;
}

export interface POI {
  id: string;
  poi_type: number;
  position: Point2D;
  zone_id: string;
  capacity: number;
}

export interface Building {
  id: string;
  footprint: Point2D[];
  height: number;
  zone_id: string;
  building_type: number;
}

export interface CityModel {
  zones: Zone[];
  roads: Road[];
  pois: POI[];
  buildings: Building[];
  bounds?: {
    min_x: number;
    max_x: number;
    min_y: number;
    max_y: number;
  };
  river?: any; // TODO: Define proper river type
  geographic_metadata?: any; // TODO: Define proper metadata type
}

export interface TrafficData {
  road_densities: Record<string, number>;
  poi_popularity: Record<string, number>;
  flow_matrix: TrafficFlow[];
  congestion_points: CongestionPoint[];
}

export interface TrafficFlow {
  from_poi: string;
  to_poi: string;
  flow_count: number;
}

export interface CongestionPoint {
  position: Point2D;
  severity: number;
  road_id: string;
}

export interface WorldUpdateEvent {
  event_type: string;
  poi_id?: string;
  data?: string;
}

export interface SimulationConfig {
  zones: Zone[];
  roads: Road[];
  pois: POI[];
  buildings: Building[];
}

export interface PerformanceMetrics {
  fps: number;
  tps: number; // Ticks per second
  memoryUsage: number;
  agentCount: number;
  simulationTime: number;
  seed: number;
}

// WASM interface definitions
export interface UrbanSynthSimModule {
  init(city_model_buffer: Uint8Array, config: any): void;
  init_with_seed(city_model_buffer: Uint8Array, config: any, seed: number): void;
  tick(): void;
  getAgentStates(): Agent[];
  getTrafficData(): TrafficData;
  updateWorld(event: WorldUpdateEvent): void;
  start(): void;
  pause(): void;
  setSpeed(multiplier: number): void;
  isRunning(): boolean;
  getSimulationTime(): number;
  getAgentCount(): number;
  getSeed(): number;
  destroy(): void;
}

// POI Type constants
export const POI_TYPES = {
  HOME: 0,
  OFFICE: 1,
  SHOP: 2,
  RESTAURANT: 3,
  SCHOOL: 4,
  HOSPITAL: 5,
  PARK_POI: 6,
} as const;

// Zone Type constants
export const ZONE_TYPES = {
  RESIDENTIAL: 0,
  COMMERCIAL: 1,
  INDUSTRIAL: 2,
  DOWNTOWN: 3,
  MIXED_USE: 4,
  PARK: 5,
} as const;

// Agent Type constants
export const AGENT_TYPES = {
  PEDESTRIAN: 'Pedestrian',
  CAR: 'Car',
  BUS: 'Bus',
  TRUCK: 'Truck',
} as const;

// Agent State constants
export const AGENT_STATES = {
  TRAVELING: 'Traveling',
  AT_DESTINATION: 'AtDestination',
  FINDING_PATH: 'FindingPath',
  WAITING: 'Waiting',
} as const;
