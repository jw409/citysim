import { PathLayer } from '@deck.gl/layers';
import { getTimeBasedColors } from '../utils/colorSchemes';
import { convertPointsToLatLng } from '../utils/coordinates';

// Terrain height calculation - same as TerrainLayer for consistency
function noise(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return (n - Math.floor(n));
}

function getTerrainHeightAt(x: number, y: number): number {
  const scale1 = 0.0003; // Very large terrain features
  const scale2 = 0.0015; // Medium terrain features
  const scale3 = 0.006;  // Fine terrain details

  const noise1 = noise(x * scale1, y * scale1) * 20;
  const noise2 = noise(x * scale2, y * scale2) * 12;
  const noise3 = noise(x * scale3, y * scale3) * 4;

  // Same 3 hills as terrain
  const hill1CenterX = 2500, hill1CenterY = 2000;
  const hill2CenterX = -3000, hill2CenterY = -1500;
  const hill3CenterX = 1000, hill3CenterY = -3500;

  const dist1 = Math.sqrt((x - hill1CenterX) * (x - hill1CenterX) + (y - hill1CenterY) * (y - hill1CenterY));
  const dist2 = Math.sqrt((x - hill2CenterX) * (x - hill2CenterX) + (y - hill2CenterY) * (y - hill2CenterY));
  const dist3 = Math.sqrt((x - hill3CenterX) * (x - hill3CenterX) + (y - hill3CenterY) * (y - hill3CenterY));

  const hillRadius = 2200;
  const hill1Height = Math.max(0, 180 * Math.exp(-Math.pow(dist1 / hillRadius, 2)));
  const hill2Height = Math.max(0, 200 * Math.exp(-Math.pow(dist2 / hillRadius, 2)));
  const hill3Height = Math.max(0, 160 * Math.exp(-Math.pow(dist3 / hillRadius, 2)));

  const hillNoise1 = hill1Height > 5 ? noise(x * 0.002, y * 0.002) * hill1Height * 0.15 : 0;
  const hillNoise2 = hill2Height > 5 ? noise(x * 0.002 + 100, y * 0.002 + 100) * hill2Height * 0.15 : 0;
  const hillNoise3 = hill3Height > 5 ? noise(x * 0.002 + 200, y * 0.002 + 200) * hill3Height * 0.15 : 0;

  const hills = hill1Height + hill2Height + hill3Height + hillNoise1 + hillNoise2 + hillNoise3;
  const baseTerrain = noise1 + noise2 + noise3;
  const totalElevation = baseTerrain * 0.3 + hills;

  const distanceFromCenter = Math.sqrt(x * x + y * y);
  const flatteningFactor = Math.max(0.7, 1 - (distanceFromCenter / 10000));

  return totalElevation * flatteningFactor;
}

export function createRoadLayer(roads: any[], timeOfDay: number = 12) {
  const colors = getTimeBasedColors(timeOfDay);

  return new PathLayer({
    id: 'roads',
    data: roads,
    coordinateSystem: 2, // COORDINATE_SYSTEM.METER_OFFSETS to match buildings/terrain
    coordinateOrigin: [-74.0060, 40.7128, 0], // NYC center
    getPath: (d: any) => {
      if (!d.path) return [];

      // Add terrain elevation to each road point
      return d.path.map((point: any) => {
        const terrainHeight = getTerrainHeightAt(point.x, point.y);
        const roadElevation = terrainHeight + 0.5; // Roads sit 0.5m above terrain
        return [point.x, point.y, roadElevation];
      });
    },
    getWidth: (d: any) => getRoadWidth(d.type, d.width),
    getColor: (d: any) => getRoadColor(d.type, d.id, colors),
    widthUnits: 'meters',
    widthScale: 1,
    widthMinPixels: 2,
    widthMaxPixels: 25,
    pickable: true,
    capRounded: true,
    jointRounded: true,
    billboard: false, // Allow 3D roads to follow terrain
    transitions: {
      getColor: 1000,
      getWidth: 500,
    },
  });
}

// Professional road width hierarchy
function getRoadWidth(roadType: number, originalWidth?: number): number {
  switch (roadType) {
    case 0: // HIGHWAY
      return 20; // Wide highways
    case 1: // ARTERIAL
      return 12; // Medium arterials
    case 2: // COLLECTOR (including bridges)
      return 10; // Collector roads and bridges
    case 3: // LOCAL
      return 6; // Narrow local streets
    default:
      return originalWidth || 6;
  }
}

// Professional road colors with hierarchy
function getRoadColor(roadType: number, roadId: string, colors: any): number[] {
  // Check if this is a bridge (has bridge in ID)
  const isBridge = roadId && roadId.includes('bridge');

  switch (roadType) {
    case 0: // HIGHWAY
      return isBridge ? [70, 70, 80] : [45, 45, 45]; // Dark asphalt, bridges slightly blue-gray
    case 1: // ARTERIAL
      return isBridge ? [80, 80, 90] : [60, 60, 60]; // Medium gray
    case 2: // COLLECTOR (includes bridges)
      return isBridge ? [90, 90, 100] : [75, 75, 75]; // Light gray, bridges more blue
    case 3: // LOCAL
      return [95, 95, 95]; // Light local streets
    default:
      return colors.roads.local || [128, 128, 128];
  }
}

function getRoadTypeName(roadType: number): string {
  const types = ['highway', 'arterial', 'local', 'local'];
  return types[roadType] || 'local';
}