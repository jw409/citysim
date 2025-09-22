import { PolygonLayer } from '@deck.gl/layers';
import { getTimeBasedColors } from '../utils/colorSchemes';

export function createBuildingLayer(buildings: any[], timeOfDay: number = 12) {
  const colors = getTimeBasedColors(timeOfDay);

  console.log(`Creating building layer with ${buildings.length} buildings.`);

  // Debug: Log a few buildings to check their data
  if (buildings.length > 0) {
    console.log('Sample building data:', buildings.slice(0, 3).map(b => ({
      id: b.id,
      height: b.height,
      type: b.type,
      allProps: Object.keys(b),
      footprint: Array.isArray(b.footprint) ? `${b.footprint.length} points` : b.footprint
    })));
  }

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
    getElevation: (d: any) => {
      const height = d.height || 0;
      if (height > 0) {
        console.log(`Building ${d.id} height: ${height}`);
      }
      return height;
    },

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
    elevationScale: 1.0, // Start with baseline to debug
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

