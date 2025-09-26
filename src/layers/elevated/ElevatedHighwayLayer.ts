import { PathLayer } from '@deck.gl/layers';
import { LAYER_DEFINITIONS } from '../../types/layers';

export function createElevatedHighwayLayer(highwayData: any[]) {
  const layerConfig = LAYER_DEFINITIONS.elevated_highways;

  return new PathLayer({
    id: 'elevated_highways',
    data: highwayData,
    getPath: (d: any) => d.path || d.coordinates,
    getWidth: (d: any) => d.width || 8,
    getColor: (d: any) => {
      // Color by traffic density
      const traffic = d.traffic_density || 0;
      if (traffic > 0.8) return [255, 0, 0, 230]; // Red for heavy traffic
      if (traffic > 0.5) return [255, 165, 0, 230]; // Orange for moderate
      return layerConfig.color; // Gray for light traffic
    },
    opacity: layerConfig.opacity,
    pickable: true,
    widthMinPixels: 4,
    widthMaxPixels: 20,
    getElevation: (d: any) => d.elevation || 35,
    extruded: true,
    material: {
      ambient: 0.3,
      diffuse: 0.7,
      shininess: 48,
      specularColor: [200, 200, 200]
    },
    transitions: {
      getColor: 500,
      getWidth: 300
    }
  });
}

export function generateElevatedHighways(bounds: any, density: number = 0.4): any[] {
  const highways: any[] = [];
  const { min_x, min_y, max_x, max_y } = bounds;

  // Major elevated highways (ring roads and cross-city routes)
  const centerX = (min_x + max_x) / 2;
  const centerY = (min_y + max_y) / 2;
  const radius = Math.min(max_x - min_x, max_y - min_y) * 0.4;

  // Ring highway
  const ringPoints: [number, number][] = [];
  for (let angle = 0; angle < 2 * Math.PI; angle += Math.PI / 8) {
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    ringPoints.push([x, y]);
  }
  ringPoints.push(ringPoints[0]); // Close the ring

  highways.push({
    id: 'ring_highway',
    path: ringPoints,
    width: 12,
    elevation: 40,
    lanes: 6,
    speed_limit: 80,
    traffic_density: 0.3 + Math.random() * 0.4,
    type: 'ring'
  });

  // Shorter central highways (limit to 3km to prevent planetary artifacts)
  const maxHighwayLength = 3000;
  highways.push({
    id: 'highway_ns',
    path: [[centerX, centerY - maxHighwayLength/2], [centerX, centerY + maxHighwayLength/2]],
    width: 10,
    elevation: 35,
    lanes: 4,
    speed_limit: 70,
    traffic_density: 0.4 + Math.random() * 0.3,
    type: 'arterial'
  });

  highways.push({
    id: 'highway_ew',
    path: [[centerX - maxHighwayLength/2, centerY], [centerX + maxHighwayLength/2, centerY]],
    width: 10,
    elevation: 35,
    lanes: 4,
    speed_limit: 70,
    traffic_density: 0.4 + Math.random() * 0.3,
    type: 'arterial'
  });

  // Connector ramps and local elevated roads
  for (let i = 0; i < density * 20; i++) {
    const startX = min_x + Math.random() * (max_x - min_x);
    const startY = min_y + Math.random() * (max_y - min_y);

    // Create curved path
    const pathPoints: [number, number][] = [];
    const segments = 3 + Math.floor(Math.random() * 4);

    for (let j = 0; j <= segments; j++) {
      const progress = j / segments;
      const distance = 200 + Math.random() * 300;
      const angle = Math.random() * 2 * Math.PI;

      const x = startX + Math.cos(angle) * distance * progress;
      const y = startY + Math.sin(angle) * distance * progress;

      // Add some curvature
      const curveOffset = Math.sin(progress * Math.PI) * 50;
      const curveX = x + Math.cos(angle + Math.PI/2) * curveOffset;
      const curveY = y + Math.sin(angle + Math.PI/2) * curveOffset;

      pathPoints.push([curveX, curveY]);
    }

    highways.push({
      id: `elevated_road_${i}`,
      path: pathPoints,
      width: 6,
      elevation: 30 + Math.random() * 20,
      lanes: 2,
      speed_limit: 50,
      traffic_density: Math.random() * 0.6,
      type: 'connector'
    });
  }

  return highways;
}