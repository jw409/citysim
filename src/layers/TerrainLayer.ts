import { PolygonLayer } from '@deck.gl/layers';
import { TerrainTextureAtlas, TerrainNoiseGenerator, getTerrainTextureKey } from '../utils/terrainTextureGenerator';
import { distance2D, exponentialDecayHeight } from '../utils/coordinates';

// Enhanced terrain generation with multiple noise functions
class EnhancedTerrainGenerator {
  private static instance: EnhancedTerrainGenerator;
  private textureAtlas: TerrainTextureAtlas;
  private terrainCache: Map<string, { elevation: number; textureKey: string; materials: any; slope: number }> = new Map();

  private constructor() {
    this.textureAtlas = new TerrainTextureAtlas(2048);
    this.textureAtlas.generateAtlas();
  }

  public static getInstance(): EnhancedTerrainGenerator {
    if (!EnhancedTerrainGenerator.instance) {
      EnhancedTerrainGenerator.instance = new EnhancedTerrainGenerator();
    }
    return EnhancedTerrainGenerator.instance;
  }

  public getTextureAtlas(): TerrainTextureAtlas {
    return this.textureAtlas;
  }

  public getTerrainData(x: number, y: number): { elevation: number; textureKey: string; materials: any; slope: number } {
    const cacheKey = `${Math.floor(x/10)}_${Math.floor(y/10)}`;
    let cached = this.terrainCache.get(cacheKey);

    if (!cached) {
      const elevation = this.calculateTerrainHeight(x, y);
      const slope = this.calculateSlope(x, y);
      const urbanFactor = this.calculateUrbanFactor(x, y);
      const distanceFromWater = this.calculateDistanceFromWater(x, y);

      const textureKey = getTerrainTextureKey(elevation, slope, urbanFactor, distanceFromWater);
      const materials = this.textureAtlas.getTextureConfig(textureKey)?.materials;

      cached = { elevation, textureKey, materials, slope };
      this.terrainCache.set(cacheKey, cached);
    }

    return cached;
  }

  private calculateTerrainHeight(x: number, y: number): number {
    // Multi-scale Fractional Brownian Motion for realistic terrain
    const scale = 0.0008;
    const primaryTerrain = TerrainNoiseGenerator.fractionalBrownianMotion(
      x * scale, y * scale, 6, 0.6, 1
    ) * 25;

    // Ridged noise for mountain ridges and valleys
    const ridgedTerrain = TerrainNoiseGenerator.ridgedNoise(
      x * scale * 0.5, y * scale * 0.5, 4
    ) * 15;

    // Large-scale terrain features using Perlin noise
    const largeTerrain = TerrainNoiseGenerator.perlinNoise(
      x * scale * 0.3, y * scale * 0.3
    ) * 40;

    // Create prominent hills with smooth falloff
    const hills = this.calculateHillContributions(x, y);

    // Combine all terrain components
    const baseTerrain = primaryTerrain + ridgedTerrain * 0.7 + largeTerrain * 0.4;
    const totalElevation = baseTerrain * 0.4 + hills;

    // Realistic urban core: cities are built on flat land, not hills
    const distanceFromCenter = Math.sqrt(x * x + y * y);

    // Add major river running through city center (like Thames, Seine, Hudson River)
    const riverElevation = this.calculateRiverElevation(x, y);

    // Create completely flat urban core (0-3km radius) like real cities
    if (distanceFromCenter < 3000) {
      const baseElevation = Math.max(-2, Math.min(2, totalElevation * 0.05)); // Nearly flat urban core
      return Math.min(baseElevation, riverElevation); // River carves through the flat urban area
    }

    // Gentle suburban transition zone (3-6km)
    if (distanceFromCenter < 6000) {
      const suburbanFactor = (distanceFromCenter - 3000) / 3000; // 0 to 1
      const suburbanElevation = totalElevation * (0.05 + suburbanFactor * 0.3); // Gradual elevation increase
      return Math.min(suburbanElevation, riverElevation); // River continues through suburbs
    }

    // Rural areas can have full terrain elevation but still influenced by river
    const ruralTransition = Math.min(1, (distanceFromCenter - 6000) / 2000);
    const flatteningFactor = 0.35 + (ruralTransition * 0.65);
    const ruralElevation = totalElevation * flatteningFactor;

    return Math.min(ruralElevation, riverElevation); // River flows through entire terrain
  }

  private calculateHillContributions(x: number, y: number): number {
    // EXTREME CLIFFSIDE CITY - 2x higher cliff formations with ocean at bottom
    const hills = [
      { x: 7000, y: 0, height: 1600, radius: 4000 },      // Eastern cliff wall - EXTREME CLIFF
      { x: -7000, y: 0, height: 1500, radius: 3800 },     // Western cliff wall - MEGA TOWERING
      { x: 0, y: 8000, height: 1400, radius: 4200 },      // Northern highlands - MASSIVE MOUNTAIN
      { x: 4000, y: -6000, height: 1300, radius: 3600 },  // Southeast cliff - EXTREME RIDGE
      { x: -4000, y: 6000, height: 1200, radius: 3400 }   // Northwest peaks - ULTRA HIGH PLATEAU
    ];

    let totalHillHeight = 0;

    for (const hill of hills) {
      // Smooth hill profile with natural variation using utility function
      const hillBase = exponentialDecayHeight(x, y, hill.x, hill.y, hill.height, hill.radius, 1.8);

      if (hillBase > 2) {
        // Add surface variation to hills
        const variation = TerrainNoiseGenerator.perlinNoise(
          x * 0.001 + hill.x * 0.0001,
          y * 0.001 + hill.y * 0.0001
        ) * hillBase * 0.12;

        totalHillHeight += hillBase + variation;
      }
    }

    return totalHillHeight;
  }

  public calculateSlope(x: number, y: number): number {
    const sampleDistance = 50;
    const elevationEast = this.calculateTerrainHeight(x + sampleDistance, y);
    const elevationWest = this.calculateTerrainHeight(x - sampleDistance, y);
    const elevationNorth = this.calculateTerrainHeight(x, y + sampleDistance);
    const elevationSouth = this.calculateTerrainHeight(x, y - sampleDistance);

    const slopeX = (elevationEast - elevationWest) / (sampleDistance * 2);
    const slopeY = (elevationNorth - elevationSouth) / (sampleDistance * 2);

    return Math.sqrt(slopeX * slopeX + slopeY * slopeY);
  }

  private calculateUrbanFactor(x: number, y: number): number {
    const distanceFromCenter = Math.sqrt(x * x + y * y);
    return Math.max(0, 1 - (distanceFromCenter / 5000));
  }

  private calculateDistanceFromWater(x: number, y: number): number {
    // Simplified water distance calculation
    // In a real implementation, this would check actual water body positions
    return Math.min(
      distance2D(x, y, 2000, -1000), // River 1
      distance2D(x, y, -1500, 2000)  // River 2
    );
  }

  private calculateRiverElevation(x: number, y: number): number {
    // DRAMATIC OCEAN BAY SYSTEM - Multiple deep channels creating cliff city on islands/peninsulas

    let minElevation = 1000; // Start high, find lowest water level

    // Main ocean bay (runs east-west through city center)
    const mainBayY = 0;
    const mainBayWidth = 1500; // MASSIVE ocean bay
    const mainBayDepth = 60;   // Very deep ocean channel

    const distanceFromMainBay = Math.abs(y - mainBayY);
    if (distanceFromMainBay <= mainBayWidth / 2) {
      const normalizedDist = distanceFromMainBay / (mainBayWidth / 2);
      const depthFactor = 1 - (normalizedDist * normalizedDist);
      const oceanElevation = -mainBayDepth * depthFactor;
      minElevation = Math.min(minElevation, oceanElevation);
    }

    // Northern fjord - creates dramatic cliff separation
    const northFjordY = 3500;
    const northFjordWidth = 800;
    const northFjordDepth = 40;

    const distanceFromNorthFjord = Math.abs(y - northFjordY);
    if (distanceFromNorthFjord <= northFjordWidth / 2) {
      const normalizedDist = distanceFromNorthFjord / (northFjordWidth / 2);
      const depthFactor = 1 - (normalizedDist * normalizedDist);
      const fjordElevation = -northFjordDepth * depthFactor;
      minElevation = Math.min(minElevation, fjordElevation);
    }

    // Southern fjord - creates another cliff separation
    const southFjordY = -3500;
    const southFjordWidth = 800;
    const southFjordDepth = 40;

    const distanceFromSouthFjord = Math.abs(y - southFjordY);
    if (distanceFromSouthFjord <= southFjordWidth / 2) {
      const normalizedDist = distanceFromSouthFjord / (southFjordWidth / 2);
      const depthFactor = 1 - (normalizedDist * normalizedDist);
      const fjordElevation = -southFjordDepth * depthFactor;
      minElevation = Math.min(minElevation, fjordElevation);
    }

    // Eastern ocean inlet - connects to main bay
    const eastInletX = 5000;
    const eastInletWidth = 600;
    const eastInletDepth = 35;

    const distanceFromEastInlet = Math.abs(x - eastInletX);
    if (distanceFromEastInlet <= eastInletWidth / 2) {
      const normalizedDist = distanceFromEastInlet / (eastInletWidth / 2);
      const depthFactor = 1 - (normalizedDist * normalizedDist);
      const inletElevation = -eastInletDepth * depthFactor;
      minElevation = Math.min(minElevation, inletElevation);
    }

    return minElevation === 1000 ? 1000 : minElevation;
  }

  private getDistanceToRiverCenterline(x: number, y: number): number {
    // River follows S-curve through city: enters from northwest, curves through center, exits southeast
    // Parametric curve for natural river meandering

    // Project point onto the river's flow direction
    const flowProgress = (x + y + 8000) / 16000; // Normalize to 0-1 along river length

    // River centerline with natural curves (like a real river)
    const curveAmplitude = 1500; // How much the river curves
    const centerlineX = flowProgress * 8000 - 4000; // -4000 to +4000
    const centerlineY = flowProgress * 8000 - 4000; // -4000 to +4000

    // Add natural meandering curves
    const meander1 = Math.sin(flowProgress * Math.PI * 2) * curveAmplitude * 0.3;
    const meander2 = Math.sin(flowProgress * Math.PI * 4 + 1) * curveAmplitude * 0.15;

    // Final river centerline with curves
    const riverCenterX = centerlineX + meander1;
    const riverCenterY = centerlineY + meander2;

    // Distance from point to river centerline
    return Math.sqrt((x - riverCenterX) * (x - riverCenterX) + (y - riverCenterY) * (y - riverCenterY));
  }

  private getRiverWidth(x: number, y: number): number {
    const distanceFromCityCenter = Math.sqrt(x * x + y * y);

    // River width varies realistically - make it MORE prominent:
    // - Medium in the hills/countryside (300m)
    // - Wide through suburbs (500m)
    // - Very wide through city center (800m)
    // - Massive near the mouth (1200m at southeast edge)

    if (distanceFromCityCenter < 2000) {
      return 800; // Very wide through dense city center - PROMINENT
    } else if (distanceFromCityCenter < 5000) {
      return 500; // Wide through suburbs
    } else {
      // Varies based on distance to mouth (southeast corner)
      const distanceToMouth = Math.sqrt((x - 6000) * (x - 6000) + (y - 6000) * (y - 6000));
      if (distanceToMouth < 3000) {
        return 1200; // Massive near mouth - like Hudson River
      }
      return 300; // Medium in rural/mountainous areas
    }
  }

  private smoothStep(edge0: number, edge1: number, x: number): number {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }
}

// Legacy function maintained for compatibility - now uses enhanced generator
function getTerrainHeight(x: number, y: number): number {
  const generator = EnhancedTerrainGenerator.getInstance();
  return generator.getTerrainData(x, y).elevation;
}

export function createTerrainLayer() {
  // Initialize the enhanced terrain generator
  const generator = EnhancedTerrainGenerator.getInstance();
  const textureAtlas = generator.getTextureAtlas();
  const textureRegions = textureAtlas.getTextureRegions();

  // Use the same coordinate system as buildings (meters from city center)
  const terrainSize = 12000; // 12km x 12km to cover entire city
  const patchSize = 400; // Smaller patches (400m x 400m) for better texture resolution
  const patchesPerSide = Math.ceil(terrainSize / patchSize);
  const halfSize = terrainSize / 2;

  const terrainPatches = [];

  for (let x = 0; x < patchesPerSide; x++) {
    for (let y = 0; y < patchesPerSide; y++) {
      const centerX = -halfSize + (x + 0.5) * patchSize;
      const centerY = -halfSize + (y + 0.5) * patchSize;

      // Get enhanced terrain data including texture information
      const terrainData = generator.getTerrainData(centerX, centerY);
      const { elevation, textureKey, materials, slope } = terrainData;

      // Get texture UV coordinates from atlas
      const textureRegion = textureRegions[textureKey];
      if (!textureRegion) {
        console.warn(`Missing texture region for key: ${textureKey}`);
        continue;
      }

      // Calculate lighting effects based on slope and environment
      const distanceFromCenter = Math.sqrt(centerX * centerX + centerY * centerY);
      const urbanFactor = Math.max(0, 1 - (distanceFromCenter / 5000));

      // Enhanced slope-based lighting calculation
      const slopeShading = calculateSlopeShading(slope, centerX, centerY);
      const atmosphericEffect = calculateAtmosphericEffect(distanceFromCenter);

      // Base color from texture (we'll still use some color for lighting effects)
      const baseColor = getTextureBasedColor(textureKey, elevation, urbanFactor);

      // Apply lighting and atmospheric effects
      const finalColor = [
        Math.max(20, Math.min(255, Math.floor(baseColor[0] * slopeShading * atmosphericEffect.lighting + atmosphericEffect.haze))),
        Math.max(20, Math.min(255, Math.floor(baseColor[1] * slopeShading * atmosphericEffect.lighting + atmosphericEffect.haze))),
        Math.max(20, Math.min(255, Math.floor(baseColor[2] * slopeShading * atmosphericEffect.lighting + atmosphericEffect.haze * 1.1))),
        255
      ];

      // Create terrain patch with texture coordinates
      const halfPatch = patchSize / 2;
      terrainPatches.push({
        id: `terrain-${x}-${y}`,
        polygon: [
          [centerX - halfPatch, centerY - halfPatch],
          [centerX + halfPatch, centerY - halfPatch],
          [centerX + halfPatch, centerY + halfPatch],
          [centerX - halfPatch, centerY + halfPatch]
        ],
        elevation: elevation,
        color: finalColor,
        textureKey: textureKey,
        textureCoords: [
          [textureRegion.x, textureRegion.y], // Bottom-left
          [textureRegion.x + textureRegion.width, textureRegion.y], // Bottom-right
          [textureRegion.x + textureRegion.width, textureRegion.y + textureRegion.height], // Top-right
          [textureRegion.x, textureRegion.y + textureRegion.height] // Top-left
        ],
        materials: materials || {
          ambient: 0.4,
          diffuse: 0.8,
          specular: 0.1,
          roughness: 0.8
        }
      });
    }
  }

  return new PolygonLayer({
    id: 'terrain-layer',
    data: terrainPatches,
    coordinateSystem: 2, // COORDINATE_SYSTEM.METER_OFFSETS to match buildings
    coordinateOrigin: [-74.0060, 40.7128, 0], // NYC center
    getPolygon: (d: any) => d.polygon,
    getElevation: (d: any) => d.elevation,
    getFillColor: (d: any) => d.color,
    getLineColor: [0, 0, 0, 0], // No borders for seamless terrain
    getLineWidth: 0,
    extruded: true,
    wireframe: false,
    filled: true,
    stroked: false,
    elevationScale: 1.0, // 1:1 scale to match building heights
    pickable: false,
    // Dynamic material properties based on terrain type
    material: (d: any) => ({
      ambient: d.materials?.ambient || 0.4,
      diffuse: d.materials?.diffuse || 0.8,
      shininess: 1 / (d.materials?.roughness || 0.8), // Convert roughness to shininess
      specularColor: d.materials?.metallic > 0.1 ? [100, 100, 120] : [40, 45, 50]
    }),
    // Enhanced lighting settings optimized for textured terrain
    lightSettings: {
      lightsPosition: [-74.0060, 40.7128, 5000, -74.0060, 40.7128, 5000],
      ambientRatio: 0.3,   // Lower ambient for better texture definition
      diffuseRatio: 0.7,   // Higher diffuse for realistic lighting
      specularRatio: 0.05, // Minimal specular for natural terrain
      numberOfLights: 2
    },
    // Note: Actual texture mapping would require a TextureLayer or custom shader
    // For now, we use enhanced color-based representation
    updateTriggers: {
      getFillColor: [terrainPatches.length] // Trigger updates when terrain changes
    }
  });
}

// Helper functions for enhanced terrain rendering
function calculateSlopeShading(slope: number, x: number, y: number): number {
  // Enhanced slope-based shading with directional lighting
  const lightDirection = { x: 0.5, y: 0.7, z: 0.8 }; // Soft afternoon sun
  const normalizedSlope = Math.min(slope, 1.0); // Clamp extreme slopes

  // Calculate surface normal approximation
  const slopeEffect = 1 + (normalizedSlope * lightDirection.y - normalizedSlope * lightDirection.x) * 0.4;
  return Math.max(0.5, Math.min(1.5, slopeEffect));
}

function calculateAtmosphericEffect(distanceFromCenter: number): { lighting: number; haze: number } {
  const atmosphericDistance = Math.min(1, distanceFromCenter / 10000);
  return {
    lighting: 1 - (atmosphericDistance * 0.2), // Slight dimming with distance
    haze: atmosphericDistance * 15 // Blue atmospheric haze
  };
}

function getTextureBasedColor(textureKey: string, elevation: number, urbanFactor: number): [number, number, number] {
  // Base colors that complement our texture atlas
  const colorMap: Record<string, [number, number, number]> = {
    lush_grass: [74, 124, 89],
    dry_grass: [139, 115, 85],
    rich_soil: [139, 69, 19],
    rocky_terrain: [105, 105, 105],
    mountain_stone: [95, 95, 95],
    smooth_concrete: [192, 192, 192],
    weathered_concrete: [160, 160, 160],
    dark_asphalt: [47, 47, 47],
    forest_floor: [34, 139, 34],
    sandy_beach: [244, 164, 96],
    marsh_wetland: [85, 107, 47],
    coarse_gravel: [128, 128, 128]
  };

  const baseColor = colorMap[textureKey] || [100, 100, 100];

  // Apply environmental modulations
  const elevationFactor = 1 + (elevation / 1000); // Slight brightening with elevation
  const urbanTint = urbanFactor > 0.3 ? 1.1 : 1.0; // Slightly brighter in urban areas

  return [
    Math.min(255, baseColor[0] * elevationFactor * urbanTint),
    Math.min(255, baseColor[1] * elevationFactor * urbanTint),
    Math.min(255, baseColor[2] * elevationFactor * urbanTint)
  ];
}

export function createWaterLayer(riverData?: any) {
  // Use the actual generated river data if available
  if (!riverData || !riverData.path || riverData.path.length === 0) {
    // Fallback to default rivers if no river data provided
    const centerLng = -74.0060;
    const centerLat = 40.7128;

    const waterBodies = [
      {
        id: 'default-water',
        polygon: [
          [centerLng - 0.02, centerLat - 0.01],
          [centerLng + 0.02, centerLat - 0.01],
          [centerLng + 0.02, centerLat + 0.01],
          [centerLng - 0.02, centerLat + 0.01]
        ]
      }
    ];

    return new PolygonLayer({
      id: 'water-layer',
      data: waterBodies,
      getPolygon: (d: any) => d.polygon,
      getFillColor: [64, 164, 223, 180],
      getLineColor: [255, 255, 255, 0],
      getLineWidth: 0,
      extruded: false,
      wireframe: false,
      filled: true,
      stroked: false,
      pickable: false
    });
  }

  // Generate water polygons from the actual river path
  const waterBodies = [];
  const riverWidth = riverData.width || 200; // meters

  // Create water segments along the river path
  for (let i = 0; i < riverData.path.length - 1; i++) {
    const p1 = riverData.path[i];
    const p2 = riverData.path[i + 1];

    if (!p1 || !p2) continue;

    // Convert from local coordinates to lat/lng (simplified conversion)
    const centerLng = -74.0060;
    const centerLat = 40.7128;
    const metersToDegreesLng = 1 / 111320;
    const metersToDegreesLat = 1 / 110540;

    const lng1 = centerLng + (p1.x * metersToDegreesLng);
    const lat1 = centerLat + (p1.y * metersToDegreesLat);
    const lng2 = centerLng + (p2.x * metersToDegreesLng);
    const lat2 = centerLat + (p2.y * metersToDegreesLat);

    // Create water segment with width
    const dx = lng2 - lng1;
    const dy = lat2 - lat1;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length > 0) {
      const perpX = -dy / length * (riverWidth * metersToDegreesLng / 2);
      const perpY = dx / length * (riverWidth * metersToDegreesLat / 2);

      waterBodies.push({
        id: `river-segment-${i}`,
        polygon: [
          [lng1 + perpX, lat1 + perpY],
          [lng1 - perpX, lat1 - perpY],
          [lng2 - perpX, lat2 - perpY],
          [lng2 + perpX, lat2 + perpY]
        ]
      });
    }
  }

  return new PolygonLayer({
    id: 'water-layer',
    data: waterBodies,
    getPolygon: (d: any) => d.polygon,
    getElevation: () => -2, // Below ground level
    getFillColor: [30, 144, 255, 200], // Deep sky blue with transparency
    getLineColor: [0, 100, 200, 255],
    getLineWidth: 2,
    extruded: true,
    wireframe: false,
    filled: true,
    stroked: true,
    elevationScale: 1.0,
    pickable: true,
    material: {
      ambient: 0.3,
      diffuse: 0.6,
      shininess: 128,
      specularColor: [255, 255, 255]
    }
  });
}