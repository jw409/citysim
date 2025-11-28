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
      console.log(
        `Building ${i}: ID=${b.id}, height=${b.height}, footprint=${Array.isArray(b.footprint) ? b.footprint.length + ' points' : 'invalid'}`
      );
      if (i === 0 && Array.isArray(b.footprint)) {
        console.log(`  First footprint sample: ${JSON.stringify(b.footprint.slice(0, 2))}`);
      }
    });
    console.log('===========================');
  }

  return new PolygonLayer({
    id: 'buildings',
    data: buildings,
    coordinateSystem: 2, // COORDINATE_SYSTEM.METER_OFFSETS to match terrain
    coordinateOrigin: [-74.006, 40.7128, 0], // NYC center - same as terrain

    // Keep footprint in meter coordinates (don't convert to lat/lng)
    getPolygon: (d: any) => {
      if (!d.footprint || !Array.isArray(d.footprint)) return null;

      // If footprint has {x, y} objects, convert to [x, y] arrays (meters)
      if (d.footprint.length > 0 && typeof d.footprint[0] === 'object' && 'x' in d.footprint[0]) {
        return d.footprint.map((p: any) => [p.x, p.y]);
      }

      // If already in [x, y] format, return as-is (meters)
      if (Array.isArray(d.footprint[0])) {
        return d.footprint;
      }

      console.warn('Invalid footprint format for building:', d.id, d.footprint);
      return null;
    },

    // Building height (not including terrain offset)
    getElevation: (d: any) => d.height || 0,

    // Terrain elevation offset - this raises buildings to sit ON the terrain
    getElevationOffset: (d: any) => Math.max(0, d.terrain_height || 0),

    getFillColor: (d: any) => {
      const buildingType = getBuildingType(d);
      const color = colors.buildings[buildingType] || colors.buildings.residential;
      // Ensure full opacity and valid color format
      if (Array.isArray(color) && color.length >= 3) {
        return [color[0], color[1], color[2], 255]; // Force alpha to 255
      }
      // Realistic building colors with variation
      const buildingId = d.id || '';
      const hashCode = buildingId.split('').reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0);
      const variation = Math.abs(hashCode) % 40; // 0-40 variation

      switch (buildingType) {
        case 'office':
          // Office buildings: glass, steel, concrete variations
          return [
            Math.min(255, 120 + variation), // Blue-gray glass
            Math.min(255, 140 + variation),
            Math.min(255, 200 + variation),
            255,
          ];
        case 'commercial':
          // Commercial: muted brick, stucco, painted variations
          return [
            Math.min(255, 140 + variation), // More muted brick/stucco tones
            Math.min(255, 110 + variation),
            Math.min(255, 90 + variation),
            255,
          ];
        case 'residential':
          // Residential: muted house colors
          return [
            Math.min(255, 160 + variation), // More muted residential colors
            Math.min(255, 150 + variation),
            Math.min(255, 130 + variation),
            255,
          ];
        case 'industrial':
          // Industrial: metal, concrete
          return [
            Math.min(255, 140 + variation), // Industrial gray/metal
            Math.min(255, 140 + variation),
            Math.min(255, 140 + variation),
            255,
          ];
        default:
          return [
            Math.min(255, 160 + variation), // Mixed development
            Math.min(255, 160 + variation),
            Math.min(255, 160 + variation),
            255,
          ];
      }
    },
    getLineColor: [255, 255, 255, 255],
    getLineWidth: 1, // Thinner lines for more detailed building outlines
    extruded: true,
    wireframe: false, // Disable wireframe for solid buildings
    filled: true,
    stroked: true,
    elevationScale: 1.0, // Realistic 1:1 scale - buildings already have proper heights in meters
    getElevationValue: (d: any) => d.height || 0, // Alternative elevation accessor
    elevationRange: [0, 3000], // Set max elevation range
    pickable: false, // PERF: Disabled to prevent picking overhead on interaction
    material: {
      ambient: 0.35, // Slightly lower ambient for more contrast
      diffuse: 0.8, // Higher diffuse for better surface definition
      shininess: 64, // Higher shininess for more realistic surfaces
      specularColor: [80, 80, 80], // More prominent specular highlights
    },
    // Add more realistic building appearance
    lightSettings: {
      lightsPosition: [-74.006, 40.7128, 8000, -74.006, 40.7128, 8000], // NYC coordinates
      ambientRatio: 0.4,
      diffuseRatio: 0.6,
      specularRatio: 0.2,
      lightsStrength: [0.8, 0.0, 0.8, 0.0],
      numberOfLights: 2,
    },
  });
}

// Helper function to determine building type (can be kept as is)
function getBuildingType(building: any): string {
  // Map numeric types from generator to color scheme names
  // From generate_city.cjs: 0=HOUSE, 2=OFFICE_BUILDING, 3=STORE, 4=WAREHOUSE
  if (typeof building.type === 'number') {
    switch (building.type) {
      case 0:
        return 'residential'; // HOUSE
      case 2:
        return 'office'; // OFFICE_BUILDING
      case 3:
        return 'commercial'; // STORE
      case 4:
        return 'industrial'; // WAREHOUSE
      default:
        break;
    }
  }

  // Fallback to height-based determination if type is missing/invalid
  const height = building.height || 0;
  if (height > 200) return 'office';
  if (height > 100) return 'commercial';
  if (height > 50) return 'industrial';
  return 'residential';
}
