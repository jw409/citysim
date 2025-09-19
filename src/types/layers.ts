export interface LayerConfig {
  id: string;
  name: string;
  minElevation: number;
  maxElevation: number;
  visible: boolean;
  opacity: number;
  color: [number, number, number, number];
}

export interface CityLayer {
  id: string;
  type: 'underground' | 'street' | 'elevated' | 'aerial';
  elevation: number;
  data: any[];
  visible: boolean;
  opacity: number;
}

export const LAYER_DEFINITIONS: Record<string, LayerConfig> = {
  // Underground Infrastructure (-30m to 0m)
  deep_utilities: {
    id: 'deep_utilities',
    name: 'Deep Utilities',
    minElevation: -30,
    maxElevation: -20,
    visible: false,
    opacity: 0.7,
    color: [100, 100, 100, 180],
  },

  subway_tunnels: {
    id: 'subway_tunnels',
    name: 'Subway/Metro',
    minElevation: -20,
    maxElevation: -10,
    visible: false,
    opacity: 0.8,
    color: [255, 165, 0, 200],
  },

  sewer_system: {
    id: 'sewer_system',
    name: 'Sewer System',
    minElevation: -20,
    maxElevation: -5,
    visible: false,
    opacity: 0.6,
    color: [139, 69, 19, 150],
  },

  underground_parking: {
    id: 'underground_parking',
    name: 'Underground Parking',
    minElevation: -10,
    maxElevation: -2,
    visible: false,
    opacity: 0.8,
    color: [70, 70, 70, 200],
  },

  utility_tunnels: {
    id: 'utility_tunnels',
    name: 'Utility Tunnels',
    minElevation: -10,
    maxElevation: -2,
    visible: false,
    opacity: 0.7,
    color: [255, 255, 0, 180],
  },

  basements: {
    id: 'basements',
    name: 'Building Basements',
    minElevation: -5,
    maxElevation: 0,
    visible: false,
    opacity: 0.6,
    color: [128, 128, 128, 150],
  },

  // Street Level (0m to 30m)
  roads: {
    id: 'roads',
    name: 'Roads & Streets',
    minElevation: 0,
    maxElevation: 4,
    visible: true,
    opacity: 1.0,
    color: [64, 64, 64, 255],
  },

  sidewalks: {
    id: 'sidewalks',
    name: 'Sidewalks',
    minElevation: 0,
    maxElevation: 1,
    visible: true,
    opacity: 1.0,
    color: [200, 200, 200, 255],
  },

  buildings_low: {
    id: 'buildings_low',
    name: 'Low-Rise Buildings',
    minElevation: 0,
    maxElevation: 30,
    visible: true,
    opacity: 1.0,
    color: [150, 150, 150, 255],
  },

  pedestrians: {
    id: 'pedestrians',
    name: 'Pedestrians',
    minElevation: 0,
    maxElevation: 2,
    visible: true,
    opacity: 1.0,
    color: [0, 255, 0, 255],
  },

  vehicles: {
    id: 'vehicles',
    name: 'Vehicles',
    minElevation: 0,
    maxElevation: 3,
    visible: true,
    opacity: 1.0,
    color: [255, 0, 0, 255],
  },

  // Elevated Level (30m to 200m)
  buildings_high: {
    id: 'buildings_high',
    name: 'High-Rise Buildings',
    minElevation: 30,
    maxElevation: 200,
    visible: true,
    opacity: 1.0,
    color: [120, 120, 180, 255],
  },

  elevated_highways: {
    id: 'elevated_highways',
    name: 'Elevated Highways',
    minElevation: 30,
    maxElevation: 50,
    visible: true,
    opacity: 0.9,
    color: [100, 100, 100, 230],
  },

  sky_bridges: {
    id: 'sky_bridges',
    name: 'Sky Bridges',
    minElevation: 20,
    maxElevation: 100,
    visible: true,
    opacity: 0.8,
    color: [200, 200, 255, 200],
  },

  elevated_transit: {
    id: 'elevated_transit',
    name: 'Elevated Transit',
    minElevation: 30,
    maxElevation: 60,
    visible: true,
    opacity: 0.9,
    color: [255, 100, 100, 230],
  },

  // Aerial Level (200m+)
  helicopters: {
    id: 'helicopters',
    name: 'Helicopter Traffic',
    minElevation: 60,
    maxElevation: 300,
    visible: true,
    opacity: 1.0,
    color: [255, 255, 0, 255],
  },

  aircraft: {
    id: 'aircraft',
    name: 'Aircraft Paths',
    minElevation: 200,
    maxElevation: 1000,
    visible: true,
    opacity: 0.8,
    color: [0, 255, 255, 200],
  },

  drones: {
    id: 'drones',
    name: 'Drone Traffic',
    minElevation: 50,
    maxElevation: 150,
    visible: true,
    opacity: 0.9,
    color: [255, 0, 255, 230],
  },
};

export const LAYER_GROUPS = {
  underground: [
    'deep_utilities',
    'subway_tunnels',
    'sewer_system',
    'underground_parking',
    'utility_tunnels',
    'basements',
  ],
  street: ['roads', 'sidewalks', 'buildings_low', 'pedestrians', 'vehicles'],
  elevated: ['buildings_high', 'elevated_highways', 'sky_bridges', 'elevated_transit'],
  aerial: ['helicopters', 'aircraft', 'drones'],
};

export interface ViewMode {
  id: string;
  name: string;
  visibleLayers: string[];
  cameraAngle: 'top' | 'side' | 'isometric' | 'street' | 'cross_section';
  crossSectionPlane?: {
    x?: number;
    y?: number;
    z?: number;
    normal: [number, number, number];
  };
}

export const VIEW_MODES: Record<string, ViewMode> = {
  overview: {
    id: 'overview',
    name: 'City Overview',
    visibleLayers: ['roads', 'buildings_low', 'buildings_high', 'vehicles', 'pedestrians'],
    cameraAngle: 'isometric',
  },

  infrastructure: {
    id: 'infrastructure',
    name: 'Infrastructure View',
    visibleLayers: [
      'roads',
      'utility_tunnels',
      'sewer_system',
      'deep_utilities',
      'elevated_highways',
    ],
    cameraAngle: 'cross_section',
    crossSectionPlane: { z: 0, normal: [0, 0, 1] },
  },

  transit: {
    id: 'transit',
    name: 'Transit Systems',
    visibleLayers: ['roads', 'subway_tunnels', 'elevated_transit', 'vehicles'],
    cameraAngle: 'isometric',
  },

  underground: {
    id: 'underground',
    name: 'Underground Only',
    visibleLayers: [
      'subway_tunnels',
      'sewer_system',
      'utility_tunnels',
      'underground_parking',
      'basements',
    ],
    cameraAngle: 'top',
  },

  aerial: {
    id: 'aerial',
    name: 'Aerial Traffic',
    visibleLayers: ['buildings_high', 'helicopters', 'aircraft', 'drones'],
    cameraAngle: 'isometric',
  },

  cross_section: {
    id: 'cross_section',
    name: 'Cross Section',
    visibleLayers: Object.keys(LAYER_DEFINITIONS),
    cameraAngle: 'cross_section',
    crossSectionPlane: { x: 0, normal: [1, 0, 0] },
  },
};
