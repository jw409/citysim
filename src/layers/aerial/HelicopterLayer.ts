import { ScatterplotLayer, PathLayer } from '@deck.gl/layers';
import { LAYER_DEFINITIONS } from '../../types/layers';

export function createHelicopterLayer(helicopterData: any[]) {
  const layerConfig = LAYER_DEFINITIONS.helicopters;

  const helicopters = helicopterData.filter(d => d.type === 'helicopter');
  const flightPaths = helicopterData.filter(d => d.type === 'flight_path');

  return [
    // Helicopter positions
    new ScatterplotLayer({
      id: 'helicopters',
      data: helicopters,
      getPosition: (d: any) => [d.lng, d.lat, d.altitude || 100],
      getRadius: (d: any) => d.size || 8,
      getFillColor: (d: any) => {
        // Color by helicopter type
        switch (d.helicopter_type) {
          case 'emergency': return [255, 0, 0, 255]; // Red for emergency
          case 'police': return [0, 0, 255, 255]; // Blue for police
          case 'news': return [255, 255, 0, 255]; // Yellow for news
          case 'medical': return [255, 255, 255, 255]; // White for medical
          case 'civilian': return [0, 255, 0, 255]; // Green for civilian
          default: return layerConfig.color;
        }
      },
      getLineColor: [0, 0, 0, 100],
      getLineWidth: 1,
      pickable: true,
      radiusMinPixels: 4,
      radiusMaxPixels: 20,
      material: {
        ambient: 0.6,
        diffuse: 0.8,
        shininess: 32
      },
      transitions: {
        getPosition: 1000,
        getFillColor: 500
      }
    }),

    // Flight paths
    new PathLayer({
      id: 'helicopter_paths',
      data: flightPaths,
      getPath: (d: any) => d.path,
      getWidth: 2,
      getColor: [255, 255, 255, 100],
      opacity: 0.6,
      pickable: false,
      widthMinPixels: 1,
      widthMaxPixels: 4
    })
  ];
}

export function generateHelicopterTraffic(bounds: any, density: number = 0.1): any[] {
  const helicopters: any[] = [];
  const { min_x, min_y, max_x, max_y } = bounds;
  const helicopterTypes = ['emergency', 'police', 'news', 'medical', 'civilian'];

  // Generate active helicopters
  const helicopterCount = Math.floor(density * 20);

  for (let i = 0; i < helicopterCount; i++) {
    const type = helicopterTypes[Math.floor(Math.random() * helicopterTypes.length)];
    const x = min_x + Math.random() * (max_x - min_x);
    const y = min_y + Math.random() * (max_y - min_y);
    const altitude = 60 + Math.random() * 240; // 60-300m altitude

    helicopters.push({
      id: `helicopter_${i}`,
      type: 'helicopter',
      x: x,
      y: y,
      altitude: altitude,
      helicopter_type: type,
      speed: getHelicopterSpeed(type),
      heading: Math.random() * 360,
      mission: generateMission(type),
      fuel_level: 0.3 + Math.random() * 0.7,
      registration: `H-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
    });

    // Generate flight path for this helicopter
    const pathPoints: [number, number, number][] = [];
    const pathLength = 3 + Math.floor(Math.random() * 5);

    for (let j = 0; j < pathLength; j++) {
      const pathX = x + (Math.random() - 0.5) * 500;
      const pathY = y + (Math.random() - 0.5) * 500;
      const pathAltitude = altitude + (Math.random() - 0.5) * 50;

      pathPoints.push([
        Math.max(min_x, Math.min(max_x, pathX)),
        Math.max(min_y, Math.min(max_y, pathY)),
        Math.max(50, pathAltitude)
      ]);
    }

    helicopters.push({
      id: `helicopter_path_${i}`,
      type: 'flight_path',
      helicopter_id: `helicopter_${i}`,
      path: pathPoints
    });
  }

  // Generate helicopter routes (common flight corridors)
  const routeCount = Math.floor(density * 10);

  for (let i = 0; i < routeCount; i++) {
    const startX = min_x + Math.random() * (max_x - min_x);
    const startY = min_y + Math.random() * (max_y - min_y);
    const endX = min_x + Math.random() * (max_x - min_x);
    const endY = min_y + Math.random() * (max_y - min_y);

    const routePoints: [number, number, number][] = [];
    const segments = 5 + Math.floor(Math.random() * 5);

    for (let j = 0; j <= segments; j++) {
      const progress = j / segments;
      const x = startX + (endX - startX) * progress;
      const y = startY + (endY - startY) * progress;
      const altitude = 80 + Math.random() * 120;

      routePoints.push([x, y, altitude]);
    }

    helicopters.push({
      id: `helicopter_route_${i}`,
      type: 'flight_path',
      path: routePoints,
      route_type: 'corridor',
      traffic_level: Math.random()
    });
  }

  return helicopters;
}

function getHelicopterSpeed(type: string): number {
  switch (type) {
    case 'emergency': return 180;
    case 'police': return 160;
    case 'news': return 140;
    case 'medical': return 170;
    case 'civilian': return 120;
    default: return 140;
  }
}

function generateMission(type: string): string {
  const missions: Record<string, string[]> = {
    emergency: ['Fire Response', 'Rescue Operation', 'Disaster Relief', 'Evacuation'],
    police: ['Patrol', 'Pursuit', 'Surveillance', 'Traffic Monitoring'],
    news: ['Live Broadcast', 'Event Coverage', 'Traffic Report', 'Breaking News'],
    medical: ['Medevac', 'Hospital Transfer', 'Emergency Transport', 'Organ Transport'],
    civilian: ['Sightseeing', 'Business Flight', 'Private Transport', 'Training Flight']
  };

  const typeMissions = missions[type] || missions.civilian;
  return typeMissions[Math.floor(Math.random() * typeMissions.length)];
}