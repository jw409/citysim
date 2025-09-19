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
    this.generateRiver();
    this.generateRoadNetwork();
    this.generatePOIs();
    this.generateBuildings();

    return this.createCityModel();
  }

  generateZones() {
    console.log('📍 Generating realistic zones...');

    // Dense downtown core (offset from center like many real cities)
    this.zones.push({
      id: 'downtown_core',
      type: 3, // DOWNTOWN
      boundary: this.generateRectangularZone(-800, -200, 1600, 1000),
      density: 0.95,
      properties: { residential_density: 0.1, commercial_density: 0.4, office_density: 0.8 }
    });

    // Financial district (adjacent to downtown)
    this.zones.push({
      id: 'financial_district',
      type: 3, // DOWNTOWN
      boundary: this.generateRectangularZone(-800, 800, 1200, 600),
      density: 0.9,
      properties: { residential_density: 0.05, commercial_density: 0.2, office_density: 0.9 }
    });

    // Central Park (like NYC's Central Park)
    this.zones.push({
      id: 'central_park',
      type: 4, // PARK
      boundary: this.generateRectangularZone(800, -500, 800, 1000),
      density: 0.05,
      properties: { residential_density: 0, commercial_density: 0, office_density: 0 }
    });

    // Residential neighborhoods (organic grid-based placement)
    const residentialAreas = [
      // Upper East Side equivalent
      { x: 1800, y: 1000, width: 1500, height: 1800, id: 'upper_east' },
      // Greenwich Village equivalent
      { x: -1200, y: -1500, width: 1200, height: 1000, id: 'village' },
      // Brooklyn Heights equivalent
      { x: -3000, y: 1500, width: 2000, height: 1500, id: 'heights' },
      // Suburbs North
      { x: 800, y: 2500, width: 2500, height: 1500, id: 'suburbs_north' },
      // Suburbs South
      { x: -1500, y: -3000, width: 2200, height: 1200, id: 'suburbs_south' },
      // Westside
      { x: -3500, y: -800, width: 1800, height: 1600, id: 'westside' }
    ];

    residentialAreas.forEach(area => {
      this.zones.push({
        id: `residential_${area.id}`,
        type: 0, // RESIDENTIAL
        boundary: this.generateRectangularZone(area.x, area.y, area.width, area.height),
        density: 0.7,
        properties: { residential_density: 0.85, commercial_density: 0.15, office_density: 0.05 }
      });
    });

    // Commercial corridors (along major streets)
    const commercialAreas = [
      // Main commercial strip
      { x: 0, y: 1800, width: 1800, height: 400, id: 'main_strip' },
      // Shopping district
      { x: 1200, y: -1000, width: 1000, height: 600, id: 'shopping' },
      // Entertainment district
      { x: -1800, y: 500, width: 800, height: 800, id: 'entertainment' }
    ];

    commercialAreas.forEach(area => {
      this.zones.push({
        id: `commercial_${area.id}`,
        type: 1, // COMMERCIAL
        boundary: this.generateRectangularZone(area.x, area.y, area.width, area.height),
        density: 0.8,
        properties: { residential_density: 0.1, commercial_density: 0.85, office_density: 0.2 }
      });
    });

    // Industrial districts (typically on city edges, near transport)
    const industrialAreas = [
      // Port/waterfront industrial
      { x: -4500, y: -2000, width: 1500, height: 2500, id: 'port' },
      // Manufacturing zone
      { x: 3500, y: -1500, width: 1800, height: 1500, id: 'manufacturing' },
      // Logistics hub near highway
      { x: 2500, y: 3500, width: 2000, height: 1000, id: 'logistics' }
    ];

    industrialAreas.forEach(area => {
      this.zones.push({
        id: `industrial_${area.id}`,
        type: 2, // INDUSTRIAL
        boundary: this.generateRectangularZone(area.x, area.y, area.width, area.height),
        density: 0.4,
        properties: { residential_density: 0.02, commercial_density: 0.1, office_density: 0.15 }
      });
    });

    // Additional parks and green spaces throughout city
    const parks = [
      { x: -2500, y: 3000, width: 800, height: 600, id: 'riverside' },
      { x: 2800, y: 800, width: 600, height: 600, id: 'neighborhood' },
      { x: -1000, y: -2200, width: 500, height: 400, id: 'community' },
      { x: 1500, y: -2800, width: 700, height: 500, id: 'south_park' }
    ];

    parks.forEach(park => {
      this.zones.push({
        id: `park_${park.id}`,
        type: 4, // PARK
        boundary: this.generateRectangularZone(park.x, park.y, park.width, park.height),
        density: 0.05,
        properties: { residential_density: 0, commercial_density: 0, office_density: 0 }
      });
    });
  }

  generateRectangularZone(centerX, centerY, width, height) {
    // Create rectangular zones with slight irregularities for realism
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    // Add some noise for organic boundaries
    const noiseAmount = 100;

    return [
      {
        x: centerX - halfWidth + (this.noise(centerX, centerY) - 0.5) * noiseAmount,
        y: centerY - halfHeight + (this.noise(centerX + 1, centerY) - 0.5) * noiseAmount
      },
      {
        x: centerX + halfWidth + (this.noise(centerX + 2, centerY) - 0.5) * noiseAmount,
        y: centerY - halfHeight + (this.noise(centerX + 3, centerY) - 0.5) * noiseAmount
      },
      {
        x: centerX + halfWidth + (this.noise(centerX + 4, centerY) - 0.5) * noiseAmount,
        y: centerY + halfHeight + (this.noise(centerX + 5, centerY) - 0.5) * noiseAmount
      },
      {
        x: centerX - halfWidth + (this.noise(centerX + 6, centerY) - 0.5) * noiseAmount,
        y: centerY + halfHeight + (this.noise(centerX + 7, centerY) - 0.5) * noiseAmount
      }
    ];
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

  generateRiver() {
    console.log('🌊 Generating meandering river...');

    // Create a sinusoidal river that flows through the city from north to south
    const riverPoints = [];
    const riverWidth = 150 + this.random() * 100; // 150-250m wide river

    // River flows roughly north-south but with curves
    for (let y = -6000; y <= 6000; y += 150) {
      // Create meandering pattern using sine wave with some randomness
      const baseX = Math.sin(y / 1200) * 800; // Main curve
      const noise = (this.noise(y / 500, 0) - 0.5) * 300; // Add natural variation
      const x = baseX + noise;

      riverPoints.push({ x, y });
    }

    // Store river as both a road-like feature and as water data
    this.river = {
      id: 'main_river',
      type: 'water',
      path: riverPoints,
      width: riverWidth
    };

    // River is stored separately, not as a road (for visualization only)

    console.log(`✅ Generated river with ${riverPoints.length} points, width: ${riverWidth.toFixed(1)}m`);

    // Store river crossing points for bridge placement
    this.riverCrossings = this.findRiverCrossings(riverPoints, riverWidth);
  }

  findRiverCrossings(riverPoints, riverWidth) {
    // Find where major roads will need to cross the river
    const crossings = [];

    // We'll add bridges at regular intervals and at key connection points
    const bridgeInterval = 1500; // Bridge every 1.5km

    for (let y = -4500; y <= 4500; y += bridgeInterval) {
      // Find river x-coordinate at this y position
      const riverPoint = this.interpolateRiverPosition(riverPoints, y);
      if (riverPoint) {
        crossings.push({
          x: riverPoint.x,
          y: y,
          width: riverWidth * 1.2, // Bridge slightly wider than river
          type: 'bridge'
        });
      }
    }

    console.log(`✅ Planned ${crossings.length} river crossings`);
    return crossings;
  }

  interpolateRiverPosition(riverPoints, targetY) {
    // Find the river x-coordinate at a given y position
    for (let i = 0; i < riverPoints.length - 1; i++) {
      const p1 = riverPoints[i];
      const p2 = riverPoints[i + 1];

      if (p1.y <= targetY && p2.y >= targetY) {
        // Interpolate between these two points
        const ratio = (targetY - p1.y) / (p2.y - p1.y);
        const x = p1.x + (p2.x - p1.x) * ratio;
        return { x, y: targetY };
      }
    }
    return null;
  }

  generateRoadNetwork() {
    console.log('🛣️ Generating realistic road network...');

    // Create a Manhattan-style grid system instead of radial pattern
    const cityBounds = { min_x: -5000, min_y: -5000, max_x: 5000, max_y: 5000 };

    // Major highway perimeter (rectangular, not circular)
    const highways = [
      // North highway
      { x: cityBounds.min_x - 500, y: cityBounds.max_y + 500 },
      { x: cityBounds.max_x + 500, y: cityBounds.max_y + 500 },
      // East highway
      { x: cityBounds.max_x + 500, y: cityBounds.max_y + 500 },
      { x: cityBounds.max_x + 500, y: cityBounds.min_y - 500 },
      // South highway
      { x: cityBounds.max_x + 500, y: cityBounds.min_y - 500 },
      { x: cityBounds.min_x - 500, y: cityBounds.min_y - 500 },
      // West highway
      { x: cityBounds.min_x - 500, y: cityBounds.min_y - 500 },
      { x: cityBounds.min_x - 500, y: cityBounds.max_y + 500 }
    ];

    // Split into segments for realistic highway system
    this.roads.push({
      id: 'highway_north',
      type: 0, // HIGHWAY
      path: [highways[0], highways[1]],
      width: 20,
      lanes: 6,
      speed_limit: 80
    });

    this.roads.push({
      id: 'highway_east',
      type: 0, // HIGHWAY
      path: [highways[2], highways[3]],
      width: 20,
      lanes: 6,
      speed_limit: 80
    });

    this.roads.push({
      id: 'highway_south',
      type: 0, // HIGHWAY
      path: [highways[4], highways[5]],
      width: 20,
      lanes: 6,
      speed_limit: 80
    });

    this.roads.push({
      id: 'highway_west',
      type: 0, // HIGHWAY
      path: [highways[6], highways[7]],
      width: 20,
      lanes: 6,
      speed_limit: 80
    });

    // Major arterials in grid pattern (like Broadway, 5th Ave)
    const arterialSpacing = 1500;
    let roadId = 0;

    // North-South arterials
    for (let x = cityBounds.min_x; x <= cityBounds.max_x; x += arterialSpacing) {
      this.roads.push({
        id: `arterial_ns_${roadId++}`,
        type: 1, // ARTERIAL
        path: [
          { x: x, y: cityBounds.min_y },
          { x: x, y: cityBounds.max_y }
        ],
        width: 12,
        lanes: 4,
        speed_limit: 50
      });
    }

    // East-West arterials
    for (let y = cityBounds.min_y; y <= cityBounds.max_y; y += arterialSpacing) {
      this.roads.push({
        id: `arterial_ew_${roadId++}`,
        type: 1, // ARTERIAL
        path: [
          { x: cityBounds.min_x, y: y },
          { x: cityBounds.max_x, y: y }
        ],
        width: 12,
        lanes: 4,
        speed_limit: 50
      });
    }

    // Add river and bridge (natural feature affecting road layout)
    const riverY = -500;
    this.roads.push({
      id: 'bridge_main',
      type: 2, // BRIDGE
      path: [
        { x: -200, y: riverY - 50 },
        { x: 200, y: riverY + 50 }
      ],
      width: 10,
      lanes: 3,
      speed_limit: 40
    });

    // Secondary street grid (finer resolution)
    const streetSpacing = 500;
    for (let x = cityBounds.min_x + 250; x <= cityBounds.max_x; x += streetSpacing) {
      // Skip if too close to arterials
      if (Math.abs(x % arterialSpacing) > 200) {
        this.roads.push({
          id: `street_ns_${roadId++}`,
          type: 3, // LOCAL
          path: [
            { x: x, y: cityBounds.min_y + 200 },
            { x: x, y: cityBounds.max_y - 200 }
          ],
          width: 8,
          lanes: 2,
          speed_limit: 35
        });
      }
    }

    for (let y = cityBounds.min_y + 250; y <= cityBounds.max_y; y += streetSpacing) {
      if (Math.abs(y % arterialSpacing) > 200) {
        this.roads.push({
          id: `street_ew_${roadId++}`,
          type: 3, // LOCAL
          path: [
            { x: cityBounds.min_x + 200, y: y },
            { x: cityBounds.max_x - 200, y: y }
          ],
          width: 8,
          lanes: 2,
          speed_limit: 35
        });
      }
    }

    // Add some curved suburban roads for variety
    this.generateSuburbanRoads(cityBounds);

    // Add bridges where roads cross the river
    this.generateBridges();
  }

  generateSuburbanRoads(bounds) {
    // Add curved roads in residential areas for realism
    const curves = [
      // Curved residential street
      {
        id: 'suburban_curve_1',
        type: 3,
        path: [
          { x: bounds.min_x + 1000, y: bounds.min_y + 1000 },
          { x: bounds.min_x + 1200, y: bounds.min_y + 1100 },
          { x: bounds.min_x + 1400, y: bounds.min_y + 1050 },
          { x: bounds.min_x + 1600, y: bounds.min_y + 1200 }
        ],
        width: 6,
        lanes: 2,
        speed_limit: 25
      },
      // Cul-de-sac
      {
        id: 'cul_de_sac_1',
        type: 3,
        path: [
          { x: bounds.max_x - 1000, y: bounds.max_y - 1000 },
          { x: bounds.max_x - 900, y: bounds.max_y - 950 },
          { x: bounds.max_x - 850, y: bounds.max_y - 1000 },
          { x: bounds.max_x - 900, y: bounds.max_y - 1050 },
          { x: bounds.max_x - 1000, y: bounds.max_y - 1000 }
        ],
        width: 6,
        lanes: 2,
        speed_limit: 20
      }
    ];

    curves.forEach(road => this.roads.push(road));
  }

  generateBridges() {
    console.log('🌉 Generating bridges...');

    if (!this.riverCrossings || this.riverCrossings.length === 0) {
      console.log('No river crossings planned, skipping bridge generation');
      return;
    }

    this.riverCrossings.forEach((crossing, index) => {
      // Create bridge road segments that span the river
      const bridgeLength = crossing.width + 100; // Extra length on each side
      const bridgeId = `bridge_${index}`;

      // Create a bridge that crosses the river at this point
      // For east-west arterials
      if (Math.abs(crossing.y % 1500) < 100) { // Near arterial level
        this.roads.push({
          id: `${bridgeId}_ew`,
          type: 2, // COLLECTOR (bridges use collector type)
          path: [
            { x: crossing.x - bridgeLength/2, y: crossing.y },
            { x: crossing.x + bridgeLength/2, y: crossing.y }
          ],
          width: 12,
          lanes: 4,
          speed_limit: 40
        });
      }

      // For north-south arterials
      if (Math.abs(crossing.x) < 200) { // Near center line where NS roads pass
        this.roads.push({
          id: `${bridgeId}_ns`,
          type: 2, // COLLECTOR (bridges use collector type)
          path: [
            { x: crossing.x, y: crossing.y - bridgeLength/2 },
            { x: crossing.x, y: crossing.y + bridgeLength/2 }
          ],
          width: 12,
          lanes: 4,
          speed_limit: 40
        });
      }
    });

    console.log(`✅ Generated ${this.riverCrossings.length} bridge crossings`);
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
    console.log('🏢 Generating realistic buildings...');

    // Generate buildings based on zones with proper density and height gradients
    this.zones.forEach(zone => {
      this.generateBuildingsForZone(zone);
    });

    // Also generate buildings for high-capacity POIs (as landmarks)
    this.pois.forEach((poi, i) => {
      if (poi.capacity > 80) {
        const footprint = this.generateBuildingFootprint(poi.position.x, poi.position.y, 3, true);
        const height = this.getBuildingHeight(poi.zone_id, poi.type, true);

        this.buildings.push({
          id: `landmark_${i}`,
          footprint,
          height,
          zone_id: poi.zone_id,
          type: this.getBuildingType(poi.type)
        });
      }
    });
  }

  generateBuildingsForZone(zone) {
    const bounds = this.getZoneBounds(zone.boundary);
    const buildingCount = Math.floor(zone.density * 100); // More buildings in denser zones

    for (let i = 0; i < buildingCount; i++) {
      // Place buildings on a grid-like pattern with some randomness
      const gridX = bounds.min_x + (i % 10) * (bounds.width / 10);
      const gridY = bounds.min_y + Math.floor(i / 10) * (bounds.height / 10);

      // Add randomness to avoid perfect grid
      const x = gridX + (this.random() - 0.5) * 100;
      const y = gridY + (this.random() - 0.5) * 100;

      // Ensure building is within zone
      if (this.isPointInZone(x, y, zone.boundary)) {
        const footprint = this.generateBuildingFootprint(x, y, zone.type);
        const height = this.getBuildingHeight(zone.id, zone.type);

        this.buildings.push({
          id: `building_${zone.id}_${i}`,
          footprint,
          height,
          zone_id: zone.id,
          type: this.getZoneBuildingType(zone.type)
        });
      }
    }
  }

  generateBuildingFootprint(x, y, zoneType, isLandmark = false) {
    let baseSize, sides;

    switch (zoneType) {
      case 3: // DOWNTOWN - large office buildings
        baseSize = isLandmark ? 120 : 60 + this.random() * 80;
        sides = 4; // Rectangular office buildings
        break;
      case 1: // COMMERCIAL - medium stores/shops
        baseSize = 40 + this.random() * 40;
        sides = 4;
        break;
      case 2: // INDUSTRIAL - large warehouses
        baseSize = 80 + this.random() * 120;
        sides = 4;
        break;
      case 0: // RESIDENTIAL - small houses
        baseSize = 20 + this.random() * 30;
        sides = 4;
        break;
      default:
        baseSize = 30;
        sides = 4;
    }

    return this.generatePolygon(x, y, baseSize, sides);
  }

  getBuildingHeight(zoneId, zoneType, isLandmark = false) {
    // Create realistic height distributions
    if (zoneId.includes('downtown') || zoneId.includes('financial')) {
      // Downtown skyscrapers
      if (isLandmark) return 300 + this.random() * 200; // Super tall landmarks
      return 100 + this.random() * 300; // 100-400m skyscrapers
    } else if (zoneType === 1) { // Commercial
      return 30 + this.random() * 60; // 30-90m mid-rise
    } else if (zoneType === 2) { // Industrial
      return 15 + this.random() * 25; // 15-40m warehouses
    } else if (zoneType === 0) { // Residential
      if (this.random() < 0.8) {
        return 8 + this.random() * 12; // 8-20m houses
      } else {
        return 30 + this.random() * 40; // 30-70m apartment buildings
      }
    }
    return 15 + this.random() * 35;
  }

  getZoneBuildingType(zoneType) {
    switch (zoneType) {
      case 3: return 2; // OFFICE_BUILDING
      case 1: return 3; // STORE
      case 2: return 4; // WAREHOUSE
      case 0: return 0; // HOUSE
      default: return 0;
    }
  }

  getZoneBounds(boundary) {
    const xs = boundary.map(p => p.x);
    const ys = boundary.map(p => p.y);
    const min_x = Math.min(...xs);
    const max_x = Math.max(...xs);
    const min_y = Math.min(...ys);
    const max_y = Math.max(...ys);

    return {
      min_x,
      max_x,
      min_y,
      max_y,
      width: max_x - min_x,
      height: max_y - min_y
    };
  }

  isPointInZone(x, y, boundary) {
    // Simple point-in-polygon test
    let inside = false;
    for (let i = 0, j = boundary.length - 1; i < boundary.length; j = i++) {
      if (((boundary[i].y > y) !== (boundary[j].y > y)) &&
          (x < (boundary[j].x - boundary[i].x) * (y - boundary[i].y) / (boundary[j].y - boundary[i].y) + boundary[i].x)) {
        inside = !inside;
      }
    }
    return inside;
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
      river: this.river || null,
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