const fs = require('fs');
const path = require('path');
const { createNoise2D } = require('simplex-noise');
const protobuf = require('protobufjs');

const CITY_SIZE = 10000; // 10km x 10km city
const GENERATION_SEED = 'urbansynth-v1';

class CityGenerator {
  constructor(seed = GENERATION_SEED) {
    this.seed = seed;
    this.noise = createNoise2D(() => this.hashSeed(seed));
    this.rngState = this.hashSeed(seed + '_rng') * 2147483647; // Initialize RNG state
    this.zones = [];
    this.roads = [];
    this.pois = [];
    this.buildings = [];
  }

  hashSeed(seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) / 2147483647;
  }

  // Seeded random number generator using Linear Congruential Generator
  random() {
    this.rngState = (this.rngState * 1664525 + 1013904223) % 4294967296;
    return this.rngState / 4294967296;
  }

  generateCity() {
    console.log('🏙️ Generating city with seed:', this.seed);

    this.generateZones();
    this.generateRoadNetwork();
    this.generatePOIs();
    this.generateBuildings();

    return this.createCityModel();
  }

  generateZones() {
    console.log('📍 Generating zones...');

    // Downtown core
    this.zones.push({
      id: 'downtown',
      type: 3, // DOWNTOWN
      boundary: this.generatePolygon(0, 0, 1500, 8),
      density: 0.9,
      properties: { residential_density: 0.2, commercial_density: 0.6, office_density: 0.8 }
    });

    // Residential suburbs
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const distance = 3000 + this.noise(i, 0) * 1000;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;

      this.zones.push({
        id: `residential_${i}`,
        type: 0, // RESIDENTIAL
        boundary: this.generatePolygon(x, y, 1200, 6),
        density: 0.6,
        properties: { residential_density: 0.8, commercial_density: 0.2, office_density: 0.1 }
      });
    }

    // Commercial districts
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const distance = 2000;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;

      this.zones.push({
        id: `commercial_${i}`,
        type: 1, // COMMERCIAL
        boundary: this.generatePolygon(x, y, 800, 5),
        density: 0.7,
        properties: { residential_density: 0.1, commercial_density: 0.8, office_density: 0.3 }
      });
    }

    // Industrial areas
    for (let i = 0; i < 2; i++) {
      const x = (i === 0 ? -1 : 1) * 4000;
      const y = 2000 + this.noise(i + 10, 0) * 1000;

      this.zones.push({
        id: `industrial_${i}`,
        type: 2, // INDUSTRIAL
        boundary: this.generatePolygon(x, y, 1500, 4),
        density: 0.4,
        properties: { residential_density: 0.05, commercial_density: 0.1, office_density: 0.2 }
      });
    }

    // Parks
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const distance = 1500;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;

      this.zones.push({
        id: `park_${i}`,
        type: 4, // PARK
        boundary: this.generatePolygon(x, y, 600, 8),
        density: 0.1,
        properties: { residential_density: 0, commercial_density: 0, office_density: 0 }
      });
    }
  }

  generatePolygon(centerX, centerY, radius, sides) {
    const points = [];
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2;
      const noiseOffset = this.noise(centerX + i, centerY + i) * 0.3;
      const r = radius * (1 + noiseOffset);
      points.push({
        x: centerX + Math.cos(angle) * r,
        y: centerY + Math.sin(angle) * r
      });
    }
    return points;
  }

  generateRoadNetwork() {
    console.log('🛣️ Generating road network...');

    // Major highways (ring road)
    const ringRadius = 3500;
    const ringPoints = [];
    for (let i = 0; i <= 32; i++) {
      const angle = (i / 32) * Math.PI * 2;
      ringPoints.push({
        x: Math.cos(angle) * ringRadius,
        y: Math.sin(angle) * ringRadius
      });
    }
    this.roads.push({
      id: 'ring_highway',
      type: 0, // HIGHWAY
      path: ringPoints,
      width: 20,
      lanes: 6,
      speed_limit: 80
    });

    // Arterial roads connecting zones
    this.zones.forEach((zone, i) => {
      if (zone.type !== 4) { // Not parks
        const centerX = zone.boundary.reduce((sum, p) => sum + p.x, 0) / zone.boundary.length;
        const centerY = zone.boundary.reduce((sum, p) => sum + p.y, 0) / zone.boundary.length;

        // Connect to downtown
        this.roads.push({
          id: `arterial_to_${zone.id}`,
          type: 1, // ARTERIAL
          path: [
            { x: 0, y: 0 },
            { x: centerX * 0.7, y: centerY * 0.7 },
            { x: centerX, y: centerY }
          ],
          width: 12,
          lanes: 4,
          speed_limit: 60
        });
      }
    });

    // Local roads within zones
    this.zones.forEach(zone => {
      if (zone.type === 0 || zone.type === 1) { // Residential or commercial
        const centerX = zone.boundary.reduce((sum, p) => sum + p.x, 0) / zone.boundary.length;
        const centerY = zone.boundary.reduce((sum, p) => sum + p.y, 0) / zone.boundary.length;

        // Grid of local roads
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            const offsetX = (i - 1) * 400;
            const offsetY = (j - 1) * 400;

            this.roads.push({
              id: `local_${zone.id}_${i}_${j}`,
              type: 3, // LOCAL
              path: [
                { x: centerX + offsetX - 200, y: centerY + offsetY },
                { x: centerX + offsetX + 200, y: centerY + offsetY }
              ],
              width: 6,
              lanes: 2,
              speed_limit: 30
            });
          }
        }
      }
    });
  }

  generatePOIs() {
    console.log('📍 Generating points of interest...');

    this.zones.forEach(zone => {
      const centerX = zone.boundary.reduce((sum, p) => sum + p.x, 0) / zone.boundary.length;
      const centerY = zone.boundary.reduce((sum, p) => sum + p.y, 0) / zone.boundary.length;
      const poiCount = Math.floor(zone.density * 50);

      for (let i = 0; i < poiCount; i++) {
        const angle = this.random() * Math.PI * 2;
        const distance = this.random() * 500;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;

        let poiType;
        switch (zone.type) {
          case 0: // RESIDENTIAL
            poiType = this.random() < 0.8 ? 0 : 2; // HOME or SHOP
            break;
          case 1: // COMMERCIAL
            poiType = this.random() < 0.6 ? 2 : 3; // SHOP or RESTAURANT
            break;
          case 2: // INDUSTRIAL
            poiType = 7; // FACTORY
            break;
          case 3: // DOWNTOWN
            poiType = this.random() < 0.5 ? 1 : 2; // OFFICE or SHOP
            break;
          case 4: // PARK
            poiType = 6; // PARK_POI
            break;
          default:
            poiType = 0;
        }

        this.pois.push({
          id: `poi_${zone.id}_${i}`,
          type: poiType,
          position: { x, y },
          zone_id: zone.id,
          capacity: Math.floor(this.random() * 100) + 10,
          properties: {
            name: this.generatePOIName(poiType),
            tags: []
          }
        });
      }
    });
  }

  generatePOIName(type) {
    const names = {
      0: ['Home', 'Residence', 'House'],
      1: ['Office', 'Corporation', 'Business Center'],
      2: ['Shop', 'Store', 'Market'],
      3: ['Restaurant', 'Cafe', 'Diner'],
      4: ['School', 'Academy', 'University'],
      5: ['Hospital', 'Clinic', 'Medical Center'],
      6: ['Park', 'Garden', 'Green Space'],
      7: ['Factory', 'Plant', 'Facility']
    };
    const typeNames = names[type] || ['Location'];
    return typeNames[Math.floor(this.random() * typeNames.length)];
  }

  generateBuildings() {
    console.log('🏢 Generating buildings...');

    // Generate buildings for high-capacity POIs
    this.pois.forEach((poi, i) => {
      if (poi.capacity > 50) {
        const footprint = this.generatePolygon(poi.position.x, poi.position.y, 50, 4);
        const height = 30 + this.random() * 100;

        this.buildings.push({
          id: `building_${i}`,
          footprint,
          height,
          zone_id: poi.zone_id,
          type: this.getBuildingType(poi.type)
        });
      }
    });
  }

  getBuildingType(poiType) {
    const mapping = {
      0: 0, // HOME -> HOUSE
      1: 2, // OFFICE -> OFFICE_BUILDING
      2: 3, // SHOP -> STORE
      7: 4  // FACTORY -> WAREHOUSE
    };
    return mapping[poiType] || 0;
  }

  createCityModel() {
    return {
      name: 'UrbanSynth City',
      bounds: {
        minX: -CITY_SIZE / 2,
        minY: -CITY_SIZE / 2,
        maxX: CITY_SIZE / 2,
        maxY: CITY_SIZE / 2
      },
      zones: this.zones,
      roads: this.roads,
      pois: this.pois,
      buildings: this.buildings,
      metadata: {
        generationTimestamp: 1700000000000 + Math.floor(this.hashSeed(this.seed + '_timestamp') * 86400000), // Deterministic timestamp
        generationSeed: this.seed,
        totalPopulation: this.pois.filter(p => p.type === 0).length * 3,
        totalArea: CITY_SIZE * CITY_SIZE
      }
    };
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    seed: GENERATION_SEED,
    output: './public/model.pbf'
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--seed':
        if (i + 1 < args.length) {
          options.seed = args[i + 1];
          i++; // Skip next argument
        }
        break;
      case '--output':
        if (i + 1 < args.length) {
          options.output = args[i + 1];
          i++; // Skip next argument
        }
        break;
      case '--help':
        console.log(`Usage: node generate_city.cjs [options]
Options:
  --seed <value>     Seed for deterministic generation (default: "${GENERATION_SEED}")
  --output <path>    Output file path (default: "./public/model.pbf")
  --help             Show this help message

Examples:
  node generate_city.cjs --seed 12345 --output ./test_city.pbf
  node generate_city.cjs --seed "my-custom-seed"`);
        process.exit(0);
    }
  }

  return options;
}

async function main() {
  try {
    const options = parseArgs();

    // Load protobuf schema
    const root = await protobuf.load('./src/data/city_model.proto');
    const City = root.lookupType('urbansynth.City');

    // Generate city with specified seed
    const generator = new CityGenerator(options.seed);
    const cityData = generator.generateCity();

    // Validate the message
    const errMsg = City.verify(cityData);
    if (errMsg) throw Error(errMsg);

    // Create message and encode to binary
    const message = City.create(cityData);
    const buffer = City.encode(message).finish();

    // Write to file
    fs.writeFileSync(options.output, buffer);

    console.log(`✅ City model generated successfully!`);
    console.log(`📊 Stats:`);
    console.log(`   - Seed: ${options.seed}`);
    console.log(`   - Zones: ${cityData.zones.length}`);
    console.log(`   - Roads: ${cityData.roads.length}`);
    console.log(`   - POIs: ${cityData.pois.length}`);
    console.log(`   - Buildings: ${cityData.buildings.length}`);
    console.log(`   - File size: ${(buffer.length / 1024).toFixed(1)} KB`);
    console.log(`   - Output: ${options.output}`);

  } catch (error) {
    console.error('❌ City generation failed:', error);
    process.exit(1);
  }
}

main();