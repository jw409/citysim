import { PolygonLayer } from '@deck.gl/layers';
import { getTimeBasedColors } from '../utils/colorSchemes';

export function createBuildingLayer(buildings: any[], timeOfDay: number = 12) {
  const colors = getTimeBasedColors(timeOfDay);

  console.log(`Creating building layer with ${buildings.length} buildings.`);

  return new PolygonLayer({
    id: 'buildings',
    data: buildings,

    // DIRECTLY use the footprint data, which is already in the correct format
    getPolygon: (d: any) => d.footprint,

    // DIRECTLY use the height property
    getElevation: (d: any) => d.height || 0,

    getFillColor: (d: any) => {
      const buildingType = getBuildingType(d);
      return colors.buildings[buildingType] || colors.buildings.residential;
    },
    getLineColor: [255, 255, 255, 255],
    getLineWidth: 2,
    extruded: true,
    wireframe: false,
    filled: true,
    stroked: true,
    elevationScale: 1.0, // Start with a 1.0 scale for baseline
    pickable: true,
    material: {
      ambient: 0.25,
      diffuse: 0.7,
      shininess: 256,
      specularColor: [255, 255, 255],
    },
  });
}

// Helper function to determine building type (can be kept as is)
function getBuildingType(building: any): string {
  if (building.type) {
    return String(building.type).toLowerCase();
  }
  const height = building.height || 0;
  if (height > 200) return 'office';
  if (height > 100) return 'commercial';
  return 'residential';
}

