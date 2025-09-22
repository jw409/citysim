import { PolygonLayer } from '@deck.gl/layers';
import { getTimeBasedColors } from '../utils/colorSchemes';
import { convertPointsToLatLng } from '../utils/coordinates';

export function createBuildingLayer(buildings: any[], timeOfDay: number = 12) {
  const colors = getTimeBasedColors(timeOfDay);

  console.log(`Creating building layer with ${buildings.length} buildings.`);

  // Debug: Log a few buildings to check their data
  if (buildings.length > 0) {
    const samples = buildings.slice(0, 5);
    console.log('=== BUILDING HEIGHT DEBUG ===');
    samples.forEach((b, i) => {
      console.log(`Building ${i}: ID=${b.id}, height=${b.height}, footprint=${Array.isArray(b.footprint) ? b.footprint.length + ' points' : 'invalid'}`);
      if (i === 0 && Array.isArray(b.footprint)) {
        console.log(`  First footprint sample: ${JSON.stringify(b.footprint.slice(0, 2))}`);
      }
    });
    console.log('===========================');
  }

  return new PolygonLayer({
    id: 'buildings',
    data: buildings,

    // Convert footprint from {x,y} objects to [lng,lat] arrays
    getPolygon: (d: any) => {
      if (!d.footprint || !Array.isArray(d.footprint)) return null;

      // Convert from {x, y} objects to [lng, lat] arrays for deck.gl
      if (d.footprint.length > 0 && typeof d.footprint[0] === 'object' && 'x' in d.footprint[0]) {
        const converted = convertPointsToLatLng(d.footprint);
        console.log(`Converting building ${d.id} footprint: ${d.footprint.length} points -> lat/lng`);
        return converted;
      }

      // If already in [lng, lat] format, return as-is
      if (Array.isArray(d.footprint[0])) {
        return d.footprint;
      }

      console.warn('Invalid footprint format for building:', d.id, d.footprint);
      return null;
    },

    // DIRECTLY use the height property
    getElevation: (d: any) => {
      const height = d.height || 0;
      console.log(`getElevation called: Building ${d.id} height=${height}`);
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
    elevationScale: 20.0, // MASSIVE scale to test if elevation works at all
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

