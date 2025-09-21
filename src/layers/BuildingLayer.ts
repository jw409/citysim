import { PolygonLayer } from '@deck.gl/layers';
import { getTimeBasedColors } from '../utils/colorSchemes';

export function createBuildingLayer(buildings: any[], timeOfDay: number = 12) {
  const colors = getTimeBasedColors(timeOfDay);

  console.log(`Creating building layer with ${buildings.length} buildings.`);

  return new PolygonLayer({
    id: 'buildings',
    data: buildings,

    // Ensure the footprint is a valid polygon array
    getPolygon: (d: any) => {
      if (!d.footprint) return null;
      // If footprint is already an array of coordinates, return it
      if (Array.isArray(d.footprint) && Array.isArray(d.footprint[0])) {
        return d.footprint;
      }
      // If it's a different format, try to convert it
      console.warn('Invalid footprint format for building:', d.id, d.footprint);
      return null;
    },

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

