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
      const color = colors.zones[zoneType] || colors.zones.residential;
      // Reduce opacity to prevent z-fighting on overlaps
      return [color[0], color[1], color[2], 80];
    },
    getLineColor: [255, 255, 255, 150],
    getLineWidth: 1,
    filled: true,
    stroked: true,
    extruded: false,
    wireframe: false,
    pickable: true,
    visible,
    // Add elevation offset to prevent z-fighting
    getElevation: (d: any, { index }: any) => index * 0.1,
    // Use polygon offset to prevent z-fighting
    parameters: {
      polygonOffsetUnits: 1,
      polygonOffsetFactor: 1
    },
    transitions: {
      getFillColor: 1000,
    },
  });
}

function getZoneTypeName(zoneType: number): string {
  const types = ['residential', 'commercial', 'industrial', 'downtown', 'park', 'water'];
  return types[zoneType] || 'residential';
}