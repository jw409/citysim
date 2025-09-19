import { PolygonLayer } from '@deck.gl/layers';
import { getTimeBasedColors } from '../utils/colorSchemes';
import { convertPointsToLatLng } from '../utils/coordinates';

export function createZoneLayer(zones: any[], timeOfDay: number = 12, visible: boolean = false) {
  const colors = getTimeBasedColors(timeOfDay);

  return new PolygonLayer({
    id: 'zones',
    data: zones,
    getPolygon: (d: any) => d.boundary ? convertPointsToLatLng(d.boundary) : [],
    getFillColor: (d: any) => {
      const zoneType = getZoneTypeName(d.zone_type);
      return colors.zones[zoneType] || colors.zones.residential;
    },
    getLineColor: [255, 255, 255, 100],
    getLineWidth: 2,
    filled: true,
    stroked: true,
    extruded: false,
    wireframe: false,
    pickable: true,
    visible,
    transitions: {
      getFillColor: 1000,
    },
  });
}

function getZoneTypeName(zoneType: number): string {
  const types = ['residential', 'commercial', 'industrial', 'downtown', 'park', 'water'];
  return types[zoneType] || 'residential';
}