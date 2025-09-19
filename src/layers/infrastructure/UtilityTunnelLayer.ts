import { PathLayer } from '@deck.gl/layers';
import { LAYER_DEFINITIONS } from '../../types/layers';

export function createUtilityTunnelLayer(utilityData: any[]) {
  const layerConfig = LAYER_DEFINITIONS.utility_tunnels;

  return new PathLayer({
    id: 'utility_tunnels',
    data: utilityData,
    getPath: (d: any) => d.path || d.coordinates,
    getWidth: (d: any) => d.width || 1.5,
    getColor: (d: any) => {
      // Color by utility type
      switch (d.utility_type) {
        case 'power': return [255, 255, 0, 200]; // Yellow for power
        case 'water': return [0, 150, 255, 200]; // Blue for water
        case 'gas': return [255, 100, 0, 200]; // Orange for gas
        case 'telecom': return [128, 0, 255, 200]; // Purple for telecom
        default: return layerConfig.color;
      }
    },
    opacity: layerConfig.opacity,
    pickable: true,
    widthMinPixels: 1,
    widthMaxPixels: 8,
    getElevation: (d: any) => d.elevation || -8,
    extruded: true,
    material: {
      ambient: 0.2,
      diffuse: 0.6,
      shininess: 32,
      specularColor: [255, 255, 255]
    },
    transitions: {
      getColor: 500,
      getWidth: 300
    }
  });
}

export function generateUtilityNetwork(bounds: any, density: number = 0.8): any[] {
  const utilities: any[] = [];
  const { min_x, min_y, max_x, max_y } = bounds;
  const utilityTypes = ['power', 'water', 'gas', 'telecom'];

  // Create utility corridors along major axes
  utilityTypes.forEach((type, typeIndex) => {
    const spacing = (max_x - min_x) / 8;
    const depth = -5 - typeIndex * 2; // Stack utilities at different depths

    // North-South corridors
    for (let x = min_x + spacing/2; x < max_x; x += spacing) {
      utilities.push({
        id: `${type}_ns_${x}`,
        path: [[x, min_y], [x, max_y]],
        width: type === 'power' ? 2 : 1.5,
        elevation: depth,
        utility_type: type,
        capacity: Math.random() * 100,
        load: Math.random() * 80
      });
    }

    // East-West corridors
    for (let y = min_y + spacing/2; y < max_y; y += spacing) {
      utilities.push({
        id: `${type}_ew_${y}`,
        path: [[min_x, y], [max_x, y]],
        width: type === 'power' ? 2 : 1.5,
        elevation: depth,
        utility_type: type,
        capacity: Math.random() * 100,
        load: Math.random() * 80
      });
    }
  });

  // Add service connections
  for (let i = 0; i < density * 100; i++) {
    const type = utilityTypes[Math.floor(Math.random() * utilityTypes.length)];
    const startX = min_x + Math.random() * (max_x - min_x);
    const startY = min_y + Math.random() * (max_y - min_y);
    const endX = startX + (Math.random() - 0.5) * 50;
    const endY = startY + (Math.random() - 0.5) * 50;

    utilities.push({
      id: `${type}_service_${i}`,
      path: [[startX, startY], [endX, endY]],
      width: 0.8,
      elevation: -3,
      utility_type: type,
      capacity: Math.random() * 20,
      load: Math.random() * 15
    });
  }

  return utilities;
}