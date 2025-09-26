import { PathLayer } from '@deck.gl/layers';
import { LAYER_DEFINITIONS } from '../../types/layers';

export function createSkyBridgeLayer(bridgeData: any[]) {
  const layerConfig = LAYER_DEFINITIONS.sky_bridges;

  return new PathLayer({
    id: 'sky_bridges',
    data: bridgeData,
    getPath: (d: any) => d.path, // Path coordinates already converted by convertAllCoordinates
    getWidth: (d: any) => d.width || 3,
    getColor: (d: any) => {
      // Color by bridge type
      switch (d.bridge_type) {
        case 'pedestrian': return [200, 200, 255, 220];
        case 'enclosed': return [180, 180, 220, 240];
        case 'glass': return [150, 200, 255, 180];
        default: return layerConfig.color;
      }
    },
    opacity: layerConfig.opacity,
    pickable: true,
    widthMinPixels: 2,
    widthMaxPixels: 12,
    getElevation: (d: any) => d.elevation || 25,
    extruded: true,
    material: {
      ambient: 0.4,
      diffuse: 0.8,
      shininess: 64,
      specularColor: [255, 255, 255]
    },
    transitions: {
      getColor: 600,
      getWidth: 400
    }
  });
}

export function generateSkyBridges(buildings: any[], density: number = 0.2): any[] {
  const bridges: any[] = [];

  // Find tall buildings that could have sky bridges
  const tallBuildings = buildings.filter(b => (b.height || 0) > 20);

  for (let i = 0; i < tallBuildings.length; i++) {
    for (let j = i + 1; j < tallBuildings.length; j++) {
      const building1 = tallBuildings[i];
      const building2 = tallBuildings[j];

      if (!building1.footprint || !building2.footprint) continue;

      // Calculate distance between buildings
      const center1 = calculateBuildingCenter(building1.footprint);
      const center2 = calculateBuildingCenter(building2.footprint);
      const distance = Math.sqrt(
        Math.pow(center2.x - center1.x, 2) + Math.pow(center2.y - center1.y, 2)
      );

      // Only connect nearby buildings
      if (distance < 100 && distance > 10 && Math.random() < density) {
        const minHeight = Math.min(building1.height || 0, building2.height || 0);
        const bridgeHeight = Math.max(20, minHeight * 0.7);

        bridges.push({
          id: `bridge_${building1.id || i}_${building2.id || j}`,
          start_x: center1.x,
          start_y: center1.y,
          end_x: center2.x,
          end_y: center2.y,
          elevation: bridgeHeight,
          width: 3 + Math.random() * 2,
          bridge_type: ['pedestrian', 'enclosed', 'glass'][Math.floor(Math.random() * 3)],
          length: distance,
          building_1: building1.id || i,
          building_2: building2.id || j,
          capacity: 50 + Math.random() * 100,
          daily_users: Math.random() * 500
        });
      }
    }
  }

  return bridges;
}

function calculateBuildingCenter(footprint: any[]): { x: number; y: number } {
  if (footprint.length === 0) return { x: 0, y: 0 };

  const sum = footprint.reduce(
    (acc, point) => ({
      x: acc.x + (point.x || 0),
      y: acc.y + (point.y || 0)
    }),
    { x: 0, y: 0 }
  );

  return {
    x: sum.x / footprint.length,
    y: sum.y / footprint.length
  };
}