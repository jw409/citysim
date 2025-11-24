import { ScatterplotLayer, PathLayer } from '@deck.gl/layers';
import { LAYER_DEFINITIONS } from '../../types/layers';

export function createDroneLayer(droneData: any[]) {
  const layerConfig = LAYER_DEFINITIONS.drones;

  const drones = droneData.filter(d => d.type === 'drone');
  const flightPaths = droneData.filter(d => d.type === 'flight_path');

  return [
    // Drone positions
    new ScatterplotLayer({
      id: 'drones',
      data: drones,
      getPosition: (d: any) => [d.lng, d.lat, d.altitude || 80],
      getRadius: (d: any) => Math.max(3, (d.size || 1) * 2),
      getFillColor: (d: any) => {
        // Color by drone type and status
        if (d.status === 'emergency') return [255, 0, 0, 255]; // Red for emergency

        switch (d.drone_type) {
          case 'delivery':
            return [0, 255, 0, 255]; // Green for delivery
          case 'surveillance':
            return [255, 165, 0, 255]; // Orange for surveillance
          case 'inspection':
            return [0, 0, 255, 255]; // Blue for inspection
          case 'photography':
            return [255, 255, 0, 255]; // Yellow for photography
          case 'research':
            return [128, 0, 128, 255]; // Purple for research
          default:
            return layerConfig.color;
        }
      },
      getLineColor: [0, 0, 0, 150],
      getLineWidth: 1,
      pickable: true,
      radiusMinPixels: 2,
      radiusMaxPixels: 12,
      material: {
        ambient: 0.7,
        diffuse: 0.9,
        shininess: 16,
      },
      transitions: {
        getPosition: 500,
        getFillColor: 300,
      },
    }),

    // Drone flight paths
    new PathLayer({
      id: 'drone_paths',
      data: flightPaths,
      getPath: (d: any) => d.path,
      getWidth: (d: any) => d.width || 1,
      getColor: (d: any) => {
        // Semi-transparent paths
        switch (d.drone_type) {
          case 'delivery':
            return [0, 255, 0, 120];
          case 'surveillance':
            return [255, 165, 0, 120];
          case 'inspection':
            return [0, 0, 255, 120];
          case 'photography':
            return [255, 255, 0, 120];
          case 'research':
            return [128, 0, 128, 120];
          default:
            return [255, 255, 255, 100];
        }
      },
      opacity: 0.7,
      pickable: true,
      widthMinPixels: 1,
      widthMaxPixels: 3,
    }),
  ];
}

export function generateDroneTraffic(bounds: any, density: number = 0.3): any[] {
  const drones: any[] = [];
  const { min_x, min_y, max_x, max_y } = bounds;
  const droneTypes = ['delivery', 'surveillance', 'inspection', 'photography', 'research'];

  // Generate active drones
  const droneCount = Math.floor(density * 50);

  for (let i = 0; i < droneCount; i++) {
    const type = droneTypes[Math.floor(Math.random() * droneTypes.length)];
    const x = min_x + Math.random() * (max_x - min_x);
    const y = min_y + Math.random() * (max_y - min_y);
    const altitude = getDroneAltitude(type);

    const drone = {
      id: `drone_${i}`,
      type: 'drone',
      x: x,
      y: y,
      altitude: altitude,
      drone_type: type,
      size: getDroneSize(type),
      speed: getDroneSpeed(type),
      heading: Math.random() * 360,
      battery_level: 0.2 + Math.random() * 0.8,
      operator: generateOperator(type),
      mission: generateDroneMission(type),
      status: Math.random() > 0.95 ? 'emergency' : 'normal',
      registration: `D-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
    };

    drones.push(drone);

    // Generate flight path for this drone
    generateDroneFlightPath(drones, drone, bounds, type);
  }

  // Generate drone highways (common flight corridors for drones)
  const corridorCount = Math.floor(density * 8);

  for (let i = 0; i < corridorCount; i++) {
    generateDroneCorridor(drones, i, bounds);
  }

  // Generate delivery networks (hub and spoke patterns)
  generateDeliveryNetworks(drones, bounds, density);

  return drones;
}

function getDroneAltitude(type: string): number {
  switch (type) {
    case 'delivery':
      return 50 + Math.random() * 100; // 50-150m
    case 'surveillance':
      return 80 + Math.random() * 70; // 80-150m
    case 'inspection':
      return 30 + Math.random() * 50; // 30-80m
    case 'photography':
      return 60 + Math.random() * 90; // 60-150m
    case 'research':
      return 100 + Math.random() * 50; // 100-150m
    default:
      return 80;
  }
}

function getDroneSize(type: string): number {
  switch (type) {
    case 'delivery':
      return 3; // Large delivery drones
    case 'surveillance':
      return 2; // Medium surveillance drones
    case 'inspection':
      return 1.5; // Small inspection drones
    case 'photography':
      return 2; // Medium camera drones
    case 'research':
      return 2.5; // Large research drones
    default:
      return 2;
  }
}

function getDroneSpeed(type: string): number {
  switch (type) {
    case 'delivery':
      return 60; // Fast delivery
    case 'surveillance':
      return 40; // Moderate surveillance speed
    case 'inspection':
      return 25; // Slow and precise inspection
    case 'photography':
      return 35; // Smooth camera movement
    case 'research':
      return 45; // Variable research speed
    default:
      return 40;
  }
}

function generateOperator(type: string): string {
  const operators: Record<string, string[]> = {
    delivery: ['Amazon Prime Air', 'UPS Flight Forward', 'FedEx Wing', 'DoorDash', 'DroneUp'],
    surveillance: ['Police Department', 'Security Corp', 'Private Investigator', 'Border Patrol'],
    inspection: ['Utility Company', 'Construction Corp', 'Insurance Adjuster', 'Survey Co'],
    photography: ['News Station', 'Real Estate', 'Event Photography', 'Tourism Board'],
    research: ['University', 'Weather Service', 'Environmental Agency', 'Tech Company'],
  };

  const typeOperators = operators[type] || operators.delivery;
  return typeOperators[Math.floor(Math.random() * typeOperators.length)];
}

function generateDroneMission(type: string): string {
  const missions: Record<string, string[]> = {
    delivery: ['Package Delivery', 'Food Delivery', 'Medical Supply', 'Emergency Supply'],
    surveillance: ['Area Patrol', 'Traffic Monitoring', 'Security Watch', 'Search & Rescue'],
    inspection: [
      'Infrastructure Check',
      'Damage Assessment',
      'Maintenance Survey',
      'Safety Inspection',
    ],
    photography: ['Aerial Photography', 'Event Coverage', 'Property Survey', 'Documentary Film'],
    research: ['Data Collection', 'Environmental Monitor', 'Weather Observation', 'Traffic Study'],
  };

  const typeMissions = missions[type] || missions.delivery;
  return typeMissions[Math.floor(Math.random() * typeMissions.length)];
}

function generateDroneFlightPath(drones: any[], drone: any, bounds: any, type: string) {
  const { min_x, min_y, max_x, max_y } = bounds;
  const pathPoints: [number, number, number][] = [];

  // Different path patterns based on drone type
  switch (type) {
    case 'delivery':
      // Point-to-point delivery path
      generateDeliveryPath(pathPoints, drone, bounds);
      break;

    case 'surveillance':
      // Grid pattern surveillance
      generateSurveillancePath(pathPoints, drone, bounds);
      break;

    case 'inspection':
      // Detailed inspection pattern
      generateInspectionPath(pathPoints, drone, bounds);
      break;

    case 'photography':
      // Smooth camera movement
      generatePhotographyPath(pathPoints, drone, bounds);
      break;

    case 'research':
      // Scientific sampling pattern
      generateResearchPath(pathPoints, drone, bounds);
      break;

    default:
      generateGenericPath(pathPoints, drone, bounds);
  }

  if (pathPoints.length > 0) {
    drones.push({
      id: `drone_path_${drone.id}`,
      type: 'flight_path',
      drone_id: drone.id,
      path: pathPoints,
      drone_type: type,
      width: 1,
    });
  }
}

function generateDeliveryPath(pathPoints: [number, number, number][], drone: any, bounds: any) {
  const { min_x, min_y, max_x, max_y } = bounds;

  // Start at current position
  pathPoints.push([drone.x, drone.y, drone.altitude]);

  // Fly to delivery destination
  const destX = min_x + Math.random() * (max_x - min_x);
  const destY = min_y + Math.random() * (max_y - min_y);

  // Create waypoints for efficient delivery route
  const waypoints = 3;
  for (let i = 1; i <= waypoints; i++) {
    const progress = i / waypoints;
    const x = drone.x + (destX - drone.x) * progress;
    const y = drone.y + (destY - drone.y) * progress;
    const altitude = drone.altitude; // Maintain consistent altitude

    pathPoints.push([x, y, altitude]);
  }
}

function generateSurveillancePath(pathPoints: [number, number, number][], drone: any, bounds: any) {
  // Create grid patrol pattern
  const gridSize = 200;
  const startX = drone.x - gridSize;
  const startY = drone.y - gridSize;

  for (let row = 0; row < 3; row++) {
    const y = startY + row * gridSize;
    if (row % 2 === 0) {
      // Left to right
      for (let col = 0; col < 3; col++) {
        const x = startX + col * gridSize;
        pathPoints.push([x, y, drone.altitude]);
      }
    } else {
      // Right to left
      for (let col = 2; col >= 0; col--) {
        const x = startX + col * gridSize;
        pathPoints.push([x, y, drone.altitude]);
      }
    }
  }
}

function generateInspectionPath(pathPoints: [number, number, number][], drone: any, bounds: any) {
  // Close inspection with altitude changes
  const inspectionPoints = 8;
  const radius = 50;

  for (let i = 0; i < inspectionPoints; i++) {
    const angle = (i * 2 * Math.PI) / inspectionPoints;
    const x = drone.x + Math.cos(angle) * radius;
    const y = drone.y + Math.sin(angle) * radius;
    const altitude = drone.altitude + Math.sin(angle * 2) * 10; // Varying altitude

    pathPoints.push([x, y, altitude]);
  }
}

function generatePhotographyPath(pathPoints: [number, number, number][], drone: any, bounds: any) {
  // Smooth cinematic movement
  const segments = 10;
  const amplitude = 100;

  for (let i = 0; i <= segments; i++) {
    const progress = i / segments;
    const x = drone.x + progress * 300 - 150;
    const y = drone.y + Math.sin(progress * Math.PI * 2) * amplitude;
    const altitude = drone.altitude + Math.cos(progress * Math.PI) * 20;

    pathPoints.push([x, y, altitude]);
  }
}

function generateResearchPath(pathPoints: [number, number, number][], drone: any, bounds: any) {
  // Scientific sampling pattern
  const samples = 6;
  const spacing = 80;

  for (let i = 0; i < samples; i++) {
    const x = drone.x + ((i % 3) - 1) * spacing;
    const y = drone.y + Math.floor(i / 3) * spacing;
    const altitude = drone.altitude + Math.random() * 20 - 10;

    pathPoints.push([x, y, altitude]);
  }
}

function generateGenericPath(pathPoints: [number, number, number][], drone: any, bounds: any) {
  // Simple random movement
  for (let i = 0; i < 5; i++) {
    const x = drone.x + (Math.random() - 0.5) * 200;
    const y = drone.y + (Math.random() - 0.5) * 200;
    const altitude = drone.altitude + (Math.random() - 0.5) * 30;

    pathPoints.push([x, y, altitude]);
  }
}

function generateDroneCorridor(drones: any[], index: number, bounds: any) {
  const { min_x, min_y, max_x, max_y } = bounds;
  const pathPoints: [number, number, number][] = [];
  const altitude = 100 + Math.random() * 50;

  // Create drone highways at consistent altitudes
  const corridorLength = 10;
  for (let i = 0; i <= corridorLength; i++) {
    const progress = i / corridorLength;
    const x = min_x + progress * (max_x - min_x);
    const y = min_y + Math.random() * (max_y - min_y);
    pathPoints.push([x, y, altitude]);
  }

  drones.push({
    id: `drone_corridor_${index}`,
    type: 'flight_path',
    path: pathPoints,
    corridor_type: 'highway',
    average_altitude: altitude,
    traffic_density: Math.random(),
    width: 2,
  });
}

function generateDeliveryNetworks(drones: any[], bounds: any, density: number) {
  const { min_x, min_y, max_x, max_y } = bounds;
  const hubCount = Math.floor(density * 3) + 1;

  for (let hub = 0; hub < hubCount; hub++) {
    const hubX = min_x + ((hub + 1) * (max_x - min_x)) / (hubCount + 1);
    const hubY = min_y + Math.random() * (max_y - min_y);

    // Create spoke routes from hub
    const spokeCount = 8;
    for (let spoke = 0; spoke < spokeCount; spoke++) {
      const angle = (spoke * 2 * Math.PI) / spokeCount;
      const pathPoints: [number, number, number][] = [];

      for (let distance = 0; distance <= 500; distance += 100) {
        const x = hubX + Math.cos(angle) * distance;
        const y = hubY + Math.sin(angle) * distance;
        const altitude = 80;

        if (x >= min_x && x <= max_x && y >= min_y && y <= max_y) {
          pathPoints.push([x, y, altitude]);
        }
      }

      if (pathPoints.length > 1) {
        drones.push({
          id: `delivery_hub_${hub}_spoke_${spoke}`,
          type: 'flight_path',
          path: pathPoints,
          network_type: 'delivery_hub',
          hub_id: hub,
          average_altitude: 80,
          width: 1,
        });
      }
    }
  }
}
