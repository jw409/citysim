import { SimulationConfig } from '../types/simulation';
import { urbansynth } from '../data/city_model';

let wasmModule: any = null;

export async function loadWasmModule(): Promise<any> {
  if (wasmModule) {
    return wasmModule;
  }

  try {
    // Dynamic import of WASM module
    const module = await import('../wasm/urbansynth_sim');
    await module.default();
    wasmModule = module;
    return module;
  } catch (error) {
    console.error('Failed to load WASM module:', error);
    throw new Error(`WASM module loading failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function initializeSimulation(cityModel: any): Promise<void> {
  const module = await loadWasmModule();

  try {
    // Convert protobuf format to WASM expected format
    const transformedZones = (cityModel.zones || []).map((zone: any) => ({
      ...zone,
      zone_type: zone.type || zone.zone_type || 0
    }));

    const transformedRoads = (cityModel.roads || []).map((road: any) => ({
      ...road,
      road_type: road.type || road.road_type || 0,
      speed_limit: road.speed_limit || road.speedLimit || 50,
      width: road.width || 6,
      lanes: road.lanes || 2
    }));

    const transformedPOIs = (cityModel.pois || []).map((poi: any) => ({
      ...poi,
      poi_type: poi.type || poi.poi_type || 0
    }));

    const transformedBuildings = (cityModel.buildings || []).map((building: any) => ({
      ...building,
      building_type: building.type || building.building_type || 0
    }));

    // Convert city model to format expected by WASM (JSON format)
    const config: SimulationConfig = {
      zones: transformedZones,
      roads: transformedRoads,
      pois: transformedPOIs,
      buildings: transformedBuildings,
    };

    console.log('Initializing WASM with config:', {
      zonesCount: config.zones.length,
      roadsCount: config.roads.length,
      poisCount: config.pois.length,
      buildingsCount: config.buildings.length
    });

    // Initialize the simulation with the JSON config
    module.init(config);
  } catch (error) {
    console.error('Failed to initialize simulation:', error);
    throw new Error(`Simulation initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function loadCityModel(): Promise<any> {
  try {
    console.log('Loading city model from /model.pbf...');
    const response = await fetch('/model.pbf');
    if (!response.ok) {
      throw new Error(`Failed to fetch city model: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    console.log(`Loaded protobuf data: ${uint8Array.length} bytes`);

    // Decode the protobuf data
    const city = urbansynth.City.decode(uint8Array);
    console.log('Decoded city model:', {
      name: city.name,
      zonesCount: city.zones?.length || 0,
      roadsCount: city.roads?.length || 0,
      poisCount: city.pois?.length || 0,
      buildingsCount: city.buildings?.length || 0
    });

    const cityModel = {
      name: city.name || 'Generated City',
      bounds: city.bounds || { min_x: 0, min_y: 0, max_x: 1000, max_y: 1000 },
      zones: city.zones || [],
      roads: city.roads || [],
      pois: city.pois || [],
      buildings: city.buildings || [],
      metadata: city.metadata || null,
    };

    console.log('Final city model:', {
      name: cityModel.name,
      zonesCount: cityModel.zones.length,
      roadsCount: cityModel.roads.length,
      poisCount: cityModel.pois.length,
      buildingsCount: cityModel.buildings.length
    });

    return cityModel;
  } catch (error) {
    console.error('Failed to load city model:', error);

    // Return a default empty city model if loading fails
    console.log('Using fallback empty city model');
    return {
      name: 'Default City',
      bounds: { min_x: 0, min_y: 0, max_x: 1000, max_y: 1000 },
      zones: [],
      roads: [],
      pois: [],
      buildings: [],
      metadata: null,
    };
  }
}