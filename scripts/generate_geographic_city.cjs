const fs = require('fs');
const path = require('path');
const { createNoise2D } = require('simplex-noise');
const protobuf = require('protobufjs');

const CITY_SIZE = 10000; // 10km x 10km city

// Terrain profiles (matching the TypeScript profiles)
const TERRAIN_PROFILES = {
  manhattan: {
    name: 'Manhattan',
    parameters: {
      mountainHeight: 25,
      waterLevel: 0,
      hilliness: 0.1,
      riverProbability: 0.9,
      coastalDistance: 800
    },
    recommendedScale: 1
  },
  san_francisco: {
    name: 'San Francisco',
    parameters: {
      mountainHeight: 180,
      waterLevel: 0,
      hilliness: 0.8,
      riverProbability: 0.2,
      coastalDistance: 1500
    },
    recommendedScale: 1
  },
  denver: {
    name: 'Denver',
    parameters: {
      mountainHeight: 200,
      waterLevel: -1600,
      hilliness: 0.3,
      riverProbability: 0.4,
      coastalDistance: 1600000
    },
    recommendedScale: 10
  },
  miami: {
    name: 'Miami',
    parameters: {
      mountainHeight: 8,
      waterLevel: 2,
      hilliness: 0.02,
      riverProbability: 0.6,
      coastalDistance: 400
    },
    recommendedScale: 1
  },
  seattle: {
    name: 'Seattle',
    parameters: {
      mountainHeight: 160,
      waterLevel: 0,
      hilliness: 0.6,
      riverProbability: 0.5,
      coastalDistance: 1200
    },
    recommendedScale: 1
  },
  chicago: {
    name: 'Chicago',
    parameters: {
      mountainHeight: 12,
      waterLevel: 0,
      hilliness: 0.03,
      riverProbability: 0.3,
      coastalDistance: 600
    },
    recommendedScale: 5
  },
  las_vegas: {
    name: 'Las Vegas',
    parameters: {
      mountainHeight: 300,
      waterLevel: -600,
      hilliness: 0.4,
      riverProbability: 0.1,
      coastalDistance: 400000
    },
    recommendedScale: 10
  },
  new_orleans: {
    name: 'New Orleans',
    parameters: {
      mountainHeight: 6,
      waterLevel: 3,
      hilliness: 0.05,
      riverProbability: 0.8,
      coastalDistance: 160000
    },
    recommendedScale: 1
  },
  custom: {
    name: 'Custom',
    parameters: {
      mountainHeight: 100,
      waterLevel: 0,
      hilliness: 0.5,
      riverProbability: 0.3,
      coastalDistance: 5000
    },
    recommendedScale: 1
  }
};

class GeographicCityGenerator {
  constructor(terrainProfile = 'manhattan', seed = 'geo-city-v1', customParams = null) {
    this.seed = seed;
    this.terrainProfile = terrainProfile;
    this.noise = createNoise2D(() => this.hashSeed(seed));
    this.rngState = this.hashSeed(seed + '_rng') * 2147483647;

    // Load terrain profile
    this.terrainParams = customParams || TERRAIN_PROFILES[terrainProfile]?.parameters || TERRAIN_PROFILES.manhattan.parameters;

    this.zones = [];
    this.roads = [];
    this.pois = [];
    this.buildings = [];

    // Create terrain analysis cache
    this.terrainCache = new Map();
  }

  hashSeed(seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash) / 2147483647;
  }

  random() {
    this.rngState = (this.rngState * 1664525 + 1013904223) % 4294967296;
    return this.rngState / 4294967296;
  }

  // Terrain analysis functions
  getTerrainHeight(x, y) {
    const key = `${Math.floor(x/10)},${Math.floor(y/10)}`;
    if (this.terrainCache.has(key)) {
      return this.terrainCache.get(key);
    }

    const noiseScale = 0.001;
    const ridgeNoiseScale = 0.003;

    const baseNoise = this.noise(x * noiseScale, y * noiseScale);
    const ridgeNoise = this.noise(x * ridgeNoiseScale, y * ridgeNoiseScale);
    const detailNoise = this.noise(x * noiseScale * 4, y * noiseScale * 4) * 0.3;

    const combinedNoise = baseNoise + (Math.abs(ridgeNoise) * 0.7) + detailNoise;
    const height = combinedNoise * this.terrainParams.mountainHeight + this.terrainParams.waterLevel;

    this.terrainCache.set(key, height);
    return height;
  }

  isWater(x, y) {
    return this.getTerrainHeight(x, y) < this.terrainParams.waterLevel;
  }

  getSlope(x, y, delta = 50) {
    const h1 = this.getTerrainHeight(x - delta, y);
    const h2 = this.getTerrainHeight(x + delta, y);
    const h3 = this.getTerrainHeight(x, y - delta);
    const h4 = this.getTerrainHeight(x, y + delta);

    const slopeX = Math.abs(h2 - h1) / (2 * delta);
    const slopeY = Math.abs(h4 - h3) / (2 * delta);

    return Math.sqrt(slopeX * slopeX + slopeY * slopeY);
  }

  distanceToWater(x, y) {
    // Simplified water distance calculation
    for (let radius = 100; radius <= 5000; radius += 100) {
      const samples = Math.max(8, Math.floor(radius / 100));
      for (let i = 0; i < samples; i++) {
        const angle = (i / samples) * 2 * Math.PI;
        const testX = x + Math.cos(angle) * radius;
        const testY = y + Math.sin(angle) * radius;
        if (this.isWater(testX, testY)) {
          return radius;
        }
      }
    }
    return this.terrainParams.coastalDistance;
  }

  getSuitabilityFactors(x, y) {
    const height = this.getTerrainHeight(x, y);
    const slope = this.getSlope(x, y);
    const waterDistance = this.distanceToWater(x, y);

    return {
      flatness: Math.max(0, 1 - slope * 10),
      waterAccess: Math.max(0, 1 - waterDistance / 3000),
      elevation: Math.max(0, Math.min(1, (height + 50) / 200)),
      drainage: Math.max(0, 1 - Math.max(0, -height / 20))
    };
  }

  getZoneSuitability(x, y, zoneType) {
    const isWater = this.isWater(x, y);
    if (isWater && zoneType !== 'port') return 0;

    const factors = this.getSuitabilityFactors(x, y);
    let suitability = 1.0;

    switch (zoneType) {
      case 'downtown':
        suitability *= factors.flatness * 0.8 + 0.2;
        suitability *= factors.waterAccess * 0.6 + 0.4;
        suitability *= factors.drainage * 0.8 + 0.2;
        break;
      case 'residential':
        suitability *= factors.flatness * 0.4 + 0.6;
        suitability *= factors.drainage * 0.9 + 0.1;
        if (factors.elevation > 0.3) suitability *= 1.2;
        break;
      case 'commercial':
        suitability *= factors.flatness * 0.6 + 0.4;
        suitability *= factors.waterAccess * 0.5 + 0.5;
        suitability *= factors.drainage * 0.8 + 0.2;
        break;
      case 'industrial':
        suitability *= factors.flatness * 0.9 + 0.1;
        suitability *= factors.waterAccess * 0.7 + 0.3;
        if (Math.abs(this.getTerrainHeight(x, y)) < 10) suitability *= 1.3;
        break;
      case 'park':
        if (factors.elevation > 0.5) suitability *= 1.5;
        if (factors.flatness < 0.3) suitability *= 1.3;
        break;
    }

    return Math.max(0, Math.min(1, suitability));
  }

  generateGeographicCity() {
    console.log(`🏔️ Generating ${this.terrainProfile} city with geographic awareness...`);
    console.log(`📊 Terrain parameters:`, this.terrainParams);

    this.generateTerrainAwareZones();
    this.generateGeographicRoads();
    this.generateTerrainAwarePOIs();
    this.generateGeographicBuildings();

    return this.createGeographicCityModel();
  }

  generateTerrainAwareZones() {
    console.log('📍 Generating terrain-aware zones...');

    // Find optimal downtown location
    this.findAndCreateOptimalZone('downtown', 3, 1500, 1000);

    // Generate residential zones
    for (let i = 0; i < 6; i++) {
      this.findAndCreateOptimalZone('residential', 0, 1200, 800);
    }

    // Generate commercial zones
    for (let i = 0; i < 3; i++) {
      this.findAndCreateOptimalZone('commercial', 1, 800, 600);
    }

    // Generate industrial zones
    for (let i = 0; i < 2; i++) {
      this.findAndCreateOptimalZone('industrial', 2, 1000, 800);
    }

    // Generate parks in scenic areas
    for (let i = 0; i < 3; i++) {
      this.findAndCreateOptimalZone('park', 4, 600, 600);
    }

    console.log(`✅ Generated ${this.zones.length} terrain-optimized zones`);
  }

  findAndCreateOptimalZone(zoneType, typeEnum, width, height) {
    let bestLocation = null;
    let bestSuitability = 0;

    // Sample many locations to find the best one
    for (let attempt = 0; attempt < 50; attempt++) {
      const x = (this.random() - 0.5) * 8000;
      const y = (this.random() - 0.5) * 8000;

      // Check if too close to existing zones
      const tooClose = this.zones.some(zone => {
        const zoneCenter = this.getZoneCenter(zone);
        const distance = Math.sqrt(Math.pow(x - zoneCenter.x, 2) + Math.pow(y - zoneCenter.y, 2));
        return distance < 1000; // Minimum distance between zones
      });

      if (tooClose) continue;

      const suitability = this.getZoneSuitability(x, y, zoneType);

      if (suitability > bestSuitability) {
        bestSuitability = suitability;
        bestLocation = { x, y };
      }
    }

    if (bestLocation && bestSuitability > 0.2) {
      const densityMultiplier = zoneType === 'downtown' ? 0.95 :
                              zoneType === 'commercial' ? 0.8 :
                              zoneType === 'industrial' ? 0.7 : 0.6;

      this.zones.push({
        id: `${zoneType}_${this.zones.length}`,
        type: typeEnum,
        boundary: this.generateRectangularZone(bestLocation.x, bestLocation.y, width, height),
        density: densityMultiplier,
        properties: {
          terrain_suitability: bestSuitability,
          terrain_height: this.getTerrainHeight(bestLocation.x, bestLocation.y),
          terrain_slope: this.getSlope(bestLocation.x, bestLocation.y)
        }
      });

      console.log(`  🎯 ${zoneType} zone placed at (${bestLocation.x.toFixed(0)}, ${bestLocation.y.toFixed(0)}) - suitability: ${bestSuitability.toFixed(2)}`);
    }
  }

  generateGeographicRoads() {
    console.log('🛣️ Generating terrain-aware road network...');

    const connections = [];

    // Connect all zones to each other, prioritizing downtown connections
    this.zones.forEach((zone, i) => {
      this.zones.forEach((otherZone, j) => {
        if (i < j) {
          const priority = (zone.type === 3 || otherZone.type === 3) ? 'high' : 'normal';
          connections.push({
            from: this.getZoneCenter(zone),
            to: this.getZoneCenter(otherZone),
            priority
          });
        }
      });
    });

    // Generate roads that follow terrain
    connections.forEach((connection, index) => {
      const roadPath = this.generateTerrainAwareRoadPath(connection.from, connection.to);
      const difficulty = this.calculatePathDifficulty(roadPath);

      this.roads.push({
        id: `road_${index}`,
        type: connection.priority === 'high' ? 1 : 2, // ARTERIAL or LOCAL
        path: roadPath,
        width: connection.priority === 'high' ? 12 : 8,
        speedLimit: connection.priority === 'high' ? 60 : 40,
        properties: {
          terrain_difficulty: difficulty,
          follows_contours: true
        }
      });
    });

    console.log(`✅ Generated ${this.roads.length} terrain-following roads`);
  }

  generateTerrainAwareRoadPath(from, to) {
    const path = [from];
    const distance = Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2));
    const numSegments = Math.max(8, Math.floor(distance / 300));

    for (let i = 1; i < numSegments; i++) {
      const t = i / numSegments;
      const directX = from.x + (to.x - from.x) * t;
      const directY = from.y + (to.y - from.y) * t;

      // Try to avoid steep terrain
      let bestX = directX;
      let bestY = directY;
      let bestSlope = this.getSlope(directX, directY);

      // Sample nearby points to find flatter terrain
      for (let attempt = 0; attempt < 8; attempt++) {
        const offsetX = directX + (this.random() - 0.5) * 300;
        const offsetY = directY + (this.random() - 0.5) * 300;
        const slope = this.getSlope(offsetX, offsetY);

        if (slope < bestSlope && !this.isWater(offsetX, offsetY)) {
          bestSlope = slope;
          bestX = offsetX;
          bestY = offsetY;
        }
      }

      path.push({ x: bestX, y: bestY });
    }

    path.push(to);
    return path;
  }

  calculatePathDifficulty(path) {
    let totalDifficulty = 0;
    for (let i = 1; i < path.length; i++) {
      const slope = this.getSlope(path[i].x, path[i].y);
      totalDifficulty += slope;
    }
    return totalDifficulty / path.length;
  }

  generateTerrainAwarePOIs() {
    console.log('🏢 Generating terrain-aware POIs and landmarks...');

    let poiCount = 0;

    // Generate POIs within zones
    this.zones.forEach(zone => {
      const zoneCenter = this.getZoneCenter(zone);
      const zoneBounds = this.getZoneBounds(zone.boundary);
      const zonePoiCount = Math.floor(zone.density * 40);

      for (let i = 0; i < zonePoiCount; i++) {
        // Find suitable location within zone
        let bestLocation = null;
        let bestSuitability = 0;

        for (let attempt = 0; attempt < 10; attempt++) {
          const x = zoneBounds.minX + this.random() * (zoneBounds.maxX - zoneBounds.minX);
          const y = zoneBounds.minY + this.random() * (zoneBounds.maxY - zoneBounds.minY);

          const poiType = this.choosePOIType(zone);
          const suitability = this.getZoneSuitability(x, y, poiType);

          if (suitability > bestSuitability) {
            bestSuitability = suitability;
            bestLocation = { x, y, type: poiType };
          }
        }

        if (bestLocation && bestSuitability > 0.1) {
          this.pois.push({
            id: `poi_${zone.id}_${i}`,
            type: this.mapPOITypeToEnum(bestLocation.type),
            position: { x: bestLocation.x, y: bestLocation.y },
            capacity: this.calculatePOICapacity(bestLocation.type),
            properties: {
              name: this.generatePOIName(bestLocation.type, poiCount++),
              terrain_suitability: bestSuitability,
              terrain_height: this.getTerrainHeight(bestLocation.x, bestLocation.y)
            }
          });
        }
      }
    });

    // Add geographic landmarks
    this.addGeographicLandmarks();

    console.log(`✅ Generated ${this.pois.length} terrain-optimized POIs`);
  }

  addGeographicLandmarks() {
    const existingPOIs = this.pois.map(poi => poi.position);

    // Add lighthouse if coastal
    if (this.terrainParams.coastalDistance < 5000) {
      const lighthouse = this.findOptimalLocation('lighthouse', 3000, -4000, 0, existingPOIs);
      if (lighthouse) {
        this.pois.push({
          id: 'lighthouse_main',
          type: 5, // PARK (landmark)
          position: lighthouse,
          capacity: 50,
          properties: {
            name: 'Harbor Lighthouse',
            landmark: true,
            terrain_feature: 'coastal'
          }
        });
        console.log(`  🗼 Lighthouse added at coastal location`);
      }
    }

    // Add scenic overlook if mountainous
    if (this.terrainParams.mountainHeight > 100) {
      const overlook = this.findOptimalLocation('observatory', 4000, 0, 0, existingPOIs);
      if (overlook) {
        this.pois.push({
          id: 'scenic_overlook',
          type: 5, // PARK
          position: overlook,
          capacity: 100,
          properties: {
            name: 'Scenic Overlook',
            landmark: true,
            terrain_feature: 'elevated',
            elevation: this.getTerrainHeight(overlook.x, overlook.y)
          }
        });
        console.log(`  🏔️ Scenic overlook added at elevated location`);
      }
    }

    // Add river crossing if there are rivers
    if (this.terrainParams.riverProbability > 0.5) {
      this.pois.push({
        id: 'river_crossing',
        type: 1, // SHOP (infrastructure)
        position: { x: 0, y: 0 },
        capacity: 1,
        properties: {
          name: 'Main Bridge',
          landmark: true,
          terrain_feature: 'river_crossing'
        }
      });
      console.log(`  🌉 River crossing bridge added`);
    }
  }

  findOptimalLocation(locationType, searchRadius, centerX, centerY, existingPOIs = []) {
    let bestLocation = null;
    let bestScore = 0;

    for (let attempt = 0; attempt < 30; attempt++) {
      const angle = (attempt / 30) * 2 * Math.PI;
      const distance = this.random() * searchRadius;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;

      // Check minimum distance from existing POIs
      const tooClose = existingPOIs.some(poi =>
        Math.sqrt(Math.pow(x - poi.x, 2) + Math.pow(y - poi.y, 2)) < 300
      );
      if (tooClose) continue;

      let score = this.getZoneSuitability(x, y, locationType);

      // Specific scoring for landmark types
      if (locationType === 'lighthouse') {
        const waterDist = this.distanceToWater(x, y);
        score *= Math.max(0, 1 - waterDist / 500);
        score *= this.getSuitabilityFactors(x, y).elevation;
      } else if (locationType === 'observatory') {
        score *= Math.pow(this.getSuitabilityFactors(x, y).elevation, 2);
      }

      if (score > bestScore) {
        bestScore = score;
        bestLocation = { x, y };
      }
    }

    return bestScore > 0.3 ? bestLocation : null;
  }

  // Helper methods (similar to original generate_city.cjs)
  getZoneCenter(zone) {
    const bounds = this.getZoneBounds(zone.boundary);
    return {
      x: (bounds.minX + bounds.maxX) / 2,
      y: (bounds.minY + bounds.maxY) / 2
    };
  }

  getZoneBounds(boundary) {
    return {
      minX: Math.min(...boundary.map(p => p.x)),
      maxX: Math.max(...boundary.map(p => p.x)),
      minY: Math.min(...boundary.map(p => p.y)),
      maxY: Math.max(...boundary.map(p => p.y))
    };
  }

  generateRectangularZone(centerX, centerY, width, height) {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    return [
      { x: centerX - halfWidth, y: centerY - halfHeight },
      { x: centerX + halfWidth, y: centerY - halfHeight },
      { x: centerX + halfWidth, y: centerY + halfHeight },
      { x: centerX - halfWidth, y: centerY + halfHeight }
    ];
  }

  choosePOIType(zone) {
    const rand = this.random();
    switch (zone.type) {
      case 0: return rand < 0.8 ? 'home' : 'shop'; // RESIDENTIAL
      case 1: return rand < 0.6 ? 'shop' : 'restaurant'; // COMMERCIAL
      case 2: return 'factory'; // INDUSTRIAL
      case 3: return rand < 0.5 ? 'office' : 'shop'; // DOWNTOWN
      case 4: return 'park'; // PARK
      default: return 'shop';
    }
  }

  mapPOITypeToEnum(type) {
    const mapping = {
      'home': 0, 'shop': 1, 'restaurant': 2, 'factory': 3, 'office': 4, 'park': 5
    };
    return mapping[type] || 1;
  }

  calculatePOICapacity(type) {
    const capacities = {
      'home': 2 + Math.floor(this.random() * 4),
      'shop': 20 + Math.floor(this.random() * 80),
      'restaurant': 30 + Math.floor(this.random() * 120),
      'factory': 100 + Math.floor(this.random() * 400),
      'office': 50 + Math.floor(this.random() * 200),
      'park': 100 + Math.floor(this.random() * 500)
    };
    return capacities[type] || 50;
  }

  generatePOIName(type, index) {
    const names = {
      'home': `Residence ${index + 1}`,
      'shop': `Store ${index + 1}`,
      'restaurant': `Restaurant ${index + 1}`,
      'factory': `Factory ${index + 1}`,
      'office': `Office Building ${index + 1}`,
      'park': `Park ${index + 1}`
    };
    return names[type] || `POI ${index + 1}`;
  }

  generateGeographicBuildings() {
    console.log('🏗️ Generating terrain-adapted buildings...');

    this.buildings = this.pois
      .filter(poi => poi.capacity > 50)
      .map((poi, index) => ({
        id: `building_${index}`,
        type: this.mapPOITypeToBuilding(poi.type),
        footprint: this.generateBuildingFootprint(poi.position.x, poi.position.y, poi.capacity),
        height: this.calculateBuildingHeight(poi.type, poi.capacity, poi.properties?.terrain_height || 0),
        properties: {
          poiId: poi.id,
          address: `${poi.properties?.name || 'Building'} ${index + 1}`,
          terrain_adapted: true,
          foundation_depth: this.calculateFoundationDepth(poi.position.x, poi.position.y)
        }
      }));

    console.log(`✅ Generated ${this.buildings.length} terrain-adapted buildings`);
  }

  mapPOITypeToBuilding(poiType) {
    const mapping = [1, 3, 3, 4, 2, 1]; // Based on POI type enum
    return mapping[poiType] || 1;
  }

  generateBuildingFootprint(centerX, centerY, capacity) {
    const size = Math.sqrt(capacity) * 8;
    const halfSize = size / 2;
    return [
      { x: centerX - halfSize, y: centerY - halfSize },
      { x: centerX + halfSize, y: centerY - halfSize },
      { x: centerX + halfSize, y: centerY + halfSize },
      { x: centerX - halfSize, y: centerY + halfSize }
    ];
  }

  calculateBuildingHeight(type, capacity, terrainHeight) {
    const baseHeight = 30 + Math.sqrt(capacity) * 2;
    const terrainBonus = Math.max(0, terrainHeight * 0.05);
    return baseHeight + terrainBonus;
  }

  calculateFoundationDepth(x, y) {
    const slope = this.getSlope(x, y);
    return Math.max(2, slope * 50); // Deeper foundations for steeper terrain
  }

  createGeographicCityModel() {
    return {
      bounds: {
        minX: -5000,
        minY: -5000,
        maxX: 5000,
        maxY: 5000
      },
      metadata: {
        generationTimestamp: new Date().toISOString(),
        seed: this.seed,
        terrainProfile: this.terrainProfile,
        terrainParameters: this.terrainParams,
        geographicFeatures: this.pois.filter(poi => poi.properties?.landmark).length,
        averageTerrainSuitability: this.calculateAverageTerrainSuitability(),
        populationEstimate: this.pois.filter(poi => poi.type === 0).length * 2.5,
        cityArea: 100, // km²
        version: '2.0-geographic'
      },
      zones: this.zones,
      roads: this.roads,
      pois: this.pois,
      buildings: this.buildings
    };
  }

  calculateAverageTerrainSuitability() {
    const zonesWithSuitability = this.zones.filter(z => z.properties?.terrain_suitability);
    if (zonesWithSuitability.length === 0) return 0;

    const total = zonesWithSuitability.reduce((sum, z) => sum + z.properties.terrain_suitability, 0);
    return total / zonesWithSuitability.length;
  }
}

// CLI interface
async function generateGeographicCity() {
  const terrainProfile = process.argv[2] || 'manhattan';
  const seed = process.argv[3] || `geo-${terrainProfile}-${Date.now()}`;

  // Parse custom parameters if provided
  let customParams = null;
  if (process.argv[4]) {
    try {
      customParams = JSON.parse(process.argv[4]);
    } catch (e) {
      console.warn('Invalid custom parameters, using profile defaults');
    }
  }

  console.log(`🌍 Generating geographic city: ${terrainProfile}`);
  if (customParams) {
    console.log(`🔧 Using custom parameters:`, customParams);
  }

  const generator = new GeographicCityGenerator(terrainProfile, seed, customParams);
  const cityModel = generator.generateGeographicCity();

  // Load protobuf schema and create binary file
  const protoPath = path.join(__dirname, '../src/data/city_model.proto');
  const root = await protobuf.load(protoPath);
  const CityModel = root.lookupType('urbansynth.CityModel');

  const message = CityModel.create(cityModel);
  const buffer = CityModel.encode(message).finish();

  const outputPath = path.join(__dirname, '../public/model.pbf');
  fs.writeFileSync(outputPath, buffer);

  console.log(`✅ Geographic city generated: ${buffer.length} bytes`);
  console.log(`📊 Profile: ${terrainProfile} (${TERRAIN_PROFILES[terrainProfile]?.name || 'Custom'})`);
  console.log(`🏗️ Zones: ${cityModel.zones.length}`);
  console.log(`🛣️ Roads: ${cityModel.roads.length} (terrain-following)`);
  console.log(`🏢 POIs: ${cityModel.pois.length}`);
  console.log(`🏗️ Buildings: ${cityModel.buildings.length}`);
  console.log(`🗺️ Geographic features: ${cityModel.metadata.geographicFeatures}`);
  console.log(`📈 Avg terrain suitability: ${(cityModel.metadata.averageTerrainSuitability * 100).toFixed(1)}%`);

  const profile = TERRAIN_PROFILES[terrainProfile];
  if (profile) {
    console.log(`🏔️ Terrain characteristics:`);
    console.log(`   - Mountain height: ${profile.parameters.mountainHeight}m`);
    console.log(`   - Water level: ${profile.parameters.waterLevel}m`);
    console.log(`   - Hilliness: ${(profile.parameters.hilliness * 100).toFixed(0)}%`);
    console.log(`   - Coastal distance: ${(profile.parameters.coastalDistance / 1000).toFixed(1)}km`);
  }
}

if (require.main === module) {
  generateGeographicCity().catch(console.error);
}

module.exports = { GeographicCityGenerator, TERRAIN_PROFILES };