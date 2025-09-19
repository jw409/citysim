import { ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import { CompositeLayer } from '@deck.gl/core';
import { ChargingStation, CoverageArea } from '../types/optimization';

interface ChargingStationLayerProps {
  data: ChargingStation[];
  coverageAreas?: CoverageArea[];
  showCoverage?: boolean;
  showLabels?: boolean;
}

export class ChargingStationLayer extends CompositeLayer<ChargingStationLayerProps> {
  static layerName = 'ChargingStationLayer';

  renderLayers() {
    const stations = this.props.data || [];
    const coverageAreas = (this.props as any).coverageAreas || [];
    const showCoverage = (this.props as any).showCoverage !== false;
    const showLabels = (this.props as any).showLabels !== false;

    if (!stations || stations.length === 0) {
      return [];
    }

    const layers = [];

    // Coverage circles (if enabled)
    if (showCoverage && coverageAreas && coverageAreas.length > 0) {
      layers.push(
        new ScatterplotLayer({
          id: 'charging-station-coverage',
          data: coverageAreas,
          getPosition: (d: CoverageArea) => [d.center.x, d.center.y, 1],
          getRadius: (d: CoverageArea) => d.radius,
          getFillColor: [100, 255, 100, 30], // Semi-transparent green
          getLineColor: [50, 200, 50, 120],
          getLineWidth: 2,
          radiusUnits: 'meters',
          filled: true,
          stroked: true,
          pickable: false,
        })
      );
    }

    // Charging station base (larger circle for visibility)
    layers.push(
      new ScatterplotLayer({
        id: 'charging-stations-base',
        data: stations,
        getPosition: (d: ChargingStation) => [d.position.x, d.position.y, 5],
        getRadius: 25,
        getFillColor: [255, 255, 255, 200], // White base
        getLineColor: [0, 0, 0, 255],
        getLineWidth: 3,
        radiusUnits: 'meters',
        radiusMinPixels: 12,
        radiusMaxPixels: 30,
        filled: true,
        stroked: true,
        pickable: true,
      })
    );

    // Charging station main icon
    layers.push(
      new ScatterplotLayer({
        id: 'charging-stations-main',
        data: stations,
        getPosition: (d: ChargingStation) => [d.position.x, d.position.y, 10],
        getRadius: 18,
        getFillColor: [255, 215, 0, 255], // Gold color
        getLineColor: [0, 0, 0, 255],
        getLineWidth: 2,
        radiusUnits: 'meters',
        radiusMinPixels: 8,
        radiusMaxPixels: 24,
        filled: true,
        stroked: true,
        pickable: true,
      })
    );

    // Station labels with lightning bolt emoji
    if (showLabels) {
      layers.push(
        new TextLayer({
          id: 'charging-station-labels',
          data: stations,
          getPosition: (d: ChargingStation) => [d.position.x, d.position.y, 15],
          getText: () => '⚡',
          getSize: 20,
          getColor: [0, 0, 0, 255],
          getAngle: 0,
          fontFamily: 'Arial, sans-serif',
          fontWeight: 'bold',
          pickable: false,
        })
      );
    }

    // Station ID labels (smaller text below icon)
    if (showLabels && stations.length <= 10) { // Only show IDs when not too cluttered
      layers.push(
        new TextLayer({
          id: 'charging-station-ids',
          data: stations,
          getPosition: (d: ChargingStation) => [d.position.x, d.position.y - 40, 15],
          getText: (d: ChargingStation) => d.id.replace('station_', 'S'),
          getSize: 12,
          getColor: [255, 255, 255, 200],
          getAngle: 0,
          fontFamily: 'Arial, sans-serif',
          fontWeight: 'bold',
          pickable: false,
          backgroundColor: [0, 0, 0, 100],
        })
      );
    }

    return layers;
  }
}

export function createChargingStationLayer(
  stations: ChargingStation[] = [],
  coverageAreas: CoverageArea[] = [],
  showCoverage: boolean = true,
  showLabels: boolean = true
) {
  return new ChargingStationLayer({
    id: 'charging-stations-composite',
    data: stations,
    coverageAreas,
    showCoverage,
    showLabels,
    visible: stations.length > 0,
  } as any);
}

// Helper function to create coverage areas from stations
export function createCoverageAreasFromStations(
  stations: ChargingStation[]
): CoverageArea[] {
  return stations.map(station => ({
    center: station.position,
    radius: station.coverage_radius,
    traffic_covered: station.traffic_coverage,
    station_id: station.id,
  }));
}