import { ScatterplotLayer } from '@deck.gl/layers';

export function createChargingStationLayer(stations: any[] = [], coverageMap: any = null, visible: boolean = false) {
  if (!stations || stations.length === 0) {
    return new ScatterplotLayer({
      id: 'charging-stations',
      data: [],
      visible: false
    });
  }

  return new ScatterplotLayer({
    id: 'charging-stations',
    data: stations,
    getPosition: (d: any) => [d.longitude || 0, d.latitude || 0, 10],
    getRadius: 50,
    getFillColor: [255, 215, 0, 200], // Gold color for charging stations
    getLineColor: [0, 0, 0, 255],
    getLineWidth: 2,
    radiusUnits: 'meters',
    stroked: true,
    filled: true,
    pickable: true,
    visible
  });
}