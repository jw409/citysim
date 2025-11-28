import { PolygonLayer, PathLayer, ScatterplotLayer } from '@deck.gl/layers';
import { localToLatLng } from './coordinates';

// Simple seeded random number generator
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

// Perlin noise implementation for smooth, natural terrain
class PerlinNoise {
  private permutation: number[];
  private rng: SeededRandom;

  constructor(seed: number) {
    this.rng = new SeededRandom(seed);
    this.permutation = [];

    // Generate permutation table
    for (let i = 0; i < 256; i++) {
      this.permutation[i] = i;
    }

    // Shuffle using seeded random
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(this.rng.next() * (i + 1));
      [this.permutation[i], this.permutation[j]] = [this.permutation[j], this.permutation[i]];
    }

    // Duplicate for wrapping
    for (let i = 0; i < 256; i++) {
      this.permutation[256 + i] = this.permutation[i];
    }
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  noise2D(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);

    const u = this.fade(x);
    const v = this.fade(y);

    const A = this.permutation[X] + Y;
    const AA = this.permutation[A];
    const AB = this.permutation[A + 1];
    const B = this.permutation[X + 1] + Y;
    const BA = this.permutation[B];
    const BB = this.permutation[B + 1];

    return this.lerp(
      v,
      this.lerp(
        u,
        this.grad(this.permutation[AA], x, y),
        this.grad(this.permutation[BA], x - 1, y)
      ),
      this.lerp(
        u,
        this.grad(this.permutation[AB], x, y - 1),
        this.grad(this.permutation[BB], x - 1, y - 1)
      )
    );
  }

  // Generate octave noise for more natural variation
  octaveNoise2D(x: number, y: number, octaves: number, persistence: number): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }

    return total / maxValue;
  }
}

// Generate terrain features using smooth Perlin noise instead of ugly polygons
export function generateTerrainLayers(bounds: any, timeOfDay: number = 12, seed: number = 12345) {
  const { min_x, min_y, max_x, max_y } = bounds;
  const cityWidth = max_x - min_x;
  const cityHeight = max_y - min_y;
  const padding = Math.max(cityWidth, cityHeight) * 0.4;

  const layers: any[] = [];
  const perlin = new PerlinNoise(seed);

  // Generate smooth terrain mesh for continuous surface
  const terrainMesh = generateTerrainMesh(bounds, padding, perlin, timeOfDay);
  if (terrainMesh.length > 0) {
    layers.push(
      new PolygonLayer({
        id: 'continuous_terrain',
        data: terrainMesh,
        // PERF: Use METER_OFFSETS (same as buildings/roads) to avoid coordinate conversion
        coordinateSystem: 2, // COORDINATE_SYSTEM.METER_OFFSETS
        coordinateOrigin: [-74.006, 40.7128, 0], // NYC center - same as buildings
        // PERF: Direct array access - no conversion needed with METER_OFFSETS
        getPolygon: (d: any) => d.vertices.map((v: any) => [v.x, v.y]),
        getElevation: (d: any) => Math.max(0, d.elevation),
        getFillColor: (d: any) => d.color,
        getLineColor: [0, 0, 0, 0],
        filled: true,
        stroked: false,
        extruded: true,
        elevationScale: 1,
        pickable: false,
        material: {
          ambient: 0.6,
          diffuse: 0.8,
          shininess: 32,
          specularColor: [255, 255, 255],
        },
      })
    );
  }

  // Add river if it exists in the city model
  const river = generateRiverLayer(bounds, timeOfDay, seed);
  if (river) {
    layers.push(river);
  }

  // Generate natural vegetation using noise patterns with elevation
  // PERF: Pre-compute terrain elevation during vegetation generation, not in accessor
  const vegetation = generateNaturalVegetation(bounds, perlin, timeOfDay);
  if (vegetation.length > 0) {
    layers.push(
      new ScatterplotLayer({
        id: 'natural_vegetation',
        data: vegetation,
        // PERF: Use METER_OFFSETS to match terrain/buildings
        coordinateSystem: 2, // COORDINATE_SYSTEM.METER_OFFSETS
        coordinateOrigin: [-74.006, 40.7128, 0], // NYC center
        // PERF: Use pre-computed elevation (z) - no coordinate conversion or noise calculation
        getPosition: (d: any) => [d.x, d.y, d.z],
        getRadius: (d: any) => d.size,
        getFillColor: (d: any) => d.color,
        pickable: false,
        radiusMinPixels: 3,
        radiusMaxPixels: 12,
      })
    );
  }

  return layers;
}

// Professional terrain colors for realistic urban visualization
function getTerrainColor(
  elevation: number,
  terrainType: string,
  timeOfDay: number,
  distanceFromCity: number
): number[] {
  const isDaytime = timeOfDay >= 6 && timeOfDay <= 18;
  const urbanFactor = Math.max(0, 1 - distanceFromCity);

  let baseColor: number[];

  switch (terrainType) {
    case 'water':
      // Deep blue water for realism
      baseColor = isDaytime ? [45, 85, 135] : [20, 40, 70];
      break;
    case 'lowland':
      // Urban areas: concrete gray, suburban areas: muted green
      if (urbanFactor > 0.4) {
        baseColor = isDaytime ? [140, 135, 125] : [70, 68, 63]; // Urban concrete
      } else {
        baseColor = isDaytime ? [100, 120, 75] : [50, 60, 38]; // Suburban grass
      }
      break;
    case 'grassland':
      // Natural grassland with subdued colors
      baseColor = isDaytime ? [95, 115, 70] : [48, 58, 35];
      break;
    case 'forest':
      // Dense forest with realistic dark green
      baseColor = isDaytime ? [65, 95, 55] : [33, 48, 28];
      break;
    case 'mountain':
      // Rocky terrain with natural stone colors
      baseColor = isDaytime ? [115, 105, 90] : [58, 53, 45];
      break;
    default:
      baseColor = isDaytime ? [120, 118, 115] : [60, 59, 58];
  }

  // Subtle elevation-based shading
  const elevationFactor = Math.max(0, Math.min(1, (elevation + 40) / 120));
  const brightness = 0.85 + elevationFactor * 0.3;

  return [
    Math.round(baseColor[0] * brightness),
    Math.round(baseColor[1] * brightness),
    Math.round(baseColor[2] * brightness),
    240, // More opaque for professional look
  ];
}

// Natural vegetation colors
function getVegetationColor(timeOfDay: number, vegetationType: string): number[] {
  const isDaytime = timeOfDay >= 6 && timeOfDay <= 18;

  if (vegetationType === 'tree') {
    return isDaytime ? [60, 100, 50, 180] : [30, 50, 25, 180]; // Dark green trees
  } else {
    return isDaytime ? [90, 140, 70, 160] : [45, 70, 35, 160]; // Lighter green bushes
  }
}

// Generate continuous terrain mesh using triangulated polygons
function generateTerrainMesh(bounds: any, padding: number, perlin: PerlinNoise, timeOfDay: number) {
  const { min_x, min_y, max_x, max_y } = bounds;
  const terrainMesh: any[] = [];

  // Create a finer grid for better mesh quality
  const resolution = 200; // 200m grid for smoother terrain
  const noiseScale = 0.001;

  // Generate height map grid
  const heightMap: {
    [key: string]: {
      x: number;
      y: number;
      elevation: number;
      terrainType: string;
      color: number[];
    };
  } = {};

  for (let x = min_x - padding; x <= max_x + padding; x += resolution) {
    for (let y = min_y - padding; y <= max_y + padding; y += resolution) {
      const elevation = perlin.octaveNoise2D(x * noiseScale, y * noiseScale, 4, 0.5) * 80; // Reduced from 100 to 80

      const distanceFromCity = Math.min(
        Math.abs(x - (min_x + max_x) / 2) / ((max_x - min_x) / 2),
        Math.abs(y - (min_y + max_y) / 2) / ((max_y - min_y) / 2)
      );

      let terrainType: string;
      if (elevation < -15) {
        terrainType = 'water';
      } else if (elevation < 10) {
        terrainType = 'lowland';
      } else if (elevation < 25) {
        terrainType = 'grassland';
      } else if (elevation < 45) {
        terrainType = 'forest';
      } else {
        terrainType = 'mountain';
      }

      const key = `${x},${y}`;
      heightMap[key] = {
        x,
        y,
        elevation,
        terrainType,
        color: getTerrainColor(elevation, terrainType, timeOfDay, distanceFromCity),
      };
    }
  }

  // Create triangulated mesh from grid points
  for (let x = min_x - padding; x < max_x + padding; x += resolution) {
    for (let y = min_y - padding; y < max_y + padding; y += resolution) {
      const p1 = heightMap[`${x},${y}`];
      const p2 = heightMap[`${x + resolution},${y}`];
      const p3 = heightMap[`${x},${y + resolution}`];
      const p4 = heightMap[`${x + resolution},${y + resolution}`];

      if (p1 && p2 && p3 && p4) {
        // Create two triangles per grid square
        // Triangle 1: p1, p2, p3
        const avgElevation1 = (p1.elevation + p2.elevation + p3.elevation) / 3;
        const avgColor1 = blendColors([p1.color, p2.color, p3.color]);

        terrainMesh.push({
          vertices: [
            { x: p1.x, y: p1.y },
            { x: p2.x, y: p2.y },
            { x: p3.x, y: p3.y },
          ],
          elevation: avgElevation1,
          color: avgColor1,
        });

        // Triangle 2: p2, p3, p4
        const avgElevation2 = (p2.elevation + p3.elevation + p4.elevation) / 3;
        const avgColor2 = blendColors([p2.color, p3.color, p4.color]);

        terrainMesh.push({
          vertices: [
            { x: p2.x, y: p2.y },
            { x: p3.x, y: p3.y },
            { x: p4.x, y: p4.y },
          ],
          elevation: avgElevation2,
          color: avgColor2,
        });
      }
    }
  }

  return terrainMesh;
}

// Helper function to blend colors
function blendColors(colors: number[][]): number[] {
  if (colors.length === 0) return [150, 150, 150, 200];

  const result = [0, 0, 0, 0];
  colors.forEach(color => {
    result[0] += color[0];
    result[1] += color[1];
    result[2] += color[2];
    result[3] += color[3];
  });

  return result.map(channel => Math.round(channel / colors.length));
}

// Generate river layer from city model
function generateRiverLayer(bounds: any, timeOfDay: number, seed: number) {
  const { min_x, min_y, max_x, max_y } = bounds;
  const rng = new SeededRandom(seed);

  // Generate meandering river path similar to city generation
  const riverPath: { x: number; y: number }[] = [];
  const riverWidth = 120 + rng.next() * 80; // 120-200m wide river

  // River flows roughly north-south through the city with curves
  for (let y = min_y - 1000; y <= max_y + 1000; y += 100) {
    // Create meandering pattern using sine wave with randomness
    const baseX = Math.sin(y / 1200) * 600; // Main curve
    const noise = (rng.next() - 0.5) * 200; // Add natural variation
    const x = baseX + noise;
    riverPath.push({ x, y });
  }

  if (riverPath.length === 0) return null;

  // Create river as PathLayer for flowing water effect
  const isDaytime = timeOfDay >= 6 && timeOfDay <= 18;
  const waterColor = isDaytime ? [70, 130, 180, 200] : [30, 60, 90, 200]; // Blue water

  return new PathLayer({
    id: 'river',
    data: [{ path: riverPath }],
    // PERF: Use METER_OFFSETS to match terrain/buildings - no coordinate conversion
    coordinateSystem: 2, // COORDINATE_SYSTEM.METER_OFFSETS
    coordinateOrigin: [-74.006, 40.7128, 0], // NYC center
    // PERF: Direct meter coordinates - no localToLatLng conversion
    getPath: (d: any) => d.path.map((p: any) => [p.x, p.y, -2]),
    getColor: waterColor,
    getWidth: riverWidth,
    widthMinPixels: 8,
    widthMaxPixels: 50,
    pickable: false,
    capRounded: true,
    jointRounded: true,
    material: {
      ambient: 0.8,
      diffuse: 0.6,
      shininess: 128,
      specularColor: [200, 220, 255],
    },
  });
}

// Generate natural vegetation using noise patterns
function generateNaturalVegetation(bounds: any, perlin: PerlinNoise, timeOfDay: number) {
  const { min_x, min_y, max_x, max_y } = bounds;
  const vegetation: any[] = [];

  // Generate clusters of vegetation using noise
  const density = 0.3; // Vegetation density
  const noiseThreshold = 0.2; // Only place vegetation where noise > threshold

  for (let x = min_x; x <= max_x; x += 100) {
    for (let y = min_y; y <= max_y; y += 100) {
      const vegetationNoise = perlin.octaveNoise2D(x * 0.003, y * 0.003, 3, 0.6);

      if (vegetationNoise > noiseThreshold && Math.random() < density) {
        const elevationNoise = perlin.noise2D(x * 0.001, y * 0.001);
        const vegetationType = elevationNoise > 0 ? 'tree' : 'bush';

        // Add some scatter around the grid point
        const scatterX = x + (Math.random() - 0.5) * 80;
        const scatterY = y + (Math.random() - 0.5) * 80;

        // PERF: Pre-compute terrain elevation at vegetation position (was done per-frame before!)
        const terrainElevation =
          perlin.octaveNoise2D(scatterX * 0.001, scatterY * 0.001, 4, 0.5) * 100;
        const size = vegetationType === 'tree' ? 8 + Math.random() * 6 : 4 + Math.random() * 3;

        vegetation.push({
          x: scatterX,
          y: scatterY,
          z: Math.max(0, terrainElevation + size / 2), // Pre-computed z position
          type: vegetationType,
          size: size,
          color: getVegetationColor(timeOfDay, vegetationType),
        });
      }
    }
  }

  return vegetation;
}
