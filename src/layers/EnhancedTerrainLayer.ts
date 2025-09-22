import React from 'react';
import { PolygonLayer } from '@deck.gl/layers';
import { TerrainState } from '../contexts/TerrainContext';
import { PlanetaryTerrain } from '../components/PlanetaryTerrain';
import { generateTerrainLayers } from '../utils/terrainGenerator';
import { getTerrainProfile } from '../utils/realWorldTerrainProfiles';

interface TerrainLayerConfig {
  bounds: any;
  terrainState: TerrainState;
  cityData?: any;
  forceLayer?: 'planetary' | 'basic' | 'none';
}

/**
 * Enhanced terrain layer that automatically chooses between different terrain systems
 * based on scale, profile, and performance requirements
 */
export function createEnhancedTerrainLayer(config: TerrainLayerConfig): any[] {
  const { bounds, terrainState, cityData, forceLayer } = config;

  // Early exit if terrain is disabled
  if (!terrainState.isEnabled) {
    return [];
  }

  // Determine which terrain system to use
  const activeLayer = forceLayer || determineOptimalTerrainSystem(terrainState);

  try {
    switch (activeLayer) {
      case 'planetary':
        return createPlanetaryTerrainLayers(bounds, terrainState);

      case 'basic':
        return createBasicTerrainLayers(bounds, terrainState, cityData);

      case 'none':
      default:
        return [];
    }
  } catch (error) {
    console.warn('Error creating terrain layers, falling back to basic terrain:', error);
    // Fallback to basic terrain if planetary fails
    return createBasicTerrainLayers(bounds, terrainState, cityData);
  }
}

/**
 * Determine the optimal terrain system based on current state
 */
function determineOptimalTerrainSystem(terrainState: TerrainState): 'planetary' | 'basic' | 'none' {
  const { scale, activeLayer, terrainProfile } = terrainState;

  // Honor explicit layer selection
  if (activeLayer && activeLayer !== 'none') {
    return activeLayer;
  }

  // Auto-select based on scale and profile
  if (scale > 100) {
    // Large scale - use planetary terrain for continental/global views
    return 'planetary';
  } else if (scale > 10) {
    // Regional scale - use planetary or basic depending on profile
    const profile = getTerrainProfile(terrainProfile);
    if (profile && profile.recommendedScale > 5) {
      return 'planetary';
    }
    return 'basic';
  } else {
    // City scale - use basic terrain for detailed local features
    return 'basic';
  }
}

/**
 * Create layers using the advanced PlanetaryTerrain system
 */
function createPlanetaryTerrainLayers(bounds: any, terrainState: TerrainState): any[] {
  const { scale, seed, timeOfDay, showAtmosphere, customParameters } = terrainState;

  try {
    // Create the PlanetaryTerrain component props
    const planetaryTerrainProps = {
      bounds,
      scale,
      timeOfDay,
      seed,
      showAtmosphere: showAtmosphere && scale > 50
    };

    // The PlanetaryTerrain component returns React elements, but we need deck.gl layers
    // We'll create a simplified version here that generates the layers directly
    return generatePlanetaryStyleLayers(bounds, terrainState);
  } catch (error) {
    console.error('Failed to create planetary terrain layers:', error);
    return [];
  }
}

/**
 * Create layers using the basic terrain system
 */
function createBasicTerrainLayers(bounds: any, terrainState: TerrainState, cityData?: any): any[] {
  const { timeOfDay, seed } = terrainState;

  try {
    // Use the existing terrain generator with enhanced parameters
    const enhancedBounds = bounds || {
      min_x: -5000, min_y: -5000, max_x: 5000, max_y: 5000
    };

    return generateTerrainLayers(enhancedBounds, timeOfDay, seed);
  } catch (error) {
    console.error('Failed to create basic terrain layers:', error);
    return [];
  }
}

/**
 * Generate planetary-style terrain layers directly (simplified version of PlanetaryTerrain)
 */
function generatePlanetaryStyleLayers(bounds: any, terrainState: TerrainState): any[] {
  const { scale, seed, timeOfDay, customParameters, terrainProfile } = terrainState;
  const profile = getTerrainProfile(terrainProfile);
  const params = terrainProfile === 'custom' ? customParameters : profile?.parameters || customParameters;

  // Create a noise generator for terrain
  const noiseGenerator = new SimplePlanetaryNoise(seed);
  const layers: any[] = [];

  // Generate terrain mesh
  const terrainMesh = generatePlanetaryTerrainMesh(bounds, params, noiseGenerator, scale, timeOfDay);

  if (terrainMesh.length > 0) {
    const terrainLayer = new PolygonLayer({
      id: 'enhanced_planetary_terrain',
      data: terrainMesh,
      getPolygon: (d: any) => d.vertices.map((v: any) => {
        // Convert local coordinates to lng/lat (simplified)
        return [v.x / 111320, v.y / 110540];
      }),
      getElevation: (d: any) => Math.max(0, d.elevation * (scale > 100 ? 0.1 : 2.0)),
      getFillColor: (d: any) => d.color,
      getLineColor: [0, 0, 0, 0],
      filled: true,
      stroked: false,
      extruded: true,
      elevationScale: 3.0, // Increased for more dramatic terrain
      pickable: false,
      material: {
        ambient: 0.4,
        diffuse: 0.8,
        shininess: 32,
        specularColor: [255, 255, 255]
      }
    });

    layers.push(terrainLayer);
  }

  return layers;
}

/**
 * Generate terrain mesh for planetary scale
 */
function generatePlanetaryTerrainMesh(
  bounds: any,
  params: any,
  noise: SimplePlanetaryNoise,
  scale: number,
  timeOfDay: number
): any[] {
  const { min_x, min_y, max_x, max_y } = bounds;
  const terrainMesh: any[] = [];

  // Adjust resolution based on scale - smaller numbers = higher detail
  let resolution = scale > 100 ? 1000 : scale > 10 ? 100 : 50;

  // Generate height map
  const heightMap: { [key: string]: any } = {};

  for (let x = min_x; x <= max_x; x += resolution) {
    for (let y = min_y; y <= max_y; y += resolution) {
      const elevation = generateTerrainElevation(x, y, params, noise, scale);
      const terrainType = getTerrainType(elevation, params, scale);
      const color = getTerrainColor(elevation, terrainType, timeOfDay, scale);

      heightMap[`${x},${y}`] = { x, y, elevation, terrainType, color };
    }
  }

  // Create triangulated mesh
  for (let x = min_x; x < max_x; x += resolution) {
    for (let y = min_y; y < max_y; y += resolution) {
      const p1 = heightMap[`${x},${y}`];
      const p2 = heightMap[`${x + resolution},${y}`];
      const p3 = heightMap[`${x},${y + resolution}`];
      const p4 = heightMap[`${x + resolution},${y + resolution}`];

      if (p1 && p2 && p3) {
        terrainMesh.push({
          vertices: [
            { x: p1.x, y: p1.y, z: p1.elevation },
            { x: p2.x, y: p2.y, z: p2.elevation },
            { x: p3.x, y: p3.y, z: p3.elevation }
          ],
          elevation: (p1.elevation + p2.elevation + p3.elevation) / 3,
          color: blendColors([p1.color, p2.color, p3.color])
        });
      }

      if (p2 && p3 && p4) {
        terrainMesh.push({
          vertices: [
            { x: p2.x, y: p2.y, z: p2.elevation },
            { x: p3.x, y: p3.y, z: p3.elevation },
            { x: p4.x, y: p4.y, z: p4.elevation }
          ],
          elevation: (p2.elevation + p3.elevation + p4.elevation) / 3,
          color: blendColors([p2.color, p3.color, p4.color])
        });
      }
    }
  }

  return terrainMesh;
}

/**
 * Generate elevation for a point using noise and terrain parameters
 */
function generateTerrainElevation(
  x: number,
  y: number,
  params: any,
  noise: SimplePlanetaryNoise,
  scale: number
): number {
  const noiseScale = scale > 100 ? 0.0001 : 0.001;
  const ridgeScale = scale > 100 ? 0.0005 : 0.003;

  const baseNoise = noise.noise2D(x * noiseScale, y * noiseScale);
  const ridgeNoise = noise.ridgedNoise(x, y, 4, ridgeScale, params.mountainHeight * 0.5);
  const detailNoise = noise.noise2D(x * noiseScale * 3, y * noiseScale * 3) * 0.2;

  return (baseNoise * params.mountainHeight * 0.3) + ridgeNoise + detailNoise + params.waterLevel;
}

/**
 * Determine terrain type based on elevation
 */
function getTerrainType(elevation: number, params: any, scale: number): string {
  if (scale > 100) {
    // Planetary scale
    if (elevation < params.waterLevel - 1000) return 'deep_ocean';
    if (elevation < params.waterLevel) return 'ocean';
    if (elevation < params.waterLevel + 100) return 'coastal';
    if (elevation < 500) return 'lowlands';
    if (elevation < 1500) return 'highlands';
    return 'mountains';
  } else {
    // City/regional scale
    if (elevation < params.waterLevel - 10) return 'water';
    if (elevation < params.waterLevel + 5) return 'lowland';
    if (elevation < 50) return 'grassland';
    if (elevation < 100) return 'hills';
    return 'mountains';
  }
}

/**
 * Get color for terrain based on type and time of day
 */
function getTerrainColor(elevation: number, terrainType: string, timeOfDay: number, scale: number): number[] {
  const isDaytime = timeOfDay >= 6 && timeOfDay <= 18;
  const lightIntensity = isDaytime ? 0.8 : 0.4;

  let baseColor: number[];

  if (scale > 100) {
    // Planetary scale colors
    switch (terrainType) {
      case 'deep_ocean': baseColor = [25, 25, 112]; break;
      case 'ocean': baseColor = [65, 105, 225]; break;
      case 'coastal': baseColor = [100, 149, 237]; break;
      case 'lowlands': baseColor = [34, 139, 34]; break;
      case 'highlands': baseColor = [107, 142, 35]; break;
      case 'mountains': baseColor = [139, 137, 137]; break;
      default: baseColor = [160, 160, 160];
    }
  } else {
    // City scale colors
    switch (terrainType) {
      case 'water': baseColor = [70, 130, 180]; break;
      case 'lowland': baseColor = [120, 150, 80]; break;
      case 'grassland': baseColor = [95, 115, 70]; break;
      case 'hills': baseColor = [139, 119, 101]; break;
      case 'mountains': baseColor = [105, 105, 105]; break;
      default: baseColor = [150, 150, 150];
    }
  }

  // Apply lighting
  const litColor = baseColor.map(c => Math.round(c * lightIntensity));
  return [...litColor, 220];
}

/**
 * Blend multiple colors together
 */
function blendColors(colors: number[][]): number[] {
  if (colors.length === 0) return [150, 150, 150, 200];

  const result = [0, 0, 0, 0];
  colors.forEach(color => {
    result[0] += color[0] || 0;
    result[1] += color[1] || 0;
    result[2] += color[2] || 0;
    result[3] += color[3] || 0;
  });

  return result.map(channel => Math.round(channel / colors.length));
}

/**
 * Simplified noise generator for planetary terrain
 */
class SimplePlanetaryNoise {
  private seed: number;
  private perm: number[];

  constructor(seed: number) {
    this.seed = seed;
    this.perm = this.generatePermutation();
  }

  private generatePermutation(): number[] {
    const p = Array.from({ length: 256 }, (_, i) => i);
    let seed = this.seed;

    for (let i = 255; i > 0; i--) {
      seed = (seed * 9301 + 49297) % 233280;
      const j = Math.floor((seed / 233280) * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }

    return [...p, ...p];
  }

  noise2D(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);

    const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
    const lerp = (t: number, a: number, b: number) => a + t * (b - a);

    const u = fade(x);
    const v = fade(y);

    const A = this.perm[X] + Y;
    const B = this.perm[X + 1] + Y;

    return lerp(v,
      lerp(u, this.grad(this.perm[A], x, y), this.grad(this.perm[B], x - 1, y)),
      lerp(u, this.grad(this.perm[A + 1], x, y - 1), this.grad(this.perm[B + 1], x - 1, y - 1))
    );
  }

  ridgedNoise(x: number, y: number, octaves: number, frequency: number, amplitude: number): number {
    let total = 0;
    let currentAmplitude = amplitude;
    let currentFrequency = frequency;

    for (let i = 0; i < octaves; i++) {
      const n = this.noise2D(x * currentFrequency, y * currentFrequency);
      total += Math.abs(n) * currentAmplitude;
      currentAmplitude *= 0.5;
      currentFrequency *= 2;
    }

    return total;
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 1 ? y : h === 2 ? x : 0;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }
}

/**
 * Utility function to get terrain layer configuration for debugging
 */
export function getTerrainLayerInfo(terrainState: TerrainState): {
  activeSystem: 'planetary' | 'basic' | 'none';
  reason: string;
  scale: number;
  profile: string;
} {
  const activeSystem = determineOptimalTerrainSystem(terrainState);

  let reason = '';
  if (!terrainState.isEnabled) {
    reason = 'Terrain disabled by user';
  } else if (terrainState.activeLayer && terrainState.activeLayer !== 'none') {
    reason = `Explicitly set to ${terrainState.activeLayer}`;
  } else if (terrainState.scale > 100) {
    reason = 'Large scale requires planetary terrain';
  } else if (terrainState.scale > 10) {
    reason = 'Regional scale with profile-based selection';
  } else {
    reason = 'City scale uses basic terrain';
  }

  return {
    activeSystem,
    reason,
    scale: terrainState.scale,
    profile: terrainState.terrainProfile
  };
}

/**
 * Performance monitoring for terrain layers
 */
export function measureTerrainPerformance<T>(
  operation: () => T,
  operationName: string
): T {
  const startTime = performance.now();
  const result = operation();
  const endTime = performance.now();

  console.log(`🏔️ Terrain ${operationName}: ${(endTime - startTime).toFixed(2)}ms`);

  return result;
}