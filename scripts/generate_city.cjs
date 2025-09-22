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

    // Residential neighborhoods (massive coverage like real cities)
    const residentialAreas = [
      // Upper East Side equivalent
      { x: 1800, y: 1000, width: 1500, height: 1800, id: 'upper_east' },
      // Greenwich Village equivalent
      { x: -1200, y: -1500, width: 1200, height: 1000, id: 'village' },
      // Brooklyn Heights equivalent
      { x: -3000, y: 1500, width: 2000, height: 1500, id: 'heights' },
      // Suburbs North (much larger)
      { x: 800, y: 2500, width: 3500, height: 2000, id: 'suburbs_north' },
      // Suburbs South (much larger)
      { x: -1500, y: -3000, width: 3000, height: 1800, id: 'suburbs_south' },
      // Westside (expanded)
      { x: -3500, y: -800, width: 2500, height: 2200, id: 'westside' },
      // New massive residential areas to fill empty space
      { x: 3000, y: -1000, width: 2500, height: 2500, id: 'eastside' },
      { x: -2000, y: 3000, width: 3000, height: 1500, id: 'northside' },
      { x: 1500, y: -3500, width: 2000, height: 1500, id: 'southeast' },
      { x: -4500, y: -2500, width: 2000, height: 2000, id: 'southwest' },
      // Fill the gaps with more residential
      { x: 0, y: 4000, width: 2000, height: 1000, id: 'far_north' },
      { x: 2000, y: 2000, width: 1500, height: 1500, id: 'northeast' }
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

    // Commercial corridors (along major streets) - much more coverage
    const commercialAreas = [
      // Main commercial strip (expanded)
      { x: 0, y: 1800, width: 2400, height: 600, id: 'main_strip' },
      // Shopping district (larger)
      { x: 1200, y: -1000, width: 1500, height: 800, id: 'shopping' },
      // Entertainment district (expanded)
      { x: -1800, y: 500, width: 1200, height: 1000, id: 'entertainment' },
      // New commercial areas to fill gaps
      { x: 2500, y: 0, width: 1000, height: 1000, id: 'east_commercial' },
      { x: -2500, y: -1000, width: 1000, height: 1200, id: 'west_commercial' },
      { x: 500, y: -2000, width: 1200, height: 600, id: 'south_commercial' },
      { x: -1000, y: 3500, width: 1500, height: 500, id: 'north_commercial' }
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

    // Major arterials in grid pattern (like Broadway, 5th Ave) - realistic spacing
    const arterialSpacing = 600; // More realistic: arterial every 600m
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

    // Secondary street grid (realistic urban density)
    const streetSpacing = 200; // Realistic: local street every 200m
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

    // Add curved roads throughout the city for realism
    this.generateCurvedRoads(cityBounds);
    this.generateSuburbanRoads(cityBounds);

    // Add bridges where roads cross the river
    this.generateBridges();
  }

  generateCurvedRoads(bounds) {
    console.log('🛣️ Generating curved major roads...');

    // Major curved boulevards that flow through the city
    const curvedRoads = [];

    // Curved Boulevard 1: Sweeping S-curve from southwest to northeast
    const boulevard1Points = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const x = bounds.min_x + t * (bounds.max_x - bounds.min_x);
      const y = bounds.min_y + (bounds.max_y - bounds.min_y) * 0.5 +
                Math.sin(t * Math.PI * 1.5) * 1200; // S-curve with 1200m amplitude
      boulevard1Points.push({ x, y });
    }

    curvedRoads.push({
      id: 'curved_boulevard_1',
      type: 1, // ARTERIAL
      path: boulevard1Points,
      width: 14,
      lanes: 4,
      speed_limit: 55
    });

    // Curved Boulevard 2: Circular arc in the northern part
    const boulevard2Points = [];
    const centerX = 0;
    const centerY = bounds.max_y - 1500;
    const radius = 2000;
    for (let angle = -Math.PI/3; angle <= Math.PI/3; angle += Math.PI/30) {
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      boulevard2Points.push({ x, y });
    }

    curvedRoads.push({
      id: 'curved_boulevard_2',
      type: 1, // ARTERIAL
      path: boulevard2Points,
      width: 12,
      lanes: 4,
      speed_limit: 50
    });

    // Curved Boulevard 3: Diagonal curve from northwest to southeast
    const boulevard3Points = [];
    for (let i = 0; i <= 15; i++) {
      const t = i / 15;
      const x = bounds.min_x + 1000 + t * (bounds.max_x - bounds.min_x - 2000);
      const y = bounds.max_y - 500 - t * (bounds.max_y - bounds.min_y - 1000) +
                Math.cos(t * Math.PI * 2) * 800; // Wavy diagonal
      boulevard3Points.push({ x, y });
    }

    curvedRoads.push({
      id: 'curved_boulevard_3',
      type: 1, // ARTERIAL
      path: boulevard3Points,
      width: 13,
      lanes: 4,
      speed_limit: 55
    });

    // Curved local streets
    for (let i = 0; i < 6; i++) {
      const curvePoints = [];
      const startX = bounds.min_x + this.random() * (bounds.max_x - bounds.min_x);
      const startY = bounds.min_y + this.random() * (bounds.max_y - bounds.min_y);
      const length = 1000 + this.random() * 1500;
      const direction = this.random() * Math.PI * 2;

      for (let j = 0; j <= 12; j++) {
        const t = j / 12;
        const curve = Math.sin(t * Math.PI * 3) * 200; // Sinusoidal curve
        const x = startX + Math.cos(direction) * t * length + Math.cos(direction + Math.PI/2) * curve;
        const y = startY + Math.sin(direction) * t * length + Math.sin(direction + Math.PI/2) * curve;

        if (x >= bounds.min_x && x <= bounds.max_x && y >= bounds.min_y && y <= bounds.max_y) {
          curvePoints.push({ x, y });
        }
      }

      if (curvePoints.length > 3) {
        curvedRoads.push({
          id: `curved_local_${i}`,
          type: 3, // LOCAL
          path: curvePoints,
          width: 9,
          lanes: 2,
          speed_limit: 35
        });
      }
    }

    curvedRoads.forEach(road => this.roads.push(road));
  }

  generateSuburbanRoads(bounds) {
    // Add curved roads in residential areas for realism
    const curves = [];

    // Generate multiple curved suburban streets
    for (let i = 0; i < 8; i++) {
      const startX = bounds.min_x + this.random() * (bounds.max_x - bounds.min_x);
      const startY = bounds.min_y + this.random() * (bounds.max_y - bounds.min_y);

      // Create sinusoidal curved path
      const path = [];
      const length = 800 + this.random() * 400; // 800-1200m long streets
      const curveAmplitude = 50 + this.random() * 100; // How much the road curves
      const curveFrequency = 2 + this.random() * 2; // Number of curves

      for (let t = 0; t <= 1; t += 0.1) {
        const x = startX + t * length;
        const y = startY + Math.sin(t * Math.PI * curveFrequency) * curveAmplitude;

        // Check if point is within bounds
        if (x >= bounds.min_x && x <= bounds.max_x && y >= bounds.min_y && y <= bounds.max_y) {
          path.push({ x, y });
        }
      }

      if (path.length > 2) {
        curves.push({
          id: `suburban_curve_${i}`,
          type: 3, // LOCAL
          path,
          width: 6 + this.random() * 4, // 6-10m width
          lanes: 2,
          speed_limit: 25 + Math.floor(this.random() * 15) // 25-40 km/h
        });
      }
    }

    // Add circular/cul-de-sac roads
    for (let i = 0; i < 5; i++) {
      const centerX = bounds.min_x + this.random() * (bounds.max_x - bounds.min_x);
      const centerY = bounds.min_y + this.random() * (bounds.max_y - bounds.min_y);
      const radius = 50 + this.random() * 50; // 50-100m radius

      const path = [];
      for (let angle = 0; angle <= Math.PI * 2; angle += Math.PI / 8) {
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        if (x >= bounds.min_x && x <= bounds.max_x && y >= bounds.min_y && y <= bounds.max_y) {
          path.push({ x, y });
        }
      }

      if (path.length > 4) {
        curves.push({
          id: `cul_de_sac_${i}`,
          type: 3, // LOCAL
          path,
          width: 6,
          lanes: 2,
          speed_limit: 20
        });
      }
    }

    // Add diagonal boulevards that cut across the grid
    for (let i = 0; i < 3; i++) {
      const angle = (Math.PI / 6) + i * (Math.PI / 4); // Different diagonal angles
      const length = 4000;
      const startX = bounds.min_x + this.random() * 2000;
      const startY = bounds.min_y + this.random() * 2000;

      const path = [
        { x: startX, y: startY },
        { x: startX + Math.cos(angle) * length, y: startY + Math.sin(angle) * length }
      ];

      // Clip to bounds
      if (path[1].x > bounds.max_x) path[1].x = bounds.max_x;
      if (path[1].y > bounds.max_y) path[1].y = bounds.max_y;
      if (path[1].x < bounds.min_x) path[1].x = bounds.min_x;
      if (path[1].y < bounds.min_y) path[1].y = bounds.min_y;

      curves.push({
        id: `boulevard_${i}`,
        type: 1, // ARTERIAL
        path,
        width: 15,
        lanes: 4,
        speed_limit: 60
      });
    }

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

    // Track all placed buildings globally for cross-zone collision detection
    this.allPlacedBuildings = [];

    // Generate buildings based on zones with proper density and height gradients
    this.zones.forEach(zone => {
      this.generateBuildingsForZone(zone);
    });

    // Generate collision-aware landmark buildings for high-capacity POIs
    this.pois.forEach((poi, i) => {
      if (poi.capacity > 80) {
        // Try to place landmark with collision detection
        let placed = false;
        let attempts = 0;
        const maxAttempts = 5;

        while (!placed && attempts < maxAttempts) {
          attempts++;

          // Small variation in position to avoid exact POI overlap
          const finalX = poi.position.x + (this.random() - 0.5) * 20;
          const finalY = poi.position.y + (this.random() - 0.5) * 20;

          // Generate footprint with collision-aware system
          const nearestRoad = this.findNearestRoad(finalX, finalY);
          const rotation = nearestRoad ? this.calculateBuildingRotation(finalX, finalY, nearestRoad) : 0;
          const footprint = this.generateOrientedBuildingFootprint(finalX, finalY, 3, rotation);

          // Check for overlaps with existing buildings
          let overlaps = false;
          for (const existingBuilding of this.allPlacedBuildings) {
            if (this.buildingFootprintsOverlap(footprint, existingBuilding.footprint)) {
              overlaps = true;
              break;
            }
          }

          // Also check if landmark would be in water
          if (this.isPointInWater(finalX, finalY)) {
            overlaps = true; // Treat water placement as overlap
          }

          if (!overlaps) {
            const height = this.getBuildingHeight(poi.zone_id, poi.type, true);
            const landmark = {
              id: `landmark_${i}`,
              footprint,
              height,
              zone_id: poi.zone_id,
              type: this.getBuildingType(poi.type),
              rotation: rotation * 180 / Math.PI
            };
            this.buildings.push(landmark);
            this.allPlacedBuildings.push(landmark); // Add to global tracking
            placed = true;
          }
        }

        if (!placed) {
          console.log(`  Could not place landmark ${i} after ${maxAttempts} attempts (capacity: ${poi.capacity})`);
        }
      }
    });
  }

  generateBuildingsForZone(zone) {
    const bounds = this.getZoneBounds(zone.boundary);
    const blockSize = 120; // Smaller, more realistic city blocks: 120m x 120m
    const streetWidth = 15; // Realistic street width: 15m (about 4 lanes)

    console.log(`Generating buildings for zone ${zone.id} with block-based placement...`);

    // Track placed buildings for collision detection
    const placedBuildingsInZone = [];

    // Create a grid of city blocks aligned with street network
    for (let x = bounds.min_x; x < bounds.max_x; x += blockSize + streetWidth) {
      for (let y = bounds.min_y; y < bounds.max_y; y += blockSize + streetWidth) {
        // Check if this block intersects with any roads
        if (this.isBlockClearOfRoads(x, y, blockSize)) {
          // Place 6-12 buildings per block for much higher density
          const buildingsPerBlock = Math.max(3, Math.floor(zone.density * 12));

          // Track buildings placed in this block for local collision detection
          const blockBuildings = [];

          for (let i = 0; i < buildingsPerBlock; i++) {
            // Try multiple times to place building without overlap
            let placed = false;
            let attempts = 0;
            const maxAttempts = 15; // More attempts for higher density

            while (!placed && attempts < maxAttempts) {
              attempts++;

              // Create 4x3 grid within each block for better building distribution
              const gridCols = 4;
              const gridRows = 3;
              const gridX = x + (i % gridCols) * (blockSize/gridCols) + (blockSize/gridCols/2);
              const gridY = y + Math.floor(i/gridRows) * (blockSize/gridRows) + (blockSize/gridRows/2);

              // Add variation while maintaining block structure and street access
              const finalX = gridX + (this.random() - 0.5) * 20; // Reduced randomness for better access
              const finalY = gridY + (this.random() - 0.5) * 20;

              if (this.isPointInZone(finalX, finalY, zone.boundary)) {
                // Find nearest road for rotation alignment and access validation
                const nearestRoad = this.findNearestRoad(finalX, finalY);
                const roadDistance = nearestRoad ? this.pointToLineSegmentDistance(finalX, finalY, nearestRoad.p1, nearestRoad.p2) : Infinity;

                // Ensure building has reasonable street access (within 150m of a road)
                if (roadDistance > 150) {
                  continue; // Skip this position, try again
                }

                // Check if building would be placed in water (river collision)
                if (this.isPointInWater(finalX, finalY)) {
                  // console.log(`Building blocked by water at (${finalX}, ${finalY})`);
                  continue; // Skip this position - it's in water
                }

                const rotation = nearestRoad ? this.calculateBuildingRotation(finalX, finalY, nearestRoad) : 0;

                // Generate footprint with rotation
                const footprint = this.generateOrientedBuildingFootprint(finalX, finalY, zone.type, rotation);

                // Check for overlaps with existing buildings (global check)
                let overlaps = false;
                for (const existingBuilding of [...this.allPlacedBuildings, ...blockBuildings]) {
                  if (this.buildingFootprintsOverlap(footprint, existingBuilding.footprint)) {
                    overlaps = true;
                    break;
                  }
                }

                if (!overlaps) {
                  const height = this.getBuildingHeight(zone.id, zone.type);
                  const building = {
                    id: `building_${zone.id}_${Math.floor(x)}_${Math.floor(y)}_${i}`,
                    footprint,
                    height,
                    zone_id: zone.id,
                    type: this.getZoneBuildingType(zone.type),
                    rotation: rotation * 180 / Math.PI // Store rotation in degrees
                  };

                  this.buildings.push(building);
                  blockBuildings.push(building);
                  placedBuildingsInZone.push(building);
                  this.allPlacedBuildings.push(building); // Add to global tracking
                  placed = true;
                }
              }
            }

            if (!placed && attempts >= maxAttempts) {
              console.log(`  Could not place building ${i} in block at (${x}, ${y}) after ${maxAttempts} attempts`);
            }
          }
        }
      }
    }

    console.log(`  Placed ${placedBuildingsInZone.length} buildings in zone ${zone.id}`);
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

  // Check if a city block is clear of roads
  isBlockClearOfRoads(blockX, blockY, blockSize) {
    const buffer = 10; // 10m buffer from roads

    for (const road of this.roads) {
      if (!road.path || road.path.length < 2) continue;

      for (let i = 0; i < road.path.length - 1; i++) {
        const p1 = road.path[i];
        const p2 = road.path[i + 1];

        // Check if road segment intersects with this block
        if (this.lineIntersectsRect(
          p1.x, p1.y, p2.x, p2.y,
          blockX - buffer, blockY - buffer,
          blockX + blockSize + buffer, blockY + blockSize + buffer
        )) {
          return false; // Block intersects with road
        }
      }
    }
    return true; // Block is clear
  }

  // Check if line segment intersects rectangle
  lineIntersectsRect(x1, y1, x2, y2, rectX1, rectY1, rectX2, rectY2) {
    // Check if line segment intersects rectangle using separating axis theorem
    return !(x1 > rectX2 && x2 > rectX2) &&
           !(x1 < rectX1 && x2 < rectX1) &&
           !(y1 > rectY2 && y2 > rectY2) &&
           !(y1 < rectY1 && y2 < rectY1);
  }

  // Check if two building footprints overlap
  buildingFootprintsOverlap(footprintA, footprintB) {
    // First do a quick bounding box check
    const boundsA = this.getFootprintBounds(footprintA);
    const boundsB = this.getFootprintBounds(footprintB);

    if (!this.boundingBoxesOverlap(boundsA, boundsB)) {
      return false;
    }

    // Then do precise polygon overlap check
    return this.polygonsOverlap(footprintA, footprintB);
  }

  // Get bounding box of a footprint
  getFootprintBounds(footprint) {
    const xs = footprint.map(p => p.x);
    const ys = footprint.map(p => p.y);
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys)
    };
  }

  // Check if two bounding boxes overlap
  boundingBoxesOverlap(a, b) {
    return !(a.maxX < b.minX || b.maxX < a.minX || a.maxY < b.minY || b.maxY < a.minY);
  }

  // Check if two polygons overlap
  polygonsOverlap(polyA, polyB) {
    // Check if any vertex of one polygon is inside the other
    for (const point of polyA) {
      if (this.isPointInPolygon(point.x, point.y, polyB)) return true;
    }
    for (const point of polyB) {
      if (this.isPointInPolygon(point.x, point.y, polyA)) return true;
    }

    // Check if edges intersect
    for (let i = 0; i < polyA.length; i++) {
      const a1 = polyA[i];
      const a2 = polyA[(i + 1) % polyA.length];
      for (let j = 0; j < polyB.length; j++) {
        const b1 = polyB[j];
        const b2 = polyB[(j + 1) % polyB.length];
        if (this.lineSegmentsIntersect(a1, a2, b1, b2)) return true;
      }
    }

    return false;
  }

  // Check if a point is inside a polygon
  isPointInPolygon(x, y, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      if (((polygon[i].y > y) !== (polygon[j].y > y)) &&
          (x < (polygon[j].x - polygon[i].x) * (y - polygon[i].y) / (polygon[j].y - polygon[i].y) + polygon[i].x)) {
        inside = !inside;
      }
    }
    return inside;
  }

  // Check if two line segments intersect
  lineSegmentsIntersect(p1, p2, p3, p4) {
    const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
    if (Math.abs(denom) < 0.0001) return false; // Parallel lines

    const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
    const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;

    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
  }

  // Find the nearest road to a building position
  findNearestRoad(x, y) {
    let nearestRoad = null;
    let minDistance = Infinity;

    for (const road of this.roads) {
      if (!road.path || road.path.length < 2) continue;

      for (let i = 0; i < road.path.length - 1; i++) {
        const p1 = road.path[i];
        const p2 = road.path[i + 1];
        const distance = this.pointToLineSegmentDistance(x, y, p1, p2);

        if (distance < minDistance) {
          minDistance = distance;
          nearestRoad = { p1, p2, type: road.type };
        }
      }
    }

    return minDistance < 150 ? nearestRoad : null; // Only align if within 150m of a road
  }

  // Calculate distance from point to line segment
  pointToLineSegmentDistance(px, py, p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared === 0) {
      // Line segment is a point
      return Math.sqrt((px - p1.x) * (px - p1.x) + (py - p1.y) * (py - p1.y));
    }

    let t = ((px - p1.x) * dx + (py - p1.y) * dy) / lengthSquared;
    t = Math.max(0, Math.min(1, t));

    const nearestX = p1.x + t * dx;
    const nearestY = p1.y + t * dy;

    return Math.sqrt((px - nearestX) * (px - nearestX) + (py - nearestY) * (py - nearestY));
  }

  // Calculate building rotation to align with nearest road
  calculateBuildingRotation(x, y, nearestRoad) {
    const dx = nearestRoad.p2.x - nearestRoad.p1.x;
    const dy = nearestRoad.p2.y - nearestRoad.p1.y;
    let angle = Math.atan2(dy, dx);

    // Add some variation for organic feel (±15 degrees)
    angle += (this.random() - 0.5) * (Math.PI / 12);

    return angle;
  }

  // Check if a point is in water (river or other water bodies)
  isPointInWater(x, y) {
    // Check if point is near the river
    if (!this.river || !this.river.path || this.river.path.length === 0) {
      console.log('No river data available for water collision');
      return false;
    }

    const riverWidth = this.river.width || 200; // Default river width
    const bufferDistance = riverWidth / 2 + 80; // Increased buffer for safety

    // Check distance to river centerline
    for (let i = 0; i < this.river.path.length - 1; i++) {
      const p1 = this.river.path[i];
      const p2 = this.river.path[i + 1];

      if (!p1 || !p2 || typeof p1.x === 'undefined' || typeof p1.y === 'undefined') {
        continue; // Skip invalid points
      }

      const distance = this.pointToLineSegmentDistance(x, y, p1, p2);

      if (distance < bufferDistance) {
        // Debug log for testing
        // console.log(`Building blocked by water at (${x}, ${y}), distance to river: ${distance}m`);
        return true; // Point is in water or too close to water
      }
    }

    return false;
  }

  // Generate an oriented building footprint (rotated to align with roads)
  generateOrientedBuildingFootprint(x, y, zoneType, rotation = 0) {
    let baseWidth, baseHeight;

    // Realistic building sizes based on real urban planning standards
    switch (zoneType) {
      case 3: // DOWNTOWN - office buildings (smaller than previous)
        baseWidth = 25 + this.random() * 35; // 25-60m (realistic office building)
        baseHeight = 20 + this.random() * 30; // 20-50m depth
        break;
      case 1: // COMMERCIAL - stores/shops (smaller than previous)
        baseWidth = 15 + this.random() * 25; // 15-40m (realistic storefront)
        baseHeight = 10 + this.random() * 20; // 10-30m depth
        break;
      case 2: // INDUSTRIAL - warehouses (much smaller than previous)
        baseWidth = 30 + this.random() * 40; // 30-70m (realistic warehouse)
        baseHeight = 25 + this.random() * 35; // 25-60m depth
        break;
      case 0: // RESIDENTIAL - houses (slightly smaller)
        baseWidth = 8 + this.random() * 12; // 8-20m (realistic house width)
        baseHeight = 6 + this.random() * 10; // 6-16m depth
        break;
      default:
        baseWidth = 20;
        baseHeight = 15;
    }

    // Create rectangular footprint
    const halfWidth = baseWidth / 2;
    const halfHeight = baseHeight / 2;

    // Define corners before rotation
    const corners = [
      { x: -halfWidth, y: -halfHeight },
      { x: halfWidth, y: -halfHeight },
      { x: halfWidth, y: halfHeight },
      { x: -halfWidth, y: halfHeight }
    ];

    // Apply rotation and translation
    const footprint = corners.map(corner => {
      const rotatedX = corner.x * Math.cos(rotation) - corner.y * Math.sin(rotation);
      const rotatedY = corner.x * Math.sin(rotation) + corner.y * Math.cos(rotation);
      return {
        x: x + rotatedX,
        y: y + rotatedY
      };
    });

    return footprint;
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