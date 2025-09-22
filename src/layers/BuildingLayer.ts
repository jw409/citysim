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
        // Footprint converted successfully
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
      if (height > 100) {
        console.trace(`Rendering tall building ${d.id} with height ${height}`);
      }
      return height;
    },

    getFillColor: (d: any) => {
      const buildingType = getBuildingType(d);
      const color = colors.buildings[buildingType] || colors.buildings.residential;
      // Ensure full opacity and valid color format
      if (Array.isArray(color) && color.length >= 3) {
        return [color[0], color[1], color[2], 255]; // Force alpha to 255
      }
      // Fallback colors based on building type
      switch (buildingType) {
        case 'office': return [70, 130, 180, 255]; // Steel blue
        case 'commercial': return [255, 140, 0, 255]; // Dark orange
        case 'residential': return [34, 139, 34, 255]; // Forest green
        default: return [128, 128, 128, 255]; // Gray
      }
    },
    getLineColor: [255, 255, 255, 255],
    getLineWidth: 2,
    extruded: true,
    wireframe: false,  // Disable wireframe for solid buildings
    filled: true,
    stroked: true,
    elevationScale: 1.0, // Realistic 1:1 scale - buildings already have proper heights in meters
    getElevationValue: (d: any) => d.height || 0, // Alternative elevation accessor
    elevationRange: [0, 3000], // Set max elevation range
    pickable: true,
    material: {
      ambient: 0.4,      // Moderate ambient lighting
      diffuse: 0.6,      // Balanced diffuse lighting
      shininess: 32,     // Lower shininess for softer look
      specularColor: [40, 40, 40], // Subtle specular highlights
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

