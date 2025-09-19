import { generateSewerNetwork } from '../layers/infrastructure/SewerLayer';
import { generateUtilityNetwork } from '../layers/infrastructure/UtilityTunnelLayer';
import { generateSubwaySystem } from '../layers/infrastructure/SubwayLayer';
import { generateUndergroundParking } from '../layers/infrastructure/UndergroundParkingLayer';
import { generateElevatedHighways } from '../layers/elevated/ElevatedHighwayLayer';
import { generateSkyBridges } from '../layers/elevated/SkyBridgeLayer';
import { generateElevatedTransit } from '../layers/elevated/ElevatedTransitLayer';
import { generateHelicopterTraffic } from '../layers/aerial/HelicopterLayer';
import { generateAirTraffic } from '../layers/aerial/AircraftLayer';
import { generateDroneTraffic } from '../layers/aerial/DroneLayer';

export interface MultiLayerCityData {
  infrastructure: {
    sewers: any[];
    utilities: any[];
    subway: any[];
    parking: any[];
    elevatedRoads: any[];
    skyBridges: any[];
    elevatedTransit: any[];
  };
  aerialTraffic: {
    helicopters: any[];
    aircraft: any[];
    drones: any[];
  };
  bounds: {
    min_x: number;
    min_y: number;
    max_x: number;
    max_y: number;
  };
}

export function generateMultiLayerCityData(cityModel: any): MultiLayerCityData {
  // Use city bounds or create default bounds
  const bounds = cityModel?.bounds || {
    min_x: -2000,
    min_y: -2000,
    max_x: 2000,
    max_y: 2000
  };

  const buildings = cityModel?.buildings || [];

  console.log('Generating multi-layer city data for bounds:', bounds);

  // Generate underground infrastructure
  const sewers = generateSewerNetwork(bounds, 0.8);
  const utilities = generateUtilityNetwork(bounds, 1.0);
  const subway = generateSubwaySystem(bounds, 3);
  const parking = generateUndergroundParking(buildings, 0.4);

  console.log('Generated underground infrastructure:', {
    sewers: sewers.length,
    utilities: utilities.length,
    subway: subway.length,
    parking: parking.length
  });

  // Generate elevated infrastructure
  const elevatedRoads = generateElevatedHighways(bounds, 0.6);
  const skyBridges = generateSkyBridges(buildings, 0.3);
  const elevatedTransit = generateElevatedTransit(bounds, 2);

  console.log('Generated elevated infrastructure:', {
    elevatedRoads: elevatedRoads.length,
    skyBridges: skyBridges.length,
    elevatedTransit: elevatedTransit.length
  });

  // Generate aerial traffic
  const helicopters = generateHelicopterTraffic(bounds, 0.15);
  const aircraft = generateAirTraffic(bounds, 0.08);
  const drones = generateDroneTraffic(bounds, 0.4);

  console.log('Generated aerial traffic:', {
    helicopters: helicopters.length,
    aircraft: aircraft.length,
    drones: drones.length
  });

  return {
    infrastructure: {
      sewers,
      utilities,
      subway,
      parking,
      elevatedRoads,
      skyBridges,
      elevatedTransit
    },
    aerialTraffic: {
      helicopters,
      aircraft,
      drones
    },
    bounds
  };
}

export function enhanceSimulationDataWithLayers(simulationData: any, cityModel: any): any {
  const multiLayerData = generateMultiLayerCityData(cityModel);

  return {
    ...simulationData,
    infrastructure: multiLayerData.infrastructure,
    aerialTraffic: multiLayerData.aerialTraffic,
    bounds: multiLayerData.bounds
  };
}