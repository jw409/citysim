import { PathLayer, ScatterplotLayer } from '@deck.gl/layers';
import { LAYER_DEFINITIONS } from '../../types/layers';

export function createSubwayLayer(subwayData: any[]) {
  const layerConfig = LAYER_DEFINITIONS.subway_tunnels;

  const tunnels = subwayData.filter(d => d.type === 'tunnel');
  const stations = subwayData.filter(d => d.type === 'station');

  return [
    // Subway tunnels
    new PathLayer({
      id: 'subway_tunnels',
      data: tunnels,
      getPath: (d: any) => d.path || d.coordinates,
      getWidth: (d: any) => d.width || 4,
      getColor: (d: any) => {
        // Color by subway line
        const lineColors: Record<string, [number, number, number, number]> = {
          'red': [255, 0, 0, 220],
          'blue': [0, 100, 255, 220],
          'green': [0, 200, 0, 220],
          'yellow': [255, 200, 0, 220],
          'purple': [150, 0, 200, 220],
          'orange': [255, 150, 0, 220]
        };
        return lineColors[d.line_color] || layerConfig.color;
      },
      opacity: layerConfig.opacity,
      pickable: true,
      widthMinPixels: 3,
      widthMaxPixels: 15,
      getElevation: (d: any) => d.elevation || -15,
      extruded: true,
      material: {
        ambient: 0.3,
        diffuse: 0.7,
        shininess: 64,
        specularColor: [200, 200, 200]
      },
      transitions: {
        getColor: 800,
        getWidth: 400
      }
    }),

    // Subway stations
    new ScatterplotLayer({
      id: 'subway_stations',
      data: stations,
      getPosition: (d: any) => [d.x || d.longitude, d.y || d.latitude, d.elevation || -12],
      getRadius: (d: any) => d.size || 15,
      getFillColor: [255, 200, 100, 200],
      getLineColor: [0, 0, 0, 100],
      getLineWidth: 2,
      pickable: true,
      radiusMinPixels: 8,
      radiusMaxPixels: 30,
      material: {
        ambient: 0.4,
        diffuse: 0.8,
        shininess: 32
      }
    })
  ];
}

export function generateSubwaySystem(bounds: any, lineCount: number = 4): any[] {
  const subway: any[] = [];
  const { min_x, min_y, max_x, max_y } = bounds;
  const lineColors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

  for (let lineIndex = 0; lineIndex < lineCount; lineIndex++) {
    const lineColor = lineColors[lineIndex % lineColors.length];
    const lineId = `line_${lineColor}`;

    // Create main line path
    const stationCount = 8 + Math.floor(Math.random() * 5);
    const stations: any[] = [];

    // Generate stations along the line
    for (let stationIndex = 0; stationIndex < stationCount; stationIndex++) {
      const progress = stationIndex / (stationCount - 1);

      // Create varied path (not just straight line)
      const baseX = min_x + progress * (max_x - min_x);
      const baseY = min_y + progress * (max_y - min_y);

      // Add some curvature
      const offsetX = Math.sin(progress * Math.PI * 2) * (max_x - min_x) * 0.1;
      const offsetY = Math.cos(progress * Math.PI * 1.5) * (max_y - min_y) * 0.1;

      const station = {
        id: `${lineId}_station_${stationIndex}`,
        type: 'station',
        x: baseX + offsetX,
        y: baseY + offsetY,
        elevation: -12,
        line_color: lineColor,
        name: `${lineColor.charAt(0).toUpperCase() + lineColor.slice(1)} Line Station ${stationIndex + 1}`,
        passenger_capacity: 500 + Math.random() * 1000,
        daily_passengers: Math.random() * 10000
      };

      stations.push(station);
      subway.push(station);
    }

    // Create tunnel segments between stations
    for (let i = 0; i < stations.length - 1; i++) {
      const startStation = stations[i];
      const endStation = stations[i + 1];

      subway.push({
        id: `${lineId}_tunnel_${i}`,
        type: 'tunnel',
        path: [
          [startStation.x, startStation.y],
          [endStation.x, endStation.y]
        ],
        width: 4,
        elevation: -15,
        line_color: lineColor,
        length: Math.sqrt(
          Math.pow(endStation.x - startStation.x, 2) +
          Math.pow(endStation.y - startStation.y, 2)
        ),
        capacity: 2000,
        current_load: Math.random() * 1500
      });
    }

    // Add transfer tunnels between lines occasionally
    if (lineIndex > 0 && Math.random() > 0.5) {
      const currentLineStations = stations;
      const previousLineStations = subway
        .filter(d => d.type === 'station' && d.line_color === lineColors[lineIndex - 1]);

      if (previousLineStations.length > 0) {
        const currentStation = currentLineStations[Math.floor(Math.random() * currentLineStations.length)];
        const previousStation = previousLineStations[Math.floor(Math.random() * previousLineStations.length)];

        subway.push({
          id: `transfer_${lineColor}_${lineColors[lineIndex - 1]}`,
          type: 'tunnel',
          path: [
            [currentStation.x, currentStation.y],
            [previousStation.x, previousStation.y]
          ],
          width: 3,
          elevation: -13,
          line_color: 'transfer',
          is_transfer: true
        });
      }
    }
  }

  return subway;
}