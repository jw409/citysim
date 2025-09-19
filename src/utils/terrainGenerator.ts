import { PathLayer, ScatterplotLayer } from '@deck.gl/layers';
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

// Generate simple terrain using ScatterplotLayer for stability
function generateSimpleTerrain(
  bounds: any,
  padding: number,
  perlin: PerlinNoise,
  timeOfDay: number
) {
  const { min_x, min_y, max_x, max_y } = bounds;
  const terrain: any[] = [];

  // Create terrain points with moderate resolution
  const resolution = 250; // 250m spacing between points
  const noiseScale = 0.001;

  for (let x = min_x - padding; x <= max_x + padding; x += resolution) {
    for (let y = min_y - padding; y <= max_y + padding; y += resolution) {
      // Generate elevation using octave noise
      const elevation = perlin.octaveNoise2D(x * noiseScale, y * noiseScale, 4, 0.5) * 60; // Reduced to 60m max

      // Distance from city center for terrain type
      const distanceFromCity = Math.min(
        Math.abs(x - (min_x + max_x) / 2) / ((max_x - min_x) / 2),
        Math.abs(y - (min_y + max_y) / 2) / ((max_y - min_y) / 2)
      );

      // Determine terrain type
      let terrainType: string;
      let baseRadius = 80;

      if (elevation < -10) {
        terrainType = 'water';
        baseRadius = 100;
      } else if (elevation < 15) {
        terrainType = 'lowland';
        baseRadius = 75;
      } else if (elevation < 30) {
        terrainType = 'grassland';
        baseRadius = 85;
      } else if (elevation < 45) {
        terrainType = 'forest';
        baseRadius = 90;
      } else {
        terrainType = 'mountain';
        baseRadius = 95;
      }

      // Add radius variation
      const radiusVariation = perlin.noise2D(x * 0.002, y * 0.002) * 15;
      const radius = baseRadius + radiusVariation;

      terrain.push({
        x,
        y,
        elevation,
        terrainType,
        radius: Math.max(radius, 40),
        color: getTerrainColor(elevation, terrainType, timeOfDay, distanceFromCity),
      });
    }
  }

  return terrain;
}

// Generate regional scale terrain
function generateRegionalTerrain(
  bounds: any,
  padding: number,
  perlin: PerlinNoise,
  timeOfDay: number,
  scale: number
) {
  const { min_x, min_y, max_x, max_y } = bounds;
  const terrain: any[] = [];

  // Adjust resolution for regional scale
  const resolution = 500 * Math.min(scale / 10, 5); // 500m to 2.5km spacing
  const noiseScale = 0.0005;

  for (let x = min_x - padding; x <= max_x + padding; x += resolution) {
    for (let y = min_y - padding; y <= max_y + padding; y += resolution) {
      // Generate elevation with multiple octaves for realistic mountains
      const baseElevation = perlin.octaveNoise2D(x * noiseScale, y * noiseScale, 6, 0.6) * 300;
      const mountainNoise =
        perlin.octaveNoise2D(x * noiseScale * 0.3, y * noiseScale * 0.3, 4, 0.7) * 800;
      const elevation = baseElevation + mountainNoise;

      const distanceFromCity = Math.min(
        Math.abs(x - (min_x + max_x) / 2) / ((max_x - min_x) / 2),
        Math.abs(y - (min_y + max_y) / 2) / ((max_y - min_y) / 2)
      );

      let terrainType: string;
      let baseRadius = 150;

      if (elevation < -30) {
        terrainType = 'ocean';
        baseRadius = 200;
      } else if (elevation < 50) {
        terrainType = 'coastal';
        baseRadius = 180;
      } else if (elevation < 200) {
        terrainType = 'plains';
        baseRadius = 160;
      } else if (elevation < 500) {
        terrainType = 'highlands';
        baseRadius = 170;
      } else {
        terrainType = 'mountains';
        baseRadius = 190;
      }

      const radiusVariation = perlin.noise2D(x * 0.001, y * 0.001) * 30;
      const radius = baseRadius + radiusVariation;

      terrain.push({
        x,
        y,
        elevation,
        terrainType,
        radius: Math.max(radius, 80),
        color: getRegionalTerrainColor(elevation, terrainType, timeOfDay, distanceFromCity),
      });
    }
  }

  return terrain;
}

// Generate planetary scale terrain
function generatePlanetaryScaleTerrain(
  bounds: any,
  padding: number,
  perlin: PerlinNoise,
  timeOfDay: number,
  scale: number
) {
  const { min_x, min_y, max_x, max_y } = bounds;
  const terrain: any[] = [];

  // Very coarse resolution for planetary scale
  const resolution = 2000 * Math.min(scale / 100, 10); // 2km to 20km spacing
  const noiseScale = 0.0001;

  for (let x = min_x - padding; x <= max_x + padding; x += resolution) {
    for (let y = min_y - padding; y <= max_y + padding; y += resolution) {
      // Continental scale elevation
      const continentalElevation =
        perlin.octaveNoise2D(x * noiseScale * 0.1, y * noiseScale * 0.1, 3, 0.8) * 2000;
      const mountainRanges = perlin.octaveNoise2D(x * noiseScale, y * noiseScale, 5, 0.6) * 3000;
      const elevation = continentalElevation + mountainRanges;

      const distanceFromCenter =
        Math.sqrt(Math.pow(x - (min_x + max_x) / 2, 2) + Math.pow(y - (min_y + max_y) / 2, 2)) /
        (scale * 1000);

      let terrainType: string;
      let baseRadius = 300;

      if (elevation < -1000) {
        terrainType = 'deep_ocean';
        baseRadius = 400;
      } else if (elevation < 0) {
        terrainType = 'ocean';
        baseRadius = 350;
      } else if (elevation < 500) {
        terrainType = 'lowlands';
        baseRadius = 320;
      } else if (elevation < 1500) {
        terrainType = 'plateaus';
        baseRadius = 340;
      } else if (elevation < 3000) {
        terrainType = 'mountains';
        baseRadius = 380;
      } else {
        terrainType = 'high_peaks';
        baseRadius = 420;
      }

      const radiusVariation = perlin.noise2D(x * 0.0005, y * 0.0005) * 50;
      const radius = baseRadius + radiusVariation;

      terrain.push({
        x,
        y,
        elevation,
        terrainType,
        radius: Math.max(radius, 200),
        color: getPlanetaryTerrainColor(elevation, terrainType, timeOfDay, scale),
      });
    }
  }

  return terrain;
}

// Use pre-generated planetary terrain data
export function generateTerrainLayers(
  bounds: any,
  timeOfDay: number = 12,
  seed: number = 12345,
  scale: number = 1,
  planetaryTerrain?: any[]
) {
  const layers: any[] = [];

  console.log(`Loading terrain for scale ${scale}, bounds:`, bounds);

  let terrain: any[] = [];

  if (planetaryTerrain && planetaryTerrain.length > 0) {
    // Use pre-generated planetary terrain data
    const scaleData = findBestTerrainScale(planetaryTerrain, scale);
    if (scaleData) {
      terrain = scaleData.points.map((point: any) => ({
        ...point,
        color: adjustColorForTimeOfDay(point.color, timeOfDay),
      }));
      console.log(`Loaded ${terrain.length} pre-generated ${scaleData.name} terrain points`);
    }
  }

  // Fallback to procedural terrain if no pre-generated data
  if (terrain.length === 0) {
    console.log('🌍 No pre-generated terrain found, generating procedural planetary terrain for scale', scale);
    terrain = generateProceduralPlanetaryTerrain(bounds, scale, timeOfDay, seed);
  }
  if (terrain.length > 0) {
    layers.push(
      new ScatterplotLayer({
        id: 'terrain_base',
        data: terrain,
        getPosition: (d: any) => {
          const [lng, lat] = localToLatLng(d.x, d.y);
          // Apply curvature effect for planetary scales
          let elevationMultiplier = 0.5;
          if (scale > 1000) elevationMultiplier = 0.1; // Very subtle for global
          else if (scale > 100) elevationMultiplier = 0.3; // Moderate for continental

          return [lng, lat, Math.max(0, d.elevation * elevationMultiplier)];
        },
        getRadius: (d: any) => {
          // Scale radius based on zoom and planetary scale
          const baseRadius = d.radius;
          if (scale > 1000) return baseRadius * 2; // Larger for global visibility
          if (scale > 100) return baseRadius * 1.5; // Moderate for continental
          return baseRadius;
        },
        getFillColor: (d: any) => {
          // Add distance-based atmospheric perspective for planetary scales
          if (scale > 100 && d.distanceFromCenter > 0.7) {
            const fade = Math.min(1, (d.distanceFromCenter - 0.7) / 0.3);
            const atmospheric = [135, 206, 235]; // Sky blue
            return d.color.map((c, i) =>
              i < 3 ? Math.round(c * (1 - fade * 0.3) + atmospheric[i] * fade * 0.3) : c
            );
          }
          return d.color;
        },
        getLineColor: [0, 0, 0, 0],
        filled: true,
        stroked: false,
        pickable: scale <= 10, // Only pickable at city/regional scales
        radiusMinPixels: scale > 1000 ? 8 : scale > 100 ? 10 : 12,
        radiusMaxPixels: scale > 1000 ? 40 : scale > 100 ? 30 : 25,
      })
    );
  }

  // Note: River and vegetation generation removed for now to avoid perlin references
  // These features will be added back with pre-generated data in the future

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
    getPath: (d: any) =>
      d.path.map((p: any) => {
        const [lng, lat] = localToLatLng(p.x, p.y);
        return [lng, lat, -2]; // Slightly below ground level
      }),
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

        vegetation.push({
          x: scatterX,
          y: scatterY,
          type: vegetationType,
          size: vegetationType === 'tree' ? 8 + Math.random() * 6 : 4 + Math.random() * 3,
          color: getVegetationColor(timeOfDay, vegetationType),
        });
      }
    }
  }

  return vegetation;
}

// Regional terrain colors
function getRegionalTerrainColor(
  elevation: number,
  terrainType: string,
  timeOfDay: number,
  distanceFromCity: number
): number[] {
  const isDaytime = timeOfDay >= 6 && timeOfDay <= 18;
  const lightIntensity = isDaytime ? 0.8 : 0.4;

  let baseColor: number[];

  switch (terrainType) {
    case 'ocean':
      baseColor = [25, 25, 112];
      break;
    case 'coastal':
      baseColor = [70, 130, 180];
      break;
    case 'plains':
      baseColor = [154, 205, 50];
      break;
    case 'highlands':
      baseColor = [107, 142, 35];
      break;
    case 'mountains':
      baseColor = [139, 137, 137];
      break;
    default:
      baseColor = [160, 160, 160];
  }

  return baseColor.map(c => Math.round(c * lightIntensity)).concat([220]);
}

// Planetary terrain colors
function getPlanetaryTerrainColor(
  elevation: number,
  terrainType: string,
  timeOfDay: number,
  scale: number
): number[] {
  const isDaytime = timeOfDay >= 6 && timeOfDay <= 18;
  const sunAngle = Math.sin(((timeOfDay - 6) / 12) * Math.PI);
  const lightIntensity = isDaytime ? 0.6 + 0.3 * sunAngle : 0.2;

  let baseColor: number[];

  switch (terrainType) {
    case 'deep_ocean':
      baseColor = [25, 25, 112];
      break;
    case 'ocean':
      baseColor = [65, 105, 225];
      break;
    case 'lowlands':
      baseColor = [34, 139, 34];
      break;
    case 'plateaus':
      baseColor = [188, 143, 143];
      break;
    case 'mountains':
      baseColor = [139, 137, 137];
      break;
    case 'high_peaks':
      baseColor = [255, 255, 255];
      break;
    default:
      baseColor = [160, 160, 160];
  }

  // Apply atmospheric perspective for very large scales
  if (scale > 1000) {
    const atmosphericBlue = [135, 206, 235];
    const distance = Math.min(1, scale / 10000);
    baseColor = baseColor.map((c, i) =>
      Math.round(c * (1 - distance * 0.2) + atmosphericBlue[i] * distance * 0.2)
    );
  }

  return baseColor.map(c => Math.round(c * lightIntensity)).concat([200]);
}

// Generate procedural planetary terrain when pre-generated data isn't available
function generateProceduralPlanetaryTerrain(bounds: any, scale: number, timeOfDay: number, seed: number) {
  const { min_x, min_y, max_x, max_y } = bounds;
  const perlin = new PerlinNoise(seed);
  const terrain: any[] = [];

  // Adaptive resolution based on scale
  let resolution = 250; // Base resolution for city scale
  let elevationScale = 50;
  let radiusBase = 80;

  if (scale > 1000) {
    // Global scale - very coarse
    resolution = 10000;
    elevationScale = 3000;
    radiusBase = 500;
  } else if (scale > 100) {
    // Continental scale
    resolution = 2000;
    elevationScale = 800;
    radiusBase = 300;
  } else if (scale > 10) {
    // Regional scale
    resolution = 500;
    elevationScale = 200;
    radiusBase = 150;
  }

  const cityWidth = max_x - min_x;
  const cityHeight = max_y - min_y;
  const terrainExtent = Math.max(cityWidth, cityHeight) * scale;

  // Generate terrain grid
  for (let x = min_x - terrainExtent; x <= max_x + terrainExtent; x += resolution) {
    for (let y = min_y - terrainExtent; y <= max_y + terrainExtent; y += resolution) {
      // Use multiple noise octaves for realistic terrain
      const noiseScale = 0.0001 / scale;
      const elevation = perlin.octaveNoise2D(x * noiseScale, y * noiseScale, 4, 0.6) * elevationScale;

      // Distance from city center for terrain variation
      const distanceFromCenter = Math.sqrt(Math.pow(x - (min_x + max_x) / 2, 2) + Math.pow(y - (min_y + max_y) / 2, 2));
      const normalizedDistance = distanceFromCenter / terrainExtent;

      // Determine terrain type based on elevation and distance
      let terrainType: string;
      const elevationRatio = elevation / elevationScale;

      if (elevationRatio < -0.3) {
        terrainType = scale > 100 ? 'deep_ocean' : 'water';
      } else if (elevationRatio < -0.1) {
        terrainType = scale > 100 ? 'ocean' : 'water';
      } else if (elevationRatio < 0.1) {
        terrainType = scale > 100 ? 'coastal' : 'lowland';
      } else if (elevationRatio < 0.4) {
        terrainType = scale > 100 ? 'plains' : 'grassland';
      } else if (elevationRatio < 0.7) {
        terrainType = scale > 100 ? 'highlands' : 'forest';
      } else if (elevationRatio < 0.9) {
        terrainType = scale > 100 ? 'mountains' : 'mountain';
      } else {
        terrainType = scale > 100 ? 'high_peaks' : 'mountain';
      }

      // Add radius variation
      const radiusVariation = perlin.noise2D(x * 0.001, y * 0.001) * radiusBase * 0.3;
      const radius = radiusBase + radiusVariation;

      terrain.push({
        x,
        y,
        elevation: Math.max(elevation, scale > 100 ? -1000 : -50), // Prevent extreme negative elevation
        terrainType,
        radius: Math.max(radius, radiusBase * 0.5),
        color: getPlanetaryTerrainColor(elevation, terrainType, timeOfDay, scale),
        distanceFromCenter: normalizedDistance
      });
    }
  }

  console.log(`🌍 Generated ${terrain.length} procedural terrain points for scale ${scale}x (resolution: ${resolution}m)`);
  return terrain;
}

// Find the best terrain scale data for the current view scale
function findBestTerrainScale(planetaryTerrain: any[], currentScale: number): any | null {
  if (!planetaryTerrain || planetaryTerrain.length === 0) return null;

  // Sort terrain scales by how close they are to the current scale
  const sortedScales = planetaryTerrain
    .map(scaleData => ({
      ...scaleData,
      distance: Math.abs(Math.log10(scaleData.scale) - Math.log10(currentScale)),
    }))
    .sort((a, b) => a.distance - b.distance);

  return sortedScales[0] || null;
}

// Adjust terrain colors based on time of day for lighting effects
function adjustColorForTimeOfDay(baseColor: number[], timeOfDay: number): number[] {
  const isDaytime = timeOfDay >= 6 && timeOfDay <= 18;
  let lightIntensity: number;

  if ((timeOfDay >= 5 && timeOfDay <= 7) || (timeOfDay >= 17 && timeOfDay <= 19)) {
    // Dawn/dusk - warm lighting
    const dawnDuskIntensity = Math.sin(((timeOfDay - 5) / 2) * Math.PI);
    lightIntensity = 0.4 + dawnDuskIntensity * 0.4;

    // Add warm tint during dawn/dusk
    return [
      Math.round(baseColor[0] * lightIntensity * 1.2), // More red
      Math.round(baseColor[1] * lightIntensity * 1.1), // Slightly more green
      Math.round(baseColor[2] * lightIntensity * 0.8), // Less blue
      baseColor[3] || 200,
    ];
  } else if (isDaytime) {
    // Daytime - full lighting
    const sunAngle = Math.sin(((timeOfDay - 6) / 12) * Math.PI);
    lightIntensity = 0.8 + sunAngle * 0.2;
  } else {
    // Nighttime - reduced lighting
    lightIntensity = 0.3;
  }

  return [
    Math.round(baseColor[0] * lightIntensity),
    Math.round(baseColor[1] * lightIntensity),
    Math.round(baseColor[2] * lightIntensity),
    baseColor[3] || 200,
  ];
}
