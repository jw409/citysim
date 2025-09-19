import { PathLayer } from '@deck.gl/layers';
import { LAYER_DEFINITIONS } from '../../types/layers';

export function createSewerLayer(sewerData: any[]) {
  const layerConfig = LAYER_DEFINITIONS.sewer_system;

  return new PathLayer({
    id: 'sewer_system',
    data: sewerData,
    getPath: (d: any) => d.path || d.coordinates,
    getWidth: (d: any) => d.diameter || 2,
    getColor: layerConfig.color,
    opacity: layerConfig.opacity,
    pickable: true,
    widthMinPixels: 2,
    widthMaxPixels: 10,
    // Position sewers underground
    getElevation: (d: any) => d.elevation || -15,
    extruded: true,
    material: {
      ambient: 0.1,
      diffuse: 0.4,
      shininess: 16,
      specularColor: [100, 60, 40],
    },
    transitions: {
      getColor: 500,
      getWidth: 300,
    },
  });
}

// Generate sample sewer data if none provided
export function generateSewerNetwork(bounds: any, density: number = 0.5): any[] {
  const sewers: any[] = [];
  const { min_x, min_y, max_x, max_y } = bounds;

  // Create main sewer lines following a grid pattern
  const gridSpacing = (max_x - min_x) / 10;

  for (let x = min_x; x <= max_x; x += gridSpacing) {
    sewers.push({
      id: `sewer_main_ns_${x}`,
      path: [
        [x, min_y],
        [x, max_y],
      ],
      diameter: 3,
      elevation: -18,
      type: 'main',
      flow_rate: Math.random() * 100,
    });
  }

  for (let y = min_y; y <= max_y; y += gridSpacing) {
    sewers.push({
      id: `sewer_main_ew_${y}`,
      path: [
        [min_x, y],
        [max_x, y],
      ],
      diameter: 3,
      elevation: -18,
      type: 'main',
      flow_rate: Math.random() * 100,
    });
  }

  // Add secondary branches
  for (let i = 0; i < density * 50; i++) {
    const startX = min_x + Math.random() * (max_x - min_x);
    const startY = min_y + Math.random() * (max_y - min_y);
    const endX = startX + (Math.random() - 0.5) * gridSpacing;
    const endY = startY + (Math.random() - 0.5) * gridSpacing;

    sewers.push({
      id: `sewer_branch_${i}`,
      path: [
        [startX, startY],
        [endX, endY],
      ],
      diameter: 1.5,
      elevation: -12,
      type: 'branch',
      flow_rate: Math.random() * 20,
    });
  }

  return sewers;
}
