import { HexagonLayer } from '@deck.gl/aggregation-layers';

export interface HexagonDataPoint {
  position: [number, number];
  value: number;
  category?: string;
}

export function createHexagonLayer(data: HexagonDataPoint[], options: {
  radius?: number;
  elevationScale?: number;
  colorRange?: number[][];
  coverage?: number;
  visible?: boolean;
} = {}) {
  const {
    radius = 100,
    elevationScale = 50,
    colorRange = [
      [255, 255, 178, 180],
      [254, 217, 118, 180],
      [254, 178, 76, 180],
      [253, 141, 60, 180],
      [240, 59, 32, 180],
      [189, 0, 38, 180]
    ],
    coverage = 0.8,
    visible = true
  } = options;

  return new HexagonLayer({
    id: 'hexagon-layer',
    data,
    visible,
    pickable: true,
    extruded: true,
    radius,
    elevationScale,
    coverage,
    colorRange,
    getPosition: (d: HexagonDataPoint) => d.position,
    getWeight: (d: HexagonDataPoint) => d.value,
    material: {
      ambient: 0.3,
      diffuse: 0.6,
      shininess: 32,
      specularColor: [255, 255, 255]
    },
    transitions: {
      elevationScale: 1000
    }
  });
}

// Generate sample data for urban density visualization
export function generateUrbanDensityData(centerLat: number, centerLng: number, count: number = 500): HexagonDataPoint[] {
  const data: HexagonDataPoint[] = [];

  for (let i = 0; i < count; i++) {
    // Create clusters around urban centers
    const clusterCenters = [
      [centerLng - 0.01, centerLat + 0.005],  // Downtown cluster
      [centerLng + 0.005, centerLat - 0.01],  // Residential cluster
      [centerLng - 0.005, centerLat - 0.005], // Commercial cluster
      [centerLng + 0.01, centerLat + 0.01]    // Industrial cluster
    ];

    const cluster = clusterCenters[Math.floor(Math.random() * clusterCenters.length)];
    const spread = 0.008;

    const position: [number, number] = [
      cluster[0] + (Math.random() - 0.5) * spread,
      cluster[1] + (Math.random() - 0.5) * spread
    ];

    // Weight based on distance from cluster center
    const distanceFromCenter = Math.sqrt(
      Math.pow(position[0] - cluster[0], 2) +
      Math.pow(position[1] - cluster[1], 2)
    );

    const baseWeight = Math.max(0.1, 1 - (distanceFromCenter / spread) * 2);
    const weight = baseWeight + Math.random() * 0.5;

    data.push({
      position,
      value: weight * 10,
      category: i % 4 === 0 ? 'high' : i % 3 === 0 ? 'medium' : 'low'
    });
  }

  return data;
}

// Generate traffic flow data
export function generateTrafficData(centerLat: number, centerLng: number): HexagonDataPoint[] {
  const data: HexagonDataPoint[] = [];

  // Create traffic hotspots along major "roads"
  const roadNetworks = [
    // Horizontal roads
    { start: [centerLng - 0.015, centerLat], end: [centerLng + 0.015, centerLat] },
    { start: [centerLng - 0.015, centerLat + 0.008], end: [centerLng + 0.015, centerLat + 0.008] },
    { start: [centerLng - 0.015, centerLat - 0.008], end: [centerLng + 0.015, centerLat - 0.008] },

    // Vertical roads
    { start: [centerLng, centerLat - 0.015], end: [centerLng, centerLat + 0.015] },
    { start: [centerLng + 0.008, centerLat - 0.015], end: [centerLng + 0.008, centerLat + 0.015] },
    { start: [centerLng - 0.008, centerLat - 0.015], end: [centerLng - 0.008, centerLat + 0.015] }
  ];

  roadNetworks.forEach(road => {
    const points = 20;
    for (let i = 0; i < points; i++) {
      const t = i / (points - 1);
      const lng = road.start[0] + t * (road.end[0] - road.start[0]);
      const lat = road.start[1] + t * (road.end[1] - road.start[1]);

      // Add some random offset
      const offset = 0.0005;
      const position: [number, number] = [
        lng + (Math.random() - 0.5) * offset,
        lat + (Math.random() - 0.5) * offset
      ];

      // Traffic intensity varies along roads (higher at intersections)
      const distanceFromCenter = Math.abs(t - 0.5);
      const intersectionBonus = 1 - distanceFromCenter * 2;
      const baseTraffic = 2 + intersectionBonus * 3;
      const traffic = baseTraffic + Math.random() * 2;

      data.push({
        position,
        value: traffic,
        category: 'traffic'
      });
    }
  });

  return data;
}