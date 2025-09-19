import { ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import { CompositeLayer } from '@deck.gl/core';
import { ChargingStation, CoverageArea } from '../types/optimization';

interface ChargingStationLayerProps {
  data: ChargingStation[];
  coverageAreas: CoverageArea[];
  showCoverage?: boolean;
}

export class ChargingStationLayer extends CompositeLayer<ChargingStationLayerProps> {
  static layerName = 'ChargingStationLayer';

  renderLayers() {
    const { data: stations, coverageAreas, showCoverage = true } = this.props;

    const layers = [];

    // Coverage circles (if enabled)
    if (showCoverage && coverageAreas) {
      layers.push(
        new ScatterplotLayer({
          id: 'charging-station-coverage',
          data: coverageAreas,
          getPosition: (d: CoverageArea) => [d.center.x, d.center.y, 1],
          getRadius: (d: CoverageArea) => d.radius,
          getFillColor: [100, 255, 100, 50],
          getLineColor: [50, 200, 50, 100],
          getLineWidth: 2,
          radiusUnits: 'meters',
          filled: true,
          stroked: true,
          pickable: false,
        })
      );
    }

    // Charging station icons
    layers.push(
      new ScatterplotLayer({
        id: 'charging-stations',
        data: stations,
        getPosition: (d: ChargingStation) => [d.position.x, d.position.y, 10],
        getRadius: 15,
        getFillColor: [255, 215, 0], // Gold color
        getLineColor: [0, 0, 0],
        getLineWidth: 2,
        radiusUnits: 'meters',
        radiusMinPixels: 8,
        radiusMaxPixels: 20,
        filled: true,
        stroked: true,
        pickable: true,
      })
    );

    // Station labels
    layers.push(
      new TextLayer({
        id: 'charging-station-labels',
        data: stations,
        getPosition: (d: ChargingStation) => [d.position.x, d.position.y, 15],
        getText: () => '⚡',
        getSize: 24,
        getColor: [0, 0, 0],
        getAngle: 0,
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'bold',
        pickable: false,
      })
    );

    return layers;
  }
}

export function createChargingStationLayer(
  stations: ChargingStation[],
  coverageAreas: CoverageArea[],
  showCoverage: boolean = true
) {
  return new ChargingStationLayer({
    id: 'charging-stations-composite',
    data: stations,
    coverageAreas,
    showCoverage,
  });
}