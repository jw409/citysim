import { PolygonLayer } from '@deck.gl/layers';
import { TerrainTextureAtlas, getTerrainTextureKey } from '../utils/terrainTextureGenerator';

export function createGroundLayer() {
  // Initialize texture atlas for ground materials
  const textureAtlas = new TerrainTextureAtlas(1024);
  textureAtlas.generateAtlas();
  const textureRegions = textureAtlas.getTextureRegions();

  // Use meter-based coordinate system to match terrain layer
  const groundSize = 15000; // 15km x 15km to ensure full coverage
  const tileSize = 500; // 500m x 500m tiles for detailed ground texturing
  const tilesPerSide = Math.ceil(groundSize / tileSize);
  const halfSize = groundSize / 2;

  const groundTiles = [];

  for (let x = 0; x < tilesPerSide; x++) {
    for (let y = 0; y < tilesPerSide; y++) {
      const centerX = -halfSize + (x + 0.5) * tileSize;
      const centerY = -halfSize + (y + 0.5) * tileSize;

      // Determine appropriate ground texture based on location characteristics
      const distanceFromCenter = Math.sqrt(centerX * centerX + centerY * centerY);
      const urbanFactor = Math.max(0, 1 - distanceFromCenter / 6000); // Urban influence radius
      const elevation = getSimpleTerrainHeight(centerX, centerY); // Simplified elevation for ground layer
      const slope = calculateSimpleSlope(centerX, centerY);

      // Get appropriate texture for this ground tile
      const textureKey = getGroundTextureKey(elevation, slope, urbanFactor, distanceFromCenter);
      const textureRegion = textureRegions[textureKey] || textureRegions['rich_soil'];
      const textureConfig = textureAtlas.getTextureConfig(textureKey);

      // Enhanced color calculation based on texture and environmental factors
      const baseColor = getGroundBaseColor(textureKey, elevation, urbanFactor);
      const environmentalEffects = calculateGroundEnvironmentalEffects(centerX, centerY, elevation);

      const finalColor = [
        Math.max(
          30,
          Math.min(
            255,
            Math.floor(baseColor[0] * environmentalEffects.lighting + environmentalEffects.ambient)
          )
        ),
        Math.max(
          30,
          Math.min(
            255,
            Math.floor(baseColor[1] * environmentalEffects.lighting + environmentalEffects.ambient)
          )
        ),
        Math.max(
          30,
          Math.min(
            255,
            Math.floor(baseColor[2] * environmentalEffects.lighting + environmentalEffects.ambient)
          )
        ),
        255,
      ];

      const halfTile = tileSize / 2;
      groundTiles.push({
        id: `ground-${x}-${y}`,
        polygon: [
          [centerX - halfTile, centerY - halfTile],
          [centerX + halfTile, centerY - halfTile],
          [centerX + halfTile, centerY + halfTile],
          [centerX - halfTile, centerY + halfTile],
        ],
        elevation: elevation - 0.5, // Slightly below terrain level
        color: finalColor,
        textureKey: textureKey,
        textureCoords: [
          [textureRegion.x, textureRegion.y],
          [textureRegion.x + textureRegion.width, textureRegion.y],
          [textureRegion.x + textureRegion.width, textureRegion.y + textureRegion.height],
          [textureRegion.x, textureRegion.y + textureRegion.height],
        ],
        materials: textureConfig?.materials || {
          ambient: 0.5,
          diffuse: 0.7,
          roughness: 0.9,
          metallic: 0.0,
        },
      });
    }
  }

  return new PolygonLayer({
    id: 'ground-layer',
    data: groundTiles,
    coordinateSystem: 2, // COORDINATE_SYSTEM.METER_OFFSETS to match terrain
    coordinateOrigin: [-74.006, 40.7128, 0], // NYC center
    getPolygon: (d: any) => d.polygon,
    getElevation: (d: any) => d.elevation,
    getFillColor: (d: any) => d.color,
    getLineColor: [0, 0, 0, 0], // No outlines for seamless ground
    getLineWidth: 0,
    extruded: true, // Enable 3D rendering
    wireframe: false,
    filled: true,
    stroked: false,
    elevationScale: 1.0,
    pickable: false,
    // Dynamic material properties based on ground texture
    material: (d: any) => ({
      ambient: d.materials?.ambient || 0.5,
      diffuse: d.materials?.diffuse || 0.7,
      shininess: 1 / (d.materials?.roughness || 0.9),
      specularColor: d.materials?.metallic > 0.1 ? [60, 60, 70] : [20, 20, 20],
    }),
    // Optimized lighting for ground surfaces
    lightSettings: {
      lightsPosition: [-74.006, 40.7128, 3000, -74.006, 40.7128, 3000],
      ambientRatio: 0.4, // Higher ambient for ground visibility
      diffuseRatio: 0.6, // Moderate diffuse lighting
      specularRatio: 0.02, // Minimal specular for natural ground
      numberOfLights: 2,
    },
    updateTriggers: {
      getFillColor: [groundTiles.length],
    },
  });
}

// Helper functions for enhanced ground layer
function getSimpleTerrainHeight(x: number, y: number): number {
  // Simplified elevation calculation for ground layer (less detailed than main terrain)
  const scale = 0.0005;
  const noise1 = Math.sin(x * scale + y * scale * 1.3) * 8;
  const noise2 = Math.cos(x * scale * 1.7 + y * scale) * 5;
  const noise3 = Math.sin(x * scale * 2.1 + y * scale * 2.3) * 3;

  const baseHeight = noise1 + noise2 + noise3;

  // Add some larger terrain features
  const distanceFromCenter = Math.sqrt(x * x + y * y);
  const flatteningFactor = Math.max(0.8, 1 - distanceFromCenter / 12000);

  return baseHeight * flatteningFactor;
}

function calculateSimpleSlope(x: number, y: number): number {
  const sampleDist = 100;
  const h1 = getSimpleTerrainHeight(x + sampleDist, y);
  const h2 = getSimpleTerrainHeight(x - sampleDist, y);
  const h3 = getSimpleTerrainHeight(x, y + sampleDist);
  const h4 = getSimpleTerrainHeight(x, y - sampleDist);

  const slopeX = (h1 - h2) / (sampleDist * 2);
  const slopeY = (h3 - h4) / (sampleDist * 2);

  return Math.sqrt(slopeX * slopeX + slopeY * slopeY);
}

function getGroundTextureKey(
  elevation: number,
  slope: number,
  urbanFactor: number,
  distanceFromCenter: number
): string {
  // Ground textures are typically more basic than terrain textures
  if (urbanFactor > 0.8) {
    return elevation > 0 ? 'smooth_concrete' : 'dark_asphalt';
  } else if (urbanFactor > 0.5) {
    return 'weathered_concrete';
  } else if (urbanFactor > 0.2) {
    return elevation > 10 ? 'dry_grass' : 'rich_soil';
  }

  // Natural ground based on elevation and environment
  if (elevation > 30) {
    return slope > 0.2 ? 'rocky_terrain' : 'dry_grass';
  } else if (elevation > 10) {
    return 'lush_grass';
  } else if (elevation > 0) {
    return 'rich_soil';
  } else {
    return 'marsh_wetland';
  }
}

function getGroundBaseColor(
  textureKey: string,
  elevation: number,
  urbanFactor: number
): [number, number, number] {
  // Slightly muted base colors for ground layer to avoid competing with terrain
  const colorMap: Record<string, [number, number, number]> = {
    lush_grass: [60, 100, 70],
    dry_grass: [110, 90, 65],
    rich_soil: [100, 50, 15],
    rocky_terrain: [85, 85, 85],
    smooth_concrete: [160, 160, 160],
    weathered_concrete: [130, 130, 130],
    dark_asphalt: [35, 35, 35],
    marsh_wetland: [70, 85, 40],
  };

  return colorMap[textureKey] || [80, 80, 80];
}

function calculateGroundEnvironmentalEffects(
  x: number,
  y: number,
  elevation: number
): { lighting: number; ambient: number } {
  const distanceFromCenter = Math.sqrt(x * x + y * y);

  // Ground gets less direct lighting than elevated terrain
  const baseLighting = 0.9;
  const elevationLighting = Math.min(0.1, elevation / 100); // Slight boost for elevated areas
  const distanceDimming = Math.min(0.1, distanceFromCenter / 15000); // Slight dimming at distance

  return {
    lighting: baseLighting + elevationLighting - distanceDimming,
    ambient: 10 + (elevation > 0 ? 5 : 0), // Basic ambient lighting
  };
}
