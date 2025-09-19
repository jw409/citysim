import { SimulationConfig } from '../types/simulation';

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

    await response.arrayBuffer();

    // For now, we'll use a simplified approach
    // In a real implementation, we'd decode the protobuf here
    return {
      zones: [],
      roads: [],
      pois: [],
      buildings: [],
    };
  } catch (error) {
    console.error('Failed to load city model:', error);
    throw error;
  }
}