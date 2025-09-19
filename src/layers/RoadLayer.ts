import { PathLayer } from '@deck.gl/layers';
import { getTimeBasedColors } from '../utils/colorSchemes';
import { convertPointsToLatLng } from '../utils/coordinates';

export function createRoadLayer(roads: any[], timeOfDay: number = 12) {
  const colors = getTimeBasedColors(timeOfDay);

  return new PathLayer({
    id: 'roads',
    data: roads,
    getPath: (d: any) => d.path ? convertPointsToLatLng(d.path) : [],
    getWidth: (d: any) => d.width || 6,
    getColor: (d: any) => {
      const roadType = getRoadTypeName(d.road_type);
      return colors.roads[roadType] || colors.roads.local;
    },
    widthUnits: 'meters',
    widthScale: 1,
    widthMinPixels: 1,
    widthMaxPixels: 20,
    pickable: true,
    capRounded: true,
    jointRounded: true,
    transitions: {
      getColor: 1000,
      getWidth: 500,
    },
  });
}

function getRoadTypeName(roadType: number): string {
  const types = ['highway', 'arterial', 'local', 'local'];
  return types[roadType] || 'local';
}