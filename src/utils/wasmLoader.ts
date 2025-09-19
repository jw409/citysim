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
    // Convert city model to format expected by WASM
    const config: SimulationConfig = {
      zones: cityModel.zones || [],
      roads: cityModel.roads || [],
      pois: cityModel.pois || [],
      buildings: cityModel.buildings || [],
    };

    // Initialize the simulation
    module.init(new Uint8Array(), config);
  } catch (error) {
    console.error('Failed to initialize simulation:', error);
    throw new Error(`Simulation initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function loadCityModel(): Promise<any> {
  try {
    const response = await fetch('/model.pbf');
    if (!response.ok) {
      throw new Error(`Failed to fetch city model: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    // Decode the protobuf data
    const city = urbansynth.City.decode(uint8Array);

    return {
      name: city.name || 'Generated City',
      bounds: city.bounds || { min_x: 0, min_y: 0, max_x: 1000, max_y: 1000 },
      zones: city.zones || [],
      roads: city.roads || [],
      pois: city.pois || [],
      buildings: city.buildings || [],
      metadata: city.metadata || null,
    };
  } catch (error) {
    console.error('Failed to load city model:', error);

    // Return a default empty city model if loading fails
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