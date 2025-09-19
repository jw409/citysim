import { PolygonLayer } from '@deck.gl/layers';
import { getTimeBasedColors } from '../utils/colorSchemes';
import { convertPointsToLatLng } from '../utils/coordinates';

export function createBuildingLayer(buildings: any[], timeOfDay: number = 12) {
  const colors = getTimeBasedColors(timeOfDay);

  return new PolygonLayer({
    id: 'buildings',
    data: buildings,
    getPolygon: (d: any) => d.footprint ? convertPointsToLatLng(d.footprint) : [],
    getElevation: (d: any) => d.height || 10,
    getFillColor: (d: any) => {
      const buildingType = getBuildingTypeName(d.building_type);
      return colors.buildings[buildingType] || colors.buildings.residential;
    },
    getLineColor: [0, 0, 0, 100],
    getLineWidth: 1,
    extruded: true,
    wireframe: false,
    filled: true,
    stroked: true,
    pickable: true,
    material: {
      ambient: 0.2,
      diffuse: 0.6,
      shininess: 32,
      specularColor: [255, 255, 255],
    },
    transitions: {
      getFillColor: 1000,
      getElevation: 500,
    },
  });
}

function getBuildingTypeName(buildingType: number): string {
  const types = ['residential', 'residential', 'office', 'commercial', 'industrial'];
  return types[buildingType] || 'residential';
}