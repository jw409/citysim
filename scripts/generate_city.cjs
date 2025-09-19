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
    this.planetaryTerrain = [];
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
    this.generatePlanetaryTerrain();

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
      name: 'Interstate 95 North',
      type: 0, // HIGHWAY
      path: [highways[0], highways[1]],
      width: 20,
      lanes: 6,
      speed_limit: 80,
      current_speed: this.generateTrafficSpeed(0),
      traffic_level: this.getTrafficLevel(this.generateTrafficSpeed(0), 80)
    });

    this.roads.push({
      id: 'highway_east',
      name: 'Route 1 East',
      type: 0, // HIGHWAY
      path: [highways[2], highways[3]],
      width: 20,
      lanes: 6,
      speed_limit: 80,
      current_speed: this.generateTrafficSpeed(0),
      traffic_level: this.getTrafficLevel(this.generateTrafficSpeed(0), 80)
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
    console.log(`🏗️ Generating buildings for zone ${zone.id} (type: ${zone.type})`);

    // Get all roads that intersect or are near this zone
    const nearbyRoads = this.roads.filter(road =>
      this.isRoadNearZone(road, zone.boundary)
    );

    if (nearbyRoads.length === 0) {
      console.log(`⚠️ No roads near zone ${zone.id}, skipping building generation`);
      return;
    }

    const buildingDensity = this.getBuildingDensityForZone(zone.type);
    let buildingCount = 0;

    // Place buildings along each nearby road
    nearbyRoads.forEach(road => {
      const buildingsOnRoad = this.placeBuildingsAlongRoad(road, zone, buildingDensity);
      buildingCount += buildingsOnRoad;
    });

    console.log(`✅ Generated ${buildingCount} buildings for zone ${zone.id}`);
  }

  getBuildingDensityForZone(zoneType) {
    switch (zoneType) {
      case 3: return { spacing: 30, setback: 15, maxPerRoad: 50 }; // DOWNTOWN - very dense
      case 1: return { spacing: 40, setback: 12, maxPerRoad: 35 }; // COMMERCIAL - dense
      case 2: return { spacing: 80, setback: 20, maxPerRoad: 15 }; // INDUSTRIAL - medium density
      case 0: return { spacing: 25, setback: 8, maxPerRoad: 60 }; // RESIDENTIAL - very dense, small
      default: return { spacing: 40, setback: 15, maxPerRoad: 30 };
    }
  }

  isRoadNearZone(road, zoneBoundary) {
    // Check if any road segment is within or near the zone
    for (let i = 0; i < road.path.length - 1; i++) {
      const p1 = road.path[i];
      const p2 = road.path[i + 1];

      // Check if road segment intersects zone or is very close
      if (this.isPointInZone(p1.x, p1.y, zoneBoundary) ||
          this.isPointInZone(p2.x, p2.y, zoneBoundary) ||
          this.isSegmentNearZone(p1, p2, zoneBoundary)) {
        return true;
      }
    }
    return false;
  }

  isSegmentNearZone(p1, p2, zoneBoundary) {
    // Check if road segment is within 100m of zone boundary
    const segments = this.getZoneSegments(zoneBoundary);

    for (const segment of segments) {
      const distance = this.distanceSegmentToSegment(p1, p2, segment.start, segment.end);
      if (distance < 100) return true;
    }
    return false;
  }

  getZoneSegments(boundary) {
    const segments = [];
    for (let i = 0; i < boundary.length; i++) {
      const start = boundary[i];
      const end = boundary[(i + 1) % boundary.length];
      segments.push({ start, end });
    }
    return segments;
  }

  distanceSegmentToSegment(p1, p2, p3, p4) {
    // Simplified distance between two line segments
    const distances = [
      this.distancePointToSegment(p1, p3, p4),
      this.distancePointToSegment(p2, p3, p4),
      this.distancePointToSegment(p3, p1, p2),
      this.distancePointToSegment(p4, p1, p2)
    ];
    return Math.min(...distances);
  }

  distancePointToSegment(point, segStart, segEnd) {
    const dx = segEnd.x - segStart.x;
    const dy = segEnd.y - segStart.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) {
      return Math.sqrt((point.x - segStart.x) ** 2 + (point.y - segStart.y) ** 2);
    }

    const t = Math.max(0, Math.min(1, ((point.x - segStart.x) * dx + (point.y - segStart.y) * dy) / (length * length)));
    const projX = segStart.x + t * dx;
    const projY = segStart.y + t * dy;

    return Math.sqrt((point.x - projX) ** 2 + (point.y - projY) ** 2);
  }

  placeBuildingsAlongRoad(road, zone, density) {
    const buildings = [];
    const { spacing, setback, maxPerRoad } = density;

    // Walk along the road and place buildings on both sides
    let currentDistance = 0;
    let buildingIndex = 0;

    for (let i = 0; i < road.path.length - 1 && buildingIndex < maxPerRoad; i++) {
      const p1 = road.path[i];
      const p2 = road.path[i + 1];

      const segmentLength = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
      const segmentAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

      // Place buildings along this road segment
      let distanceAlongSegment = 0;
      while (distanceAlongSegment < segmentLength && buildingIndex < maxPerRoad) {
        // Calculate position along road
        const t = distanceAlongSegment / segmentLength;
        const roadX = p1.x + t * (p2.x - p1.x);
        const roadY = p1.y + t * (p2.y - p1.y);

        // Place buildings on both sides of the road
        const perpAngle1 = segmentAngle + Math.PI / 2; // Left side
        const perpAngle2 = segmentAngle - Math.PI / 2; // Right side

        // Left side building
        const leftX = roadX + Math.cos(perpAngle1) * setback;
        const leftY = roadY + Math.sin(perpAngle1) * setback;

        if (this.isPointInZone(leftX, leftY, zone.boundary) &&
            !this.isTooCloseToExistingBuilding(leftX, leftY) &&
            !this.isInRiver(leftX, leftY)) {
          this.createBuildingAtLocation(leftX, leftY, zone, buildingIndex++, segmentAngle);
        }

        // Right side building
        const rightX = roadX + Math.cos(perpAngle2) * setback;
        const rightY = roadY + Math.sin(perpAngle2) * setback;

        if (this.isPointInZone(rightX, rightY, zone.boundary) &&
            !this.isTooCloseToExistingBuilding(rightX, rightY) &&
            !this.isInRiver(rightX, rightY) &&
            buildingIndex < maxPerRoad) {
          this.createBuildingAtLocation(rightX, rightY, zone, buildingIndex++, segmentAngle);
        }

        distanceAlongSegment += spacing;
      }
    }

    return buildingIndex;
  }

  isTooCloseToExistingBuilding(x, y, minDistance = 30) {
    return this.buildings.some(building => {
      if (!building.footprint || building.footprint.length === 0) return false;

      // Check distance to building center
      const centerX = building.footprint.reduce((sum, p) => sum + p.x, 0) / building.footprint.length;
      const centerY = building.footprint.reduce((sum, p) => sum + p.y, 0) / building.footprint.length;

      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      return distance < minDistance;
    });
  }

  isInRiver(x, y) {
    if (!this.river) return false;

    // Check if point is within river bounds
    for (let i = 0; i < this.river.path.length - 1; i++) {
      const p1 = this.river.path[i];
      const p2 = this.river.path[i + 1];

      const distance = this.distancePointToSegment({ x, y }, p1, p2);
      if (distance < this.river.width / 2) {
        return true;
      }
    }
    return false;
  }

  createBuildingAtLocation(x, y, zone, index, roadAngle = 0) {
    const footprint = this.generateBuildingFootprint(x, y, zone.type, false, roadAngle);
    const height = this.getBuildingHeight(zone.id, zone.type);
    const address = this.generateBuildingAddress(x, y, zone, index);
    const capacity = this.getBuildingCapacity(zone.type, height);

    this.buildings.push({
      id: `building_${zone.id}_${index}`,
      footprint,
      height,
      zone_id: zone.id,
      type: this.getZoneBuildingType(zone.type),
      address: address,
      capacity: capacity,
      occupancy: Math.floor(capacity * (0.7 + this.random() * 0.3)) // 70-100% occupancy
    });
  }

  generateRoadName(roadType, index) {
    const roadTypeNames = ['Highway', 'Freeway', 'Boulevard', 'Avenue', 'Street'];
    const streetNames = [
      'Main', 'Oak', 'First', 'Park', 'Washington', 'Second', 'Maple', 'Church',
      'Third', 'Elm', 'Cedar', 'Pine', 'Lincoln', 'Spring', 'Fourth', 'River',
      'Mill', 'Lake', 'Hill', 'State', 'Broadway', 'Central', 'Union', 'Market',
      'Jackson', 'Franklin', 'Jefferson', 'Madison', 'Monroe', 'Adams'
    ];

    const typeName = roadTypeNames[Math.min(roadType, roadTypeNames.length - 1)];
    const streetName = streetNames[index % streetNames.length];
    return `${streetName} ${typeName}`;
  }

  generateTrafficSpeed(roadType) {
    const speedLimits = [80, 70, 60, 50, 40]; // km/hr by road type
    const baseSpeed = speedLimits[roadType] || 40;
    const congestion = 0.6 + this.random() * 0.4; // 60-100% of speed limit
    return Math.round(baseSpeed * congestion);
  }

  getTrafficLevel(currentSpeed, speedLimit) {
    const ratio = currentSpeed / speedLimit;
    if (ratio > 0.8) return 'Light';
    if (ratio > 0.5) return 'Moderate';
    if (ratio > 0.3) return 'Heavy';
    return 'Congested';
  }

  generateBuildingAddress(x, y, zone, index) {
    // Generate street number based on position along road
    const streetNumber = Math.abs(Math.floor(x / 10)) + Math.abs(Math.floor(y / 10)) + 1;
    const streetName = this.getNearestStreetName(x, y);
    return `${streetNumber} ${streetName}`;
  }

  getNearestStreetName(x, y) {
    // Find the closest road to this building
    let closestRoad = null;
    let minDistance = Infinity;

    this.roads.forEach(road => {
      if (road.name) {
        const distance = this.getDistanceToRoad(x, y, road);
        if (distance < minDistance) {
          minDistance = distance;
          closestRoad = road;
        }
      }
    });

    return closestRoad?.name || 'Unknown Street';
  }

  getDistanceToRoad(x, y, road) {
    let minDistance = Infinity;
    for (let i = 0; i < road.path.length - 1; i++) {
      const distance = this.distancePointToSegment(
        { x, y },
        road.path[i],
        road.path[i + 1]
      );
      minDistance = Math.min(minDistance, distance);
    }
    return minDistance;
  }

  getBuildingCapacity(zoneType, height) {
    const floors = Math.ceil(height / 3.5);
    switch (zoneType) {
      case 3: // DOWNTOWN - office
        return floors * 150; // 150 people per floor
      case 1: // COMMERCIAL - retail
        return floors * 80; // 80 customers per floor
      case 2: // INDUSTRIAL - warehouse
        return floors * 30; // 30 workers per floor
      case 0: // RESIDENTIAL - housing
        return Math.max(1, Math.floor(floors / 3)); // 1 family per 3 floors
      default:
        return floors * 50;
    }
  }

  generateBuildingFootprint(x, y, zoneType, isLandmark = false, roadAngle = 0) {
    let width, depth;

    switch (zoneType) {
      case 3: // DOWNTOWN - office buildings
        width = isLandmark ? 60 : 20 + this.random() * 40;
        depth = isLandmark ? 60 : 15 + this.random() * 30;
        break;
      case 1: // COMMERCIAL - stores/shops
        width = 15 + this.random() * 25;
        depth = 12 + this.random() * 20;
        break;
      case 2: // INDUSTRIAL - warehouses
        width = 30 + this.random() * 50;
        depth = 40 + this.random() * 80;
        break;
      case 0: // RESIDENTIAL - houses
        width = 8 + this.random() * 12;
        depth = 10 + this.random() * 15;
        break;
      default:
        width = 15;
        depth = 15;
    }

    // Align building with road (perpendicular to road direction)
    const buildingAngle = roadAngle + Math.PI / 2;

    // Create rectangular footprint aligned with road
    const points = [
      { x: -width/2, y: -depth/2 },
      { x: width/2, y: -depth/2 },
      { x: width/2, y: depth/2 },
      { x: -width/2, y: depth/2 }
    ];

    // Rotate and translate points
    return points.map(p => ({
      x: x + p.x * Math.cos(buildingAngle) - p.y * Math.sin(buildingAngle),
      y: y + p.x * Math.sin(buildingAngle) + p.y * Math.cos(buildingAngle)
    }));
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

  generatePlanetaryTerrain() {
    console.log('🌍 Generating planetary terrain...');

    // Generate terrain at multiple scales for performance
    const scales = [
      { name: 'city', scale: 1, resolution: 250, extent: 15000 },      // 15km around city
      { name: 'regional', scale: 10, resolution: 1000, extent: 100000 }, // 100km region
      { name: 'continental', scale: 100, resolution: 5000, extent: 500000 }, // 500km continent
      { name: 'global', scale: 1000, resolution: 20000, extent: 2000000 }   // 2000km global
    ];

    scales.forEach(scaleConfig => {
      const terrainPoints = this.generateTerrainForScale(scaleConfig);
      this.planetaryTerrain.push({
        scale: scaleConfig.scale,
        name: scaleConfig.name,
        points: terrainPoints,
        extent: scaleConfig.extent
      });
      console.log(`  ✅ Generated ${terrainPoints.length} ${scaleConfig.name} terrain points`);
    });
  }

  generateTerrainForScale(config) {
    const { scale, resolution, extent } = config;
    const points = [];
    const cityBounds = {
      min_x: -CITY_SIZE/2,
      min_y: -CITY_SIZE/2,
      max_x: CITY_SIZE/2,
      max_y: CITY_SIZE/2
    };

    // Calculate terrain bounds based on extent
    const halfExtent = extent / 2;

    for (let x = -halfExtent; x <= halfExtent; x += resolution) {
      for (let y = -halfExtent; y <= halfExtent; y += resolution) {

        let elevation, terrainType, color;

        if (scale === 1) {
          // City scale - detailed local terrain
          elevation = this.getCityScaleElevation(x, y);
          terrainType = this.getCityTerrainType(elevation);
          color = this.getCityTerrainColor(terrainType, elevation);
        } else if (scale === 10) {
          // Regional scale - hills and valleys
          elevation = this.getRegionalElevation(x, y);
          terrainType = this.getRegionalTerrainType(elevation);
          color = this.getRegionalTerrainColor(terrainType, elevation);
        } else if (scale === 100) {
          // Continental scale - mountain ranges
          elevation = this.getContinentalElevation(x, y);
          terrainType = this.getContinentalTerrainType(elevation);
          color = this.getContinentalTerrainColor(terrainType, elevation);
        } else {
          // Global scale - continental features
          elevation = this.getGlobalElevation(x, y);
          terrainType = this.getGlobalTerrainType(elevation);
          color = this.getGlobalTerrainColor(terrainType, elevation);
        }

        points.push({
          x,
          y,
          elevation,
          terrainType,
          color: color,
          radius: Math.max(resolution * 0.4, 20)
        });
      }
    }

    return points;
  }

  // City scale elevation (building-level detail)
  getCityScaleElevation(x, y) {
    const baseNoise = this.noise(x * 0.001, y * 0.001) * 30;
    const detailNoise = this.noise(x * 0.005, y * 0.005) * 10;
    return baseNoise + detailNoise;
  }

  getCityTerrainType(elevation) {
    if (elevation < -5) return 'water';
    if (elevation < 10) return 'lowland';
    if (elevation < 25) return 'grassland';
    if (elevation < 35) return 'forest';
    return 'hills';
  }

  getCityTerrainColor(terrainType, elevation) {
    const colors = {
      water: [70, 130, 180, 200],
      lowland: [120, 150, 80, 200],
      grassland: [95, 115, 70, 200],
      forest: [65, 95, 55, 200],
      hills: [115, 105, 90, 200]
    };
    return colors[terrainType] || [150, 150, 150, 200];
  }

  // Regional scale elevation (county-level features)
  getRegionalElevation(x, y) {
    const continentalNoise = this.noise(x * 0.00003, y * 0.00003) * 200;
    const mountainNoise = this.noise(x * 0.0003, y * 0.0003) * 400;
    const hillNoise = this.noise(x * 0.002, y * 0.002) * 100;
    return continentalNoise + mountainNoise + hillNoise;
  }

  getRegionalTerrainType(elevation) {
    if (elevation < -20) return 'ocean';
    if (elevation < 50) return 'coastal';
    if (elevation < 200) return 'plains';
    if (elevation < 500) return 'highlands';
    return 'mountains';
  }

  getRegionalTerrainColor(terrainType, elevation) {
    const colors = {
      ocean: [25, 25, 112, 220],
      coastal: [70, 130, 180, 220],
      plains: [154, 205, 50, 220],
      highlands: [107, 142, 35, 220],
      mountains: [139, 137, 137, 220]
    };
    return colors[terrainType] || [160, 160, 160, 220];
  }

  // Continental scale elevation (large mountain ranges)
  getContinentalElevation(x, y) {
    const continentalNoise = this.noise(x * 0.000005, y * 0.000005) * 1000;
    const majorMountains = this.noise(x * 0.00005, y * 0.00005) * 2000;
    const minorFeatures = this.noise(x * 0.0005, y * 0.0005) * 300;
    return continentalNoise + majorMountains + minorFeatures;
  }

  getContinentalTerrainType(elevation) {
    if (elevation < -100) return 'deep_ocean';
    if (elevation < 0) return 'ocean';
    if (elevation < 500) return 'lowlands';
    if (elevation < 1500) return 'plateaus';
    if (elevation < 3000) return 'mountains';
    return 'high_peaks';
  }

  getContinentalTerrainColor(terrainType, elevation) {
    const colors = {
      deep_ocean: [25, 25, 112, 200],
      ocean: [65, 105, 225, 200],
      lowlands: [34, 139, 34, 200],
      plateaus: [188, 143, 143, 200],
      mountains: [139, 137, 137, 200],
      high_peaks: [255, 255, 255, 200]
    };
    return colors[terrainType] || [160, 160, 160, 200];
  }

  // Global scale elevation (continental plates)
  getGlobalElevation(x, y) {
    const tectonicNoise = this.noise(x * 0.000001, y * 0.000001) * 3000;
    const continentalShelf = this.noise(x * 0.000008, y * 0.000008) * 1500;
    const majorFeatures = this.noise(x * 0.00003, y * 0.00003) * 800;
    return tectonicNoise + continentalShelf + majorFeatures;
  }

  getGlobalTerrainType(elevation) {
    if (elevation < -2000) return 'abyssal_ocean';
    if (elevation < -500) return 'deep_ocean';
    if (elevation < 0) return 'continental_shelf';
    if (elevation < 1000) return 'lowlands';
    if (elevation < 2500) return 'plateaus';
    if (elevation < 4000) return 'mountains';
    return 'high_peaks';
  }

  getGlobalTerrainColor(terrainType, elevation) {
    const colors = {
      abyssal_ocean: [15, 15, 80, 180],
      deep_ocean: [25, 25, 112, 180],
      continental_shelf: [65, 105, 225, 180],
      lowlands: [34, 139, 34, 180],
      plateaus: [188, 143, 143, 180],
      mountains: [139, 137, 137, 180],
      high_peaks: [255, 255, 255, 180]
    };
    return colors[terrainType] || [160, 160, 160, 180];
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
      planetaryTerrain: this.planetaryTerrain,
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

    // Write protobuf to file
    fs.writeFileSync(options.output, buffer);

    // Also save planetary terrain as JSON
    const terrainOutputPath = options.output.replace('.pbf', '-terrain.json');
    const terrainData = {
      seed: options.seed,
      scales: cityData.planetaryTerrain,
      generatedAt: new Date().toISOString()
    };
    fs.writeFileSync(terrainOutputPath, JSON.stringify(terrainData));

    console.log(`✅ City model generated successfully!`);
    console.log(`📊 Stats:`);
    console.log(`   - Seed: ${options.seed}`);
    console.log(`   - Zones: ${cityData.zones.length}`);
    console.log(`   - Roads: ${cityData.roads.length}`);
    console.log(`   - POIs: ${cityData.pois.length}`);
    console.log(`   - Buildings: ${cityData.buildings.length}`);
    console.log(`   - Planetary terrain scales: ${cityData.planetaryTerrain.length}`);
    console.log(`   - File size: ${(buffer.length / 1024).toFixed(1)} KB`);
    console.log(`   - Output: ${options.output}`);
    console.log(`   - Terrain: ${terrainOutputPath}`);

  } catch (error) {
    console.error('❌ City generation failed:', error);
    process.exit(1);
  }
}

main();