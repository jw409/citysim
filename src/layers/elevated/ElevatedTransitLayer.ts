import { PathLayer, ScatterplotLayer } from '@deck.gl/layers';
import { LAYER_DEFINITIONS } from '../../types/layers';

export function createElevatedTransitLayer(transitData: any[]) {
  const layerConfig = LAYER_DEFINITIONS.elevated_transit;

  const tracks = transitData.filter(d => d.type === 'track');
  const stations = transitData.filter(d => d.type === 'station');

  return [
    // Elevated transit tracks
    new PathLayer({
      id: 'elevated_transit_tracks',
      data: tracks,
      getPath: (d: any) => d.path || d.coordinates,
      getWidth: (d: any) => d.width || 4,
      getColor: (d: any) => {
        // Color by transit type
        switch (d.transit_type) {
          case 'monorail': return [255, 100, 100, 240];
          case 'light_rail': return [100, 255, 100, 240];
          case 'bullet_train': return [100, 100, 255, 240];
          case 'maglev': return [255, 100, 255, 240];
          default: return layerConfig.color;
        }
      },
      opacity: layerConfig.opacity,
      pickable: true,
      widthMinPixels: 3,
      widthMaxPixels: 15,
      getElevation: (d: any) => d.elevation || 45,
      extruded: true,
      material: {
        ambient: 0.3,
        diffuse: 0.7,
        shininess: 64,
        specularColor: [255, 255, 255]
      },
      transitions: {
        getColor: 600,
        getWidth: 400
      }
    }),

    // Elevated transit stations
    new ScatterplotLayer({
      id: 'elevated_transit_stations',
      data: stations,
      getPosition: (d: any) => [d.lng, d.lat, d.elevation || 40],
      getRadius: (d: any) => d.size || 20,
      getFillColor: [255, 200, 100, 220],
      getLineColor: [0, 0, 0, 150],
      getLineWidth: 2,
      pickable: true,
      radiusMinPixels: 10,
      radiusMaxPixels: 40,
      material: {
        ambient: 0.4,
        diffuse: 0.8,
        shininess: 32
      }
    })
  ];
}

export function generateElevatedTransit(bounds: any, lineCount: number = 3): any[] {
  const transit: any[] = [];
  const { min_x, min_y, max_x, max_y } = bounds;
  const transitTypes = ['monorail', 'light_rail', 'bullet_train', 'maglev'];

  for (let lineIndex = 0; lineIndex < lineCount; lineIndex++) {
    const transitType = transitTypes[lineIndex % transitTypes.length];
    const lineId = `elevated_${transitType}_${lineIndex}`;

    // Create elevated transit line
    const stationCount = 6 + Math.floor(Math.random() * 4);
    const stations: any[] = [];
    const elevation = 40 + lineIndex * 10; // Stack lines at different elevations

    // Generate stations along an interesting path
    for (let stationIndex = 0; stationIndex < stationCount; stationIndex++) {
      const progress = stationIndex / (stationCount - 1);

      // Create organic path with curves
      let x, y;
      if (lineIndex % 2 === 0) {
        // Curved east-west line
        x = min_x + progress * (max_x - min_x);
        y = min_y + (max_y - min_y) * 0.5 +
            Math.sin(progress * Math.PI * 2) * (max_y - min_y) * 0.2;
      } else {
        // Curved north-south line
        y = min_y + progress * (max_y - min_y);
        x = min_x + (max_x - min_x) * 0.5 +
            Math.cos(progress * Math.PI * 1.5) * (max_x - min_x) * 0.2;
      }

      const station = {
        id: `${lineId}_station_${stationIndex}`,
        type: 'station',
        x: x,
        y: y,
        elevation: elevation,
        transit_type: transitType,
        name: `${transitType.replace('_', ' ').toUpperCase()} Station ${stationIndex + 1}`,
        passenger_capacity: 300 + Math.random() * 700,
        daily_passengers: Math.random() * 5000,
        platforms: transitType === 'bullet_train' ? 2 : 1
      };

      stations.push(station);
      transit.push(station);
    }

    // Create track segments between stations
    for (let i = 0; i < stations.length - 1; i++) {
      const startStation = stations[i];
      const endStation = stations[i + 1];

      // Create smooth curved path between stations
      const pathPoints: [number, number][] = [];
      const segments = 5; // Number of curve segments

      for (let seg = 0; seg <= segments; seg++) {
        const t = seg / segments;

        // Bezier curve for smooth transitions
        const controlX = (startStation.x + endStation.x) / 2;
        const controlY = (startStation.y + endStation.y) / 2;

        // Add curve deviation
        const deviation = 20 + Math.random() * 30;
        const perpX = -(endStation.y - startStation.y);
        const perpY = (endStation.x - startStation.x);
        const length = Math.sqrt(perpX * perpX + perpY * perpY);

        if (length > 0) {
          const curveX = controlX + (perpX / length) * deviation * Math.sin(t * Math.PI);
          const curveY = controlY + (perpY / length) * deviation * Math.sin(t * Math.PI);

          const x = startStation.x * (1 - t) * (1 - t) +
                   2 * curveX * (1 - t) * t +
                   endStation.x * t * t;
          const y = startStation.y * (1 - t) * (1 - t) +
                   2 * curveY * (1 - t) * t +
                   endStation.y * t * t;

          pathPoints.push([x, y]);
        } else {
          // Fallback to straight line
          const x = startStation.x + (endStation.x - startStation.x) * t;
          const y = startStation.y + (endStation.y - startStation.y) * t;
          pathPoints.push([x, y]);
        }
      }

      transit.push({
        id: `${lineId}_track_${i}`,
        type: 'track',
        path: pathPoints,
        width: transitType === 'bullet_train' ? 6 : 4,
        elevation: elevation,
        transit_type: transitType,
        length: Math.sqrt(
          Math.pow(endStation.x - startStation.x, 2) +
          Math.pow(endStation.y - startStation.y, 2)
        ),
        max_speed: getMaxSpeed(transitType),
        capacity: getTrainCapacity(transitType),
        frequency: 5 + Math.random() * 10 // minutes between trains
      });
    }
  }

  return transit;
}

function getMaxSpeed(transitType: string): number {
  switch (transitType) {
    case 'monorail': return 80;
    case 'light_rail': return 60;
    case 'bullet_train': return 200;
    case 'maglev': return 300;
    default: return 50;
  }
}

function getTrainCapacity(transitType: string): number {
  switch (transitType) {
    case 'monorail': return 200;
    case 'light_rail': return 300;
    case 'bullet_train': return 800;
    case 'maglev': return 400;
    default: return 150;
  }
}