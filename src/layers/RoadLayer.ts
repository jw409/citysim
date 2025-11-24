import { PathLayer } from '@deck.gl/layers';
import { getTimeBasedColors } from '../utils/colorSchemes';
import { convertPointsToLatLng } from '../utils/coordinates';

// Import terrain calculation from utilities
import { exponentialDecayHeight } from '../utils/coordinates';

// Simple noise function for terrain variation
function perlinNoise(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return (n - Math.floor(n)) * 2 - 1; // -1 to 1 range
}

// Terrain height calculation - matches current dramatic cliffside TerrainLayer
function getTerrainHeightAt(x: number, y: number): number {
  // Base terrain using multi-octave noise
  const noise1 = perlinNoise(x * 0.0008, y * 0.0008) * 35;
  const noise2 = perlinNoise(x * 0.0025, y * 0.0025) * 18;
  const noise3 = perlinNoise(x * 0.008, y * 0.008) * 8;
  const baseTerrain = noise1 + noise2 + noise3;

  // EXTREME CLIFFSIDE CITY - Same dramatic cliffs as TerrainLayer
  const hills = [
    { x: 7000, y: 0, height: 1600, radius: 4000 }, // Eastern cliff wall
    { x: -7000, y: 0, height: 1500, radius: 3800 }, // Western cliff wall
    { x: 0, y: 8000, height: 1400, radius: 4200 }, // Northern highlands
    { x: 4000, y: -6000, height: 1300, radius: 3600 }, // Southeast cliff
    { x: -4000, y: 6000, height: 1200, radius: 3400 }, // Northwest peaks
  ];

  let hillContribution = 0;
  for (const hill of hills) {
    const hillHeight = exponentialDecayHeight(x, y, hill.x, hill.y, hill.height, hill.radius, 1.8);
    if (hillHeight > 2) {
      // Add surface variation to hills
      const variation =
        perlinNoise(x * 0.001 + hill.x * 0.0001, y * 0.001 + hill.y * 0.0001) * hillHeight * 0.12;
      hillContribution += hillHeight + variation;
    } else {
      hillContribution += hillHeight;
    }
  }

  const totalElevation = baseTerrain + hillContribution;

  // Realistic urban core: cities are built on flat land
  const distanceFromCenter = Math.sqrt(x * x + y * y);

  // Ocean bay system - deep water channels
  const riverElevation = calculateRiverElevation(x, y);

  // Flat urban core (0-3km) like real cities
  if (distanceFromCenter < 3000) {
    const baseElevation = Math.max(-2, Math.min(2, totalElevation * 0.05));
    return Math.min(baseElevation, riverElevation);
  }

  // Suburban transition (3-6km)
  if (distanceFromCenter < 6000) {
    const suburbanFactor = (distanceFromCenter - 3000) / 3000;
    const suburbanElevation = totalElevation * (0.05 + suburbanFactor * 0.3);
    return Math.min(suburbanElevation, riverElevation);
  }

  // Rural areas with full elevation
  const ruralTransition = Math.min(1, (distanceFromCenter - 6000) / 2000);
  const flatteningFactor = 0.35 + ruralTransition * 0.65;
  const ruralElevation = totalElevation * flatteningFactor;

  return Math.min(ruralElevation, riverElevation);
}

// Ocean bay system calculation - matches TerrainLayer
function calculateRiverElevation(x: number, y: number): number {
  let minElevation = 1000;

  // Main ocean bay (east-west through center)
  const mainBayY = 0;
  const mainBayWidth = 1500;
  const mainBayDepth = 60;
  const distanceFromMainBay = Math.abs(y - mainBayY);
  if (distanceFromMainBay <= mainBayWidth / 2) {
    const normalizedDist = distanceFromMainBay / (mainBayWidth / 2);
    const depthFactor = 1 - normalizedDist * normalizedDist;
    const oceanElevation = -mainBayDepth * depthFactor;
    minElevation = Math.min(minElevation, oceanElevation);
  }

  // Northern fjord
  const northFjordY = 3500;
  const northFjordWidth = 800;
  const northFjordDepth = 40;
  const distanceFromNorthFjord = Math.abs(y - northFjordY);
  if (distanceFromNorthFjord <= northFjordWidth / 2) {
    const normalizedDist = distanceFromNorthFjord / (northFjordWidth / 2);
    const depthFactor = 1 - normalizedDist * normalizedDist;
    const fjordElevation = -northFjordDepth * depthFactor;
    minElevation = Math.min(minElevation, fjordElevation);
  }

  // Southern fjord
  const southFjordY = -3500;
  const southFjordWidth = 800;
  const southFjordDepth = 40;
  const distanceFromSouthFjord = Math.abs(y - southFjordY);
  if (distanceFromSouthFjord <= southFjordWidth / 2) {
    const normalizedDist = distanceFromSouthFjord / (southFjordWidth / 2);
    const depthFactor = 1 - normalizedDist * normalizedDist;
    const fjordElevation = -southFjordDepth * depthFactor;
    minElevation = Math.min(minElevation, fjordElevation);
  }

  // Eastern ocean inlet
  const eastInletX = 5000;
  const eastInletWidth = 600;
  const eastInletDepth = 35;
  const distanceFromEastInlet = Math.abs(x - eastInletX);
  if (distanceFromEastInlet <= eastInletWidth / 2) {
    const normalizedDist = distanceFromEastInlet / (eastInletWidth / 2);
    const depthFactor = 1 - normalizedDist * normalizedDist;
    const inletElevation = -eastInletDepth * depthFactor;
    minElevation = Math.min(minElevation, inletElevation);
  }

  return minElevation === 1000 ? 1000 : minElevation;
}

export function createRoadLayer(roads: any[], timeOfDay: number = 12) {
  const colors = getTimeBasedColors(timeOfDay);

  return new PathLayer({
    id: 'roads',
    data: roads,
    coordinateSystem: 2, // COORDINATE_SYSTEM.METER_OFFSETS to match buildings/terrain
    coordinateOrigin: [-74.006, 40.7128, 0], // NYC center
    getPath: (d: any) => {
      if (!d.path) return [];

      // Add terrain elevation to each road point
      return d.path.map((point: any) => {
        const terrainHeight = getTerrainHeightAt(point.x, point.y);
        const roadElevation = terrainHeight + 2.0; // Roads sit 2m above terrain for clear visibility
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
