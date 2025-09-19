import React, { useMemo, useCallback } from 'react';
import { PolygonLayer, ScatterplotLayer } from '@deck.gl/layers';
import { SimpleMeshLayer } from '@deck.gl/mesh-layers';
import { localToLatLng } from '../utils/coordinates';

interface PlanetaryTerrainProps {
  bounds: any;
  scale: number; // 1 = city scale, 100 = country scale, 10000 = planetary scale
  timeOfDay: number; // 0-24 hours
  seed: number;
  showAtmosphere: boolean;
}

// Planetary constants
const EARTH_RADIUS_KM = 6371;
const ATMOSPHERE_HEIGHT_KM = 100;

// Advanced noise implementation for planetary-scale terrain
class PlanetaryNoise {
  private seed: number;
  private permutation: number[];

  constructor(seed: number) {
    this.seed = seed;
    this.permutation = this.generatePermutation();
  }

  private generatePermutation(): number[] {
    const perm = Array.from({ length: 256 }, (_, i) => i);
    let seed = this.seed;

    for (let i = 255; i > 0; i--) {
      seed = (seed * 9301 + 49297) % 233280;
      const j = Math.floor((seed / 233280) * (i + 1));
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }

    return [...perm, ...perm]; // Duplicate for wrapping
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number, z: number = 0): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  noise3D(x: number, y: number, z: number = 0): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);

    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);

    const A = this.permutation[X] + Y;
    const AA = this.permutation[A] + Z;
    const AB = this.permutation[A + 1] + Z;
    const B = this.permutation[X + 1] + Y;
    const BA = this.permutation[B] + Z;
    const BB = this.permutation[B + 1] + Z;

    return this.lerp(
      w,
      this.lerp(
        v,
        this.lerp(
          u,
          this.grad(this.permutation[AA], x, y, z),
          this.grad(this.permutation[BA], x - 1, y, z)
        ),
        this.lerp(
          u,
          this.grad(this.permutation[AB], x, y - 1, z),
          this.grad(this.permutation[BB], x - 1, y - 1, z)
        )
      ),
      this.lerp(
        v,
        this.lerp(
          u,
          this.grad(this.permutation[AA + 1], x, y, z - 1),
          this.grad(this.permutation[BA + 1], x - 1, y, z - 1)
        ),
        this.lerp(
          u,
          this.grad(this.permutation[AB + 1], x, y - 1, z - 1),
          this.grad(this.permutation[BB + 1], x - 1, y - 1, z - 1)
        )
      )
    );
  }

  // Multi-octave noise for realistic terrain
  ridgedNoise(x: number, y: number, octaves: number, frequency: number, amplitude: number): number {
    let total = 0;
    let currentAmplitude = amplitude;
    let currentFrequency = frequency;

    for (let i = 0; i < octaves; i++) {
      const n = this.noise3D(x * currentFrequency, y * currentFrequency, 0);
      total += Math.abs(n) * currentAmplitude;
      currentAmplitude *= 0.5;
      currentFrequency *= 2;
    }

    return total;
  }

  // Continental noise for planetary scale
  continentalNoise(x: number, y: number): number {
    const continentalScale = 0.0001; // Very large features
    const mountainScale = 0.002; // Mountain ranges
    const hillScale = 0.01; // Hills and valleys

    const continental = this.noise3D(x * continentalScale, y * continentalScale) * 2000;
    const mountains = this.ridgedNoise(x, y, 6, mountainScale, 800);
    const hills = this.ridgedNoise(x, y, 4, hillScale, 200);

    return continental + mountains + hills;
  }
}

// Generate planetary-scale terrain
function generatePlanetaryTerrain(
  bounds: any,
  scale: number,
  noise: PlanetaryNoise,
  timeOfDay: number
) {
  const { min_x, min_y, max_x, max_y } = bounds;

  // Adjust resolution based on scale
  let resolution = 1000; // Base resolution in meters
  if (scale > 100) resolution *= 10; // Country scale
  if (scale > 1000) resolution *= 10; // Continental scale
  if (scale > 5000) resolution *= 5; // Planetary scale

  const padding = Math.max(max_x - min_x, max_y - min_y) * (0.1 + scale * 0.01);
  const terrainMesh: any[] = [];
  const heightMap: { [key: string]: any } = {};

  // Generate height map
  for (let x = min_x - padding; x <= max_x + padding; x += resolution) {
    for (let y = min_y - padding; y <= max_y + padding; y += resolution) {
      let elevation: number;

      if (scale < 10) {
        // City scale - use existing terrain generation
        elevation = noise.ridgedNoise(x, y, 4, 0.001, 100);
      } else if (scale < 1000) {
        // Regional scale - add mountain ranges
        elevation = noise.continentalNoise(x, y) * 0.5;
      } else {
        // Planetary scale - full continental features
        elevation = noise.continentalNoise(x, y);
      }

      const distanceFromCenter =
        Math.sqrt(Math.pow(x - (min_x + max_x) / 2, 2) + Math.pow(y - (min_y + max_y) / 2, 2)) /
        (scale * 1000);

      const terrainType = getPlanetaryTerrainType(elevation, distanceFromCenter, scale);
      const color = getPlanetaryTerrainColor(elevation, terrainType, timeOfDay, scale);

      heightMap[`${x},${y}`] = { x, y, elevation, terrainType, color };
    }
  }

  // Create mesh from heightmap
  for (let x = min_x - padding; x < max_x + padding; x += resolution) {
    for (let y = min_y - padding; y < max_y + padding; y += resolution) {
      const p1 = heightMap[`${x},${y}`];
      const p2 = heightMap[`${x + resolution},${y}`];
      const p3 = heightMap[`${x},${y + resolution}`];
      const p4 = heightMap[`${x + resolution},${y + resolution}`];

      if (p1 && p2 && p3 && p4) {
        // Create triangulated terrain patches
        const avgElevation1 = (p1.elevation + p2.elevation + p3.elevation) / 3;
        const avgColor1 = blendColors([p1.color, p2.color, p3.color]);

        terrainMesh.push({
          vertices: [
            { x: p1.x, y: p1.y, z: p1.elevation },
            { x: p2.x, y: p2.y, z: p2.elevation },
            { x: p3.x, y: p3.y, z: p3.elevation },
          ],
          elevation: avgElevation1,
          color: avgColor1,
        });

        const avgElevation2 = (p2.elevation + p3.elevation + p4.elevation) / 3;
        const avgColor2 = blendColors([p2.color, p3.color, p4.color]);

        terrainMesh.push({
          vertices: [
            { x: p2.x, y: p2.y, z: p2.elevation },
            { x: p3.x, y: p3.y, z: p3.elevation },
            { x: p4.x, y: p4.y, z: p4.elevation },
          ],
          elevation: avgElevation2,
          color: avgColor2,
        });
      }
    }
  }

  return terrainMesh;
}

// Determine terrain type based on elevation and scale
function getPlanetaryTerrainType(
  elevation: number,
  distanceFromCenter: number,
  scale: number
): string {
  if (scale < 10) {
    // City scale terrain types
    if (elevation < -10) return 'water';
    if (elevation < 5) return 'lowland';
    if (elevation < 30) return 'hills';
    return 'mountains';
  } else if (scale < 1000) {
    // Regional scale terrain types
    if (elevation < -50) return 'ocean';
    if (elevation < 0) return 'coastal';
    if (elevation < 200) return 'plains';
    if (elevation < 1000) return 'highlands';
    return 'mountains';
  } else {
    // Planetary scale terrain types
    if (elevation < -2000) return 'deep_ocean';
    if (elevation < -200) return 'ocean';
    if (elevation < 0) return 'continental_shelf';
    if (elevation < 500) return 'lowlands';
    if (elevation < 1500) return 'plateaus';
    if (elevation < 3000) return 'mountains';
    return 'high_peaks';
  }
}

// Get terrain colors based on scale and type
function getPlanetaryTerrainColor(
  elevation: number,
  terrainType: string,
  timeOfDay: number,
  scale: number
): number[] {
  const isDaytime = timeOfDay >= 6 && timeOfDay <= 18;
  const sunAngle = Math.sin(((timeOfDay - 6) / 12) * Math.PI); // 0 at sunrise/sunset, 1 at noon
  const lightIntensity = isDaytime ? 0.7 + 0.3 * sunAngle : 0.3;

  let baseColor: number[];

  // Color scheme adapts to scale
  if (scale < 10) {
    // City scale - detailed local colors
    switch (terrainType) {
      case 'water':
        baseColor = [70, 130, 180];
        break;
      case 'lowland':
        baseColor = [120, 150, 80];
        break;
      case 'hills':
        baseColor = [139, 119, 101];
        break;
      case 'mountains':
        baseColor = [105, 105, 105];
        break;
      default:
        baseColor = [150, 150, 150];
    }
  } else if (scale < 1000) {
    // Regional scale - broader color palette
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
  } else {
    // Planetary scale - Earth-like colors
    switch (terrainType) {
      case 'deep_ocean':
        baseColor = [25, 25, 112];
        break;
      case 'ocean':
        baseColor = [65, 105, 225];
        break;
      case 'continental_shelf':
        baseColor = [100, 149, 237];
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
  }

  // Apply atmospheric perspective for distant terrain
  if (scale > 100) {
    const atmosphericBlue = [135, 206, 235];
    const distance = Math.min(1, scale / 10000);
    baseColor = baseColor.map((c, i) =>
      Math.round(c * (1 - distance * 0.3) + atmosphericBlue[i] * distance * 0.3)
    );
  }

  // Apply lighting based on time of day
  const litColor = baseColor.map(c => Math.round(c * lightIntensity));

  return [...litColor, 200];
}

// Create atmospheric layer for planetary scale
function generateAtmosphereLayer(bounds: any, scale: number, timeOfDay: number) {
  if (scale < 100) return null; // Only show atmosphere at larger scales

  const { min_x, min_y, max_x, max_y } = bounds;
  const centerX = (min_x + max_x) / 2;
  const centerY = (min_y + max_y) / 2;
  const radius = Math.max(max_x - min_x, max_y - min_y) * 0.6;

  // Calculate sun position for atmospheric coloring
  const sunAngle = ((timeOfDay - 6) / 12) * 2 * Math.PI;
  const sunX = centerX + Math.cos(sunAngle) * radius * 2;
  const sunY = centerY + Math.sin(sunAngle) * radius * 0.5;

  // Generate atmospheric scattering points
  const atmospherePoints = [];
  const numPoints = Math.min(1000, scale * 2);

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    const distance = radius + (Math.random() * 0.2 - 0.1) * radius;

    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;

    // Distance from sun position affects color
    const sunDistance = Math.sqrt(Math.pow(x - sunX, 2) + Math.pow(y - sunY, 2));
    const normalizedSunDistance = Math.min(1, sunDistance / (radius * 2));

    // Atmospheric scattering colors
    let color: number[];
    if ((timeOfDay >= 5 && timeOfDay <= 7) || (timeOfDay >= 17 && timeOfDay <= 19)) {
      // Sunrise/sunset colors
      const sunsetIntensity = 1 - normalizedSunDistance;
      color = [
        Math.round(255 * sunsetIntensity + 135 * (1 - sunsetIntensity)),
        Math.round(165 * sunsetIntensity + 206 * (1 - sunsetIntensity)),
        Math.round(0 * sunsetIntensity + 235 * (1 - sunsetIntensity)),
        Math.round(100 * sunsetIntensity),
      ];
    } else if (timeOfDay >= 6 && timeOfDay <= 18) {
      // Daytime atmosphere - blue sky
      color = [135, 206, 235, 30];
    } else {
      // Nighttime atmosphere - very subtle
      color = [25, 25, 50, 15];
    }

    atmospherePoints.push({
      x,
      y,
      color,
      size: 20 + Math.random() * 15,
    });
  }

  return new ScatterplotLayer({
    id: 'atmosphere',
    data: atmospherePoints,
    getPosition: (d: any) => {
      const [lng, lat] = localToLatLng(d.x, d.y);
      return [lng, lat, ATMOSPHERE_HEIGHT_KM * 100]; // Elevated above terrain
    },
    getRadius: (d: any) => d.size,
    getFillColor: (d: any) => d.color,
    pickable: false,
    radiusUnits: 'pixels',
    radiusMinPixels: 5,
    radiusMaxPixels: 25,
  });
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

export function PlanetaryTerrain({
  bounds,
  scale,
  timeOfDay,
  seed,
  showAtmosphere,
}: PlanetaryTerrainProps) {
  const layers = useMemo(() => {
    const noise = new PlanetaryNoise(seed);
    const activeLayers: any[] = [];

    // Generate main terrain
    const terrainMesh = generatePlanetaryTerrain(bounds, scale, noise, timeOfDay);

    if (terrainMesh.length > 0) {
      activeLayers.push(
        new PolygonLayer({
          id: 'planetary_terrain',
          data: terrainMesh,
          getPolygon: (d: any) =>
            d.vertices.map((v: any) => {
              const [lng, lat] = localToLatLng(v.x, v.y);
              return [lng, lat];
            }),
          getElevation: (d: any) => Math.max(0, d.elevation),
          getFillColor: (d: any) => d.color,
          getLineColor: [0, 0, 0, 0],
          filled: true,
          stroked: false,
          extruded: true,
          elevationScale: scale > 100 ? 0.1 : 1, // Scale down elevation for planetary view
          pickable: false,
          material: {
            ambient: 0.4,
            diffuse: 0.9,
            shininess: 64,
            specularColor: [255, 255, 255],
          },
        })
      );
    }

    // Add atmospheric layer for larger scales
    if (showAtmosphere && scale > 50) {
      const atmosphereLayer = generateAtmosphereLayer(bounds, scale, timeOfDay);
      if (atmosphereLayer) {
        activeLayers.push(atmosphereLayer);
      }
    }

    return activeLayers;
  }, [bounds, scale, timeOfDay, seed, showAtmosphere]);

  return <>{layers}</>;
}
