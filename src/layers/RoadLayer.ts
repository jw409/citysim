import { PathLayer } from '@deck.gl/layers';
import { getTimeBasedColors } from '../utils/colorSchemes';
import { convertPointsToLatLng } from '../utils/coordinates';

export function createRoadLayer(roads: any[], timeOfDay: number = 12) {
  const colors = getTimeBasedColors(timeOfDay);

  return new PathLayer({
    id: 'roads',
    data: roads,
    getPath: (d: any) => d.path ? convertPointsToLatLng(d.path) : [],
    getWidth: (d: any) => getRoadWidth(d.type, d.width),
    getColor: (d: any) => getRoadColor(d.type, d.id, colors),
    widthUnits: 'meters',
    widthScale: 1,
    widthMinPixels: 2,
    widthMaxPixels: 25,
    pickable: true,
    capRounded: true,
    jointRounded: true,
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