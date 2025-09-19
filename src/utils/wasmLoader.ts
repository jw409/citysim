import { SimulationConfig } from '../types/simulation';
import { urbansynth } from '../data/city_model';

let wasmModule: any = null;

// Generate POIs for agent spawning
function generatePOIsFromCityData(city: any): any[] {
  const existingPOIs = city.pois || [];
  const zones = city.zones || [];
  const buildings = city.buildings || [];
  const generatedPOIs = [...existingPOIs];

  console.log('Generating POIs from zones and buildings...');

  // Generate residential POIs (HOME type) from residential zones
  zones.forEach((zone: any, zoneIndex: number) => {
    if (zone.type === 0 || zone.zone_type === 0) { // Residential zone
      const boundary = zone.boundary || [];
      if (boundary.length >= 3) {
        // Calculate zone center
        const centerX = boundary.reduce((sum: number, p: any) => sum + p.x, 0) / boundary.length;
        const centerY = boundary.reduce((sum: number, p: any) => sum + p.y, 0) / boundary.length;

        // Create multiple residential POIs per zone
        for (let i = 0; i < 3; i++) {
          const offsetX = (Math.random() - 0.5) * 200;
          const offsetY = (Math.random() - 0.5) * 200;

          generatedPOIs.push({
            id: `home_${zoneIndex}_${i}`,
            type: 0, // HOME
            position: {
              x: centerX + offsetX,
              y: centerY + offsetY
            },
            capacity: 50 + Math.floor(Math.random() * 100), // 50-150 capacity
            zone_id: zone.id || `zone_${zoneIndex}`
          });
        }
      }
    }
  });

  // Generate POIs from buildings if no zones
  if (zones.length === 0 && buildings.length > 0) {
    buildings.forEach((building: any, buildingIndex: number) => {
      if (building.building_type === 0 || building.type === 0) { // Residential building
        const footprint = building.footprint || [];
        if (footprint.length >= 3) {
          const centerX = footprint.reduce((sum: number, p: any) => sum + p.x, 0) / footprint.length;
          const centerY = footprint.reduce((sum: number, p: any) => sum + p.y, 0) / footprint.length;

          generatedPOIs.push({
            id: `building_home_${buildingIndex}`,
            type: 0, // HOME
            position: { x: centerX, y: centerY },
            capacity: 30 + Math.floor(Math.random() * 70), // 30-100 capacity
            zone_id: building.zone_id || 'default'
          });
        }
      }
    });
  }

  console.log(`Generated ${generatedPOIs.length - existingPOIs.length} additional POIs`);
  return generatedPOIs;
}

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
      poi_type: poi.type || poi.poi_type || 0,
      zone_id: poi.zone_id || poi.zoneId || 'default'
    }));

    const transformedBuildings = (cityModel.buildings || []).map((building: any) => ({
      ...building,
      building_type: building.type || building.building_type || 0,
      zone_id: building.zone_id || building.zoneId || 'default'
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

    // Generate POIs if none exist or insufficient for agent spawning
    let enhancedPOIs = city.pois || [];
    if (enhancedPOIs.filter(poi => poi.type === 0).length < 5) {
      console.log('Generating residential POIs for agent spawning...');
      enhancedPOIs = generatePOIsFromCityData(city);
    }

    const cityModel = {
      name: city.name || 'Generated City',
      bounds: city.bounds ? {
        min_x: city.bounds.minX || 0,
        min_y: city.bounds.minY || 0,
        max_x: city.bounds.maxX || 1000,
        max_y: city.bounds.maxY || 1000
      } : { min_x: 0, min_y: 0, max_x: 1000, max_y: 1000 },
      zones: city.zones || [],
      roads: city.roads || [],
      pois: enhancedPOIs,
      buildings: city.buildings || [],
      metadata: city.metadata || null,
    };

    console.log('Final city model with bounds:', {
      name: cityModel.name,
      bounds: cityModel.bounds,
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