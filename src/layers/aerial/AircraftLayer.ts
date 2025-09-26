import { ScatterplotLayer, PathLayer } from '@deck.gl/layers';
import { LAYER_DEFINITIONS } from '../../types/layers';

export function createAircraftLayer(aircraftData: any[]) {
  const layerConfig = LAYER_DEFINITIONS.aircraft;

  const aircraft = aircraftData.filter(d => d.type === 'aircraft');
  const flightPaths = aircraftData.filter(d => d.type === 'flight_path');

  return [
    // Aircraft positions
    new ScatterplotLayer({
      id: 'aircraft',
      data: aircraft,
      getPosition: (d: any) => [d.lng, d.lat, d.altitude || 3000],
      getRadius: (d: any) => Math.max(10, (d.altitude || 3000) / 300),
      getFillColor: (d: any) => {
        // Color by aircraft type
        switch (d.aircraft_type) {
          case 'commercial': return [0, 150, 255, 255]; // Blue for commercial
          case 'cargo': return [255, 150, 0, 255]; // Orange for cargo
          case 'private': return [255, 255, 255, 255]; // White for private
          case 'military': return [100, 100, 100, 255]; // Gray for military
          default: return layerConfig.color;
        }
      },
      getLineColor: [0, 0, 0, 80],
      getLineWidth: 1,
      pickable: true,
      radiusMinPixels: 6,
      radiusMaxPixels: 25,
      material: {
        ambient: 0.5,
        diffuse: 0.8,
        shininess: 64
      },
      transitions: {
        getPosition: 2000,
        getFillColor: 500
      }
    }),

    // Flight paths
    new PathLayer({
      id: 'aircraft_paths',
      data: flightPaths,
      getPath: (d: any) => d.path,
      getWidth: (d: any) => d.width || 3,
      getColor: (d: any) => {
        const altitude = d.average_altitude || 3000;
        // Higher altitude = more transparent
        const alpha = Math.max(50, 255 - (altitude / 10000) * 200);
        return [255, 255, 255, alpha];
      },
      opacity: 0.4,
      pickable: true,
      widthMinPixels: 1,
      widthMaxPixels: 8
    })
  ];
}

export function generateAirTraffic(bounds: any, density: number = 0.05): any[] {
  const aircraft: any[] = [];
  const { min_x, min_y, max_x, max_y } = bounds;
  const aircraftTypes = ['commercial', 'cargo', 'private', 'military'];

  // Generate active aircraft
  const aircraftCount = Math.floor(density * 15);

  for (let i = 0; i < aircraftCount; i++) {
    const type = aircraftTypes[Math.floor(Math.random() * aircraftTypes.length)];
    const x = min_x + Math.random() * (max_x - min_x);
    const y = min_y + Math.random() * (max_y - min_y);

    // Different altitude ranges for different aircraft types
    const altitude = getAltitudeRange(type);

    aircraft.push({
      id: `aircraft_${i}`,
      type: 'aircraft',
      x: x,
      y: y,
      altitude: altitude,
      aircraft_type: type,
      speed: getAircraftSpeed(type),
      heading: Math.random() * 360,
      flight_number: generateFlightNumber(type),
      origin: generateAirport(),
      destination: generateAirport(),
      fuel_level: 0.4 + Math.random() * 0.6,
      passengers: type === 'commercial' ? Math.floor(50 + Math.random() * 300) : 0
    });

    // Generate flight path for this aircraft
    generateFlightPath(aircraft, i, bounds, type, altitude);
  }

  // Generate air corridors (standard flight paths)
  const corridorCount = Math.floor(density * 8);

  for (let i = 0; i < corridorCount; i++) {
    generateAirCorridor(aircraft, i, bounds);
  }

  // Generate approach/departure patterns around airports
  generateAirportPatterns(aircraft, bounds, density);

  return aircraft;
}

function getAltitudeRange(type: string): number {
  switch (type) {
    case 'commercial': return 8000 + Math.random() * 4000; // 8000-12000m
    case 'cargo': return 7000 + Math.random() * 5000; // 7000-12000m
    case 'private': return 3000 + Math.random() * 6000; // 3000-9000m
    case 'military': return 5000 + Math.random() * 10000; // 5000-15000m
    default: return 5000;
  }
}

function getAircraftSpeed(type: string): number {
  switch (type) {
    case 'commercial': return 850;
    case 'cargo': return 800;
    case 'private': return 500;
    case 'military': return 1200;
    default: return 600;
  }
}

function generateFlightNumber(type: string): string {
  const prefixes: Record<string, string[]> = {
    commercial: ['AA', 'UA', 'DL', 'SW', 'JB'],
    cargo: ['FX', 'UP', 'CK', 'GL'],
    private: ['N'],
    military: ['AF', 'NV', 'AR']
  };

  const typePrefix = prefixes[type] || prefixes.private;
  const prefix = typePrefix[Math.floor(Math.random() * typePrefix.length)];
  const number = Math.floor(100 + Math.random() * 8900);

  return `${prefix}${number}`;
}

function generateAirport(): string {
  const airports = [
    'LAX', 'JFK', 'ORD', 'ATL', 'DFW', 'DEN', 'LAS', 'PHX', 'MIA', 'SEA',
    'BOS', 'SFO', 'LGA', 'BWI', 'IAD', 'MSP', 'DTW', 'PHL', 'CLT', 'MCO'
  ];
  return airports[Math.floor(Math.random() * airports.length)];
}

function generateFlightPath(aircraft: any[], index: number, bounds: any, type: string, altitude: number) {
  const { min_x, min_y, max_x, max_y } = bounds;
  const currentAircraft = aircraft[aircraft.length - 1];

  const pathPoints: [number, number, number][] = [];
  const pathLength = 4 + Math.floor(Math.random() * 6);

  // Start from current position
  let currentX = currentAircraft.x;
  let currentY = currentAircraft.y;
  let currentAlt = altitude;

  pathPoints.push([currentX, currentY, currentAlt]);

  for (let j = 1; j < pathLength; j++) {
    // Aircraft tend to fly in relatively straight lines with gradual changes
    const deltaX = (Math.random() - 0.5) * 1000;
    const deltaY = (Math.random() - 0.5) * 1000;
    const deltaAlt = (Math.random() - 0.5) * 500;

    currentX = Math.max(min_x, Math.min(max_x, currentX + deltaX));
    currentY = Math.max(min_y, Math.min(max_y, currentY + deltaY));
    currentAlt = Math.max(1000, currentAlt + deltaAlt);

    pathPoints.push([currentX, currentY, currentAlt]);
  }

  aircraft.push({
    id: `aircraft_path_${index}`,
    type: 'flight_path',
    aircraft_id: `aircraft_${index}`,
    path: pathPoints,
    aircraft_type: type,
    average_altitude: altitude,
    width: type === 'commercial' ? 4 : 3
  });
}

function generateAirCorridor(aircraft: any[], index: number, bounds: any) {
  const { min_x, min_y, max_x, max_y } = bounds;

  // Create shorter, localized air corridors instead of city-spanning ones
  const corridorTypes = ['east_west', 'north_south', 'diagonal'];
  const corridorType = corridorTypes[index % corridorTypes.length];

  const pathPoints: [number, number, number][] = [];
  const altitude = 9000 + Math.random() * 3000;

  // Limit corridor length to 2km max to prevent planetary-scale artifacts
  const maxCorridorLength = 2000;
  const centerX = (min_x + max_x) / 2;
  const centerY = (min_y + max_y) / 2;

  switch (corridorType) {
    case 'east_west':
      const y = centerY + (Math.random() - 0.5) * 1000; // Within 500m of center
      const startX = centerX - maxCorridorLength / 2;
      const endX = centerX + maxCorridorLength / 2;
      for (let x = startX; x <= endX; x += maxCorridorLength / 5) {
        pathPoints.push([x, y + (Math.random() - 0.5) * 50, altitude]);
      }
      break;

    case 'north_south':
      const x = centerX + (Math.random() - 0.5) * 1000; // Within 500m of center
      const startY = centerY - maxCorridorLength / 2;
      const endY = centerY + maxCorridorLength / 2;
      for (let y = startY; y <= endY; y += maxCorridorLength / 5) {
        pathPoints.push([x + (Math.random() - 0.5) * 50, y, altitude]);
      }
      break;

    case 'diagonal':
      const startCornerX = centerX - maxCorridorLength / 2;
      const startCornerY = centerY - maxCorridorLength / 2;
      for (let i = 0; i <= 5; i++) {
        const progress = i / 5;
        const px = startCornerX + progress * maxCorridorLength;
        const py = startCornerY + progress * maxCorridorLength;
        pathPoints.push([px, py, altitude]);
      }
      break;
  }

  aircraft.push({
    id: `air_corridor_${index}`,
    type: 'flight_path',
    path: pathPoints,
    corridor_type: corridorType,
    average_altitude: altitude,
    traffic_density: Math.random(),
    width: 5
  });
}

function generateAirportPatterns(aircraft: any[], bounds: any, density: number) {
  const { min_x, min_y, max_x, max_y } = bounds;

  // Generate a few airport locations
  const airportCount = Math.floor(density * 3) + 1;

  for (let i = 0; i < airportCount; i++) {
    const airportX = min_x + (i + 1) * (max_x - min_x) / (airportCount + 1);
    const airportY = min_y + Math.random() * (max_y - min_y);

    // Generate approach patterns
    const approaches = 4; // 4 approach directions

    for (let approach = 0; approach < approaches; approach++) {
      const angle = (approach * 90 + Math.random() * 30 - 15) * Math.PI / 180;
      const pathPoints: [number, number, number][] = [];

      // Approach path (descending) - shortened to prevent planetary artifacts
      for (let distance = 1000; distance >= 0; distance -= 150) {
        const x = airportX + Math.cos(angle) * distance;
        const y = airportY + Math.sin(angle) * distance;
        const altitude = Math.max(100, (distance / 1000) * 2000);

        if (x >= min_x && x <= max_x && y >= min_y && y <= max_y) {
          pathPoints.push([x, y, altitude]);
        }
      }

      if (pathPoints.length > 0) {
        aircraft.push({
          id: `airport_${i}_approach_${approach}`,
          type: 'flight_path',
          path: pathPoints,
          pattern_type: 'approach',
          airport_id: i,
          average_altitude: 1500,
          width: 3
        });
      }
    }
  }
}