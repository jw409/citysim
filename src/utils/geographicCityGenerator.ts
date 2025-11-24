import { TerrainState } from '../contexts/TerrainContext';
import { getTerrainProfile } from './realWorldTerrainProfiles';

interface GeographicContext {
  terrainHeight: (x: number, y: number) => number;
  isWater: (x: number, y: number) => boolean;
  distanceToWater: (x: number, y: number) => number;
  slope: (x: number, y: number) => number;
  riverPaths: Array<{ x: number; y: number }[]>;
  coastlines: Array<{ x: number; y: number }[]>;
  bounds: { min_x: number; min_y: number; max_x: number; max_y: number };
}

interface SuitabilityFactors {
  flatness: number; // 0-1, higher = flatter terrain
  waterAccess: number; // 0-1, higher = closer to water
  elevation: number; // 0-1, relative elevation
  accessibility: number; // 0-1, how reachable from other areas
  drainage: number; // 0-1, flood risk (higher = better drainage)
  view: number; // 0-1, scenic value
}

export class GeographicCityGenerator {
  private terrainState: TerrainState;
  private context: GeographicContext;
  private noiseGenerator: SimplexNoise;

  constructor(terrainState: TerrainState, bounds: any) {
    this.terrainState = terrainState;
    this.noiseGenerator = new SimplexNoise(terrainState.seed);
    this.context = this.buildGeographicContext(bounds);
  }

  private buildGeographicContext(bounds: any): GeographicContext {
    const { customParameters, terrainProfile, seed } = this.terrainState;
    const profile = getTerrainProfile(terrainProfile);
    const params =
      terrainProfile === 'custom' ? customParameters : profile?.parameters || customParameters;

    const noiseScale = 0.001;
    const ridgeNoiseScale = 0.003;

    // Terrain height function using multi-octave noise
    const terrainHeight = (x: number, y: number): number => {
      const baseNoise = this.noiseGenerator.noise2D(x * noiseScale, y * noiseScale);
      const ridgeNoise = this.noiseGenerator.noise2D(x * ridgeNoiseScale, y * ridgeNoiseScale);
      const detailNoise = this.noiseGenerator.noise2D(x * noiseScale * 4, y * noiseScale * 4) * 0.3;

      // Combine different noise octaves
      const combinedNoise = baseNoise + Math.abs(ridgeNoise) * 0.7 + detailNoise;
      return combinedNoise * params.mountainHeight + params.waterLevel;
    };

    // Water detection
    const isWater = (x: number, y: number): boolean => {
      const height = terrainHeight(x, y);
      return height < params.waterLevel;
    };

    // Distance to water (simplified)
    const distanceToWater = (x: number, y: number): number => {
      // Check in expanding rings
      for (let radius = 100; radius <= 5000; radius += 100) {
        const samples = Math.max(8, Math.floor(radius / 100));
        for (let i = 0; i < samples; i++) {
          const angle = (i / samples) * 2 * Math.PI;
          const testX = x + Math.cos(angle) * radius;
          const testY = y + Math.sin(angle) * radius;
          if (isWater(testX, testY)) {
            return radius;
          }
        }
      }
      return params.coastalDistance;
    };

    // Slope calculation
    const slope = (x: number, y: number): number => {
      const delta = 50;
      const h1 = terrainHeight(x - delta, y);
      const h2 = terrainHeight(x + delta, y);
      const h3 = terrainHeight(x, y - delta);
      const h4 = terrainHeight(x, y + delta);

      const slopeX = Math.abs(h2 - h1) / (2 * delta);
      const slopeY = Math.abs(h4 - h3) / (2 * delta);

      return Math.sqrt(slopeX * slopeX + slopeY * slopeY);
    };

    // Generate river paths
    const riverPaths = this.generateRiverPaths(bounds, params, terrainHeight);

    // Generate coastlines (simplified)
    const coastlines = this.generateCoastlines(bounds, isWater);

    return {
      terrainHeight,
      isWater,
      distanceToWater,
      slope,
      riverPaths,
      coastlines,
      bounds,
    };
  }

  private generateRiverPaths(
    bounds: any,
    params: any,
    terrainHeight: (x: number, y: number) => number
  ): Array<{ x: number; y: number }[]> {
    const rivers: Array<{ x: number; y: number }[]> = [];

    if (Math.random() < params.riverProbability) {
      // Generate main river flowing through terrain
      const riverPath: { x: number; y: number }[] = [];

      // Start from high elevation, flow to low elevation
      let currentX =
        bounds.min_x + (bounds.max_x - bounds.min_x) * 0.3 + (Math.random() - 0.5) * 2000;
      const currentY = bounds.min_y;

      const stepSize = 150;
      const steps = Math.floor((bounds.max_y - bounds.min_y) / stepSize);

      for (let step = 0; step < steps; step++) {
        const y = bounds.min_y + step * stepSize;

        // Sample nearby elevations to find downhill direction
        const samples = 8;
        let bestX = currentX;
        let lowestHeight = terrainHeight(currentX, y);

        for (let i = 0; i < samples; i++) {
          const testX = currentX + (i - samples / 2) * 100;
          const height = terrainHeight(testX, y);
          if (height < lowestHeight) {
            lowestHeight = height;
            bestX = testX;
          }
        }

        // Add some meandering
        const meander = Math.sin(y / 1000) * 300 + (Math.random() - 0.5) * 200;
        currentX = bestX + meander;

        riverPath.push({ x: currentX, y });
      }

      rivers.push(riverPath);
    }

    return rivers;
  }

  private generateCoastlines(
    bounds: any,
    isWater: (x: number, y: number) => boolean
  ): Array<{ x: number; y: number }[]> {
    // Simplified coastline detection
    const coastlines: Array<{ x: number; y: number }[]> = [];
    // Implementation would trace water boundaries
    return coastlines;
  }

  // Calculate suitability factors for a location
  private getSuitabilityFactors(x: number, y: number): SuitabilityFactors {
    const height = this.context.terrainHeight(x, y);
    const slope = this.context.slope(x, y);
    const waterDistance = this.context.distanceToWater(x, y);
    const { bounds } = this.context;

    // Calculate center distance for accessibility
    const centerX = (bounds.min_x + bounds.max_x) / 2;
    const centerY = (bounds.min_y + bounds.max_y) / 2;
    const distanceFromCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
    const maxDistance =
      Math.sqrt(
        Math.pow(bounds.max_x - bounds.min_x, 2) + Math.pow(bounds.max_y - bounds.min_y, 2)
      ) / 2;

    return {
      flatness: Math.max(0, 1 - slope * 10), // Higher slope = lower flatness
      waterAccess: Math.max(0, 1 - waterDistance / 3000), // Closer water = better access
      elevation: Math.max(0, Math.min(1, (height + 50) / 200)), // Relative elevation 0-1
      accessibility: Math.max(0, 1 - distanceFromCenter / maxDistance), // Closer to center = more accessible
      drainage: Math.max(0, 1 - Math.max(0, -height / 20)), // Above flood level = better drainage
      view: Math.max(0, height / 100), // Higher = better views
    };
  }

  // Main method: determine suitability for different zone types
  public getZoneSuitability(x: number, y: number, zoneType: string): number {
    const isWater = this.context.isWater(x, y);

    // Can't build on water (unless specific water-based infrastructure)
    if (isWater && !['port', 'marina', 'ferry_terminal'].includes(zoneType)) {
      return 0;
    }

    const factors = this.getSuitabilityFactors(x, y);
    let suitability = 1.0;

    switch (zoneType.toLowerCase()) {
      case 'downtown':
      case 'commercial':
        // Downtown wants flat areas with good water access and accessibility
        suitability *= factors.flatness * 0.8 + 0.2; // Heavily prefer flat
        suitability *= factors.waterAccess * 0.6 + 0.4; // Prefer water access
        suitability *= factors.accessibility * 0.7 + 0.3; // Prefer accessible locations
        suitability *= factors.drainage * 0.8 + 0.2; // Need good drainage
        break;

      case 'residential':
        // Residential can handle some slope, wants views and accessibility
        suitability *= factors.flatness * 0.4 + 0.6; // Can handle moderate slope
        suitability *= factors.accessibility * 0.6 + 0.4; // Needs accessibility
        suitability *= factors.view * 0.3 + 0.7; // Views are nice but not required
        suitability *= factors.drainage * 0.9 + 0.1; // Important for safety
        if (factors.elevation > 0.3) suitability *= 1.2; // Bonus for elevated areas
        break;

      case 'industrial':
        // Industrial wants flat areas, water access for transport, less concerned with views
        suitability *= factors.flatness * 0.9 + 0.1; // Strongly prefer flat
        suitability *= factors.waterAccess * 0.7 + 0.3; // Good for transport
        suitability *= factors.accessibility * 0.5 + 0.5; // Less critical
        suitability *= factors.drainage * 0.8 + 0.2; // Need to avoid flooding
        suitability *= 1 - factors.view * 0.2; // Views not important
        break;

      case 'park':
      case 'recreation':
        // Parks can use varied terrain, especially scenic areas
        suitability *= factors.flatness * 0.2 + 0.8; // Can handle slopes well
        suitability *= factors.view * 0.8 + 0.2; // Prefer scenic areas
        suitability *= factors.waterAccess * 0.4 + 0.6; // Water features nice
        if (factors.elevation > 0.5) suitability *= 1.5; // Big bonus for scenic overlooks
        if (factors.flatness < 0.3) suitability *= 1.3; // Some bonus for challenging terrain
        break;

      case 'airport':
        // Airports need very flat, large areas
        suitability *= Math.pow(factors.flatness, 2); // Extremely flat required
        suitability *= factors.accessibility * 0.6 + 0.4;
        suitability *= factors.drainage * 0.9 + 0.1;
        if (factors.flatness < 0.8) suitability = 0; // Hard requirement
        break;

      case 'port':
      case 'marina':
        // Ports need water access
        if (!isWater) {
          suitability *= Math.max(0, 1 - this.context.distanceToWater(x, y) / 500);
        }
        suitability *= factors.flatness * 0.8 + 0.2;
        suitability *= factors.accessibility * 0.7 + 0.3;
        break;

      default:
        // Default: moderate preference for flat, accessible areas
        suitability *= factors.flatness * 0.5 + 0.5;
        suitability *= factors.accessibility * 0.5 + 0.5;
        suitability *= factors.drainage * 0.7 + 0.3;
        break;
    }

    return Math.max(0, Math.min(1, suitability));
  }

  // Find optimal location for a specific POI type
  public getOptimalPOILocation(
    poiType: string,
    searchRadius: number,
    centerX: number,
    centerY: number,
    existingPOIs: Array<{ x: number; y: number }> = []
  ): { x: number; y: number; suitability: number } | null {
    let bestLocation: { x: number; y: number; suitability: number } | null = null;
    let bestSuitability = 0;

    const samples = 30;
    const minDistance = poiType === 'lighthouse' ? 100 : 200; // Minimum distance from existing POIs

    for (let i = 0; i < samples; i++) {
      const angle = (i / samples) * 2 * Math.PI;
      const distance = Math.random() * searchRadius;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;

      // Check minimum distance from existing POIs
      const tooClose = existingPOIs.some(
        poi => Math.sqrt(Math.pow(x - poi.x, 2) + Math.pow(y - poi.y, 2)) < minDistance
      );

      if (tooClose) continue;

      let suitability = this.getZoneSuitability(x, y, poiType);

      // Add POI-specific logic
      switch (poiType.toLowerCase()) {
        case 'lighthouse':
          const waterDistance = this.context.distanceToWater(x, y);
          suitability *= Math.max(0, 1 - waterDistance / 300); // Must be very close to water
          suitability *= this.getSuitabilityFactors(x, y).elevation; // Higher is better
          break;

        case 'ski_resort':
        case 'observatory':
          const elevation = this.getSuitabilityFactors(x, y).elevation;
          suitability *= Math.pow(elevation, 2); // Strongly prefer high elevation
          break;

        case 'beach':
          if (!this.context.isWater(x, y)) {
            suitability *= Math.max(0, 1 - this.context.distanceToWater(x, y) / 100);
          }
          break;

        case 'bridge':
          // Bridges need to cross water or valleys
          const crossesWater = this.wouldCrossWater(x, y, 500);
          if (crossesWater) suitability *= 2;
          break;
      }

      if (suitability > bestSuitability) {
        bestSuitability = suitability;
        bestLocation = { x, y, suitability };
      }
    }

    return bestLocation;
  }

  // Generate terrain-aware road network
  public generateTerrainAwareRoadPath(
    from: { x: number; y: number },
    to: { x: number; y: number },
    maxSlope: number = 0.15
  ): { x: number; y: number }[] {
    const path = [from];
    const numSegments = Math.max(
      8,
      Math.floor(Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2)) / 300)
    );

    for (let i = 1; i < numSegments; i++) {
      const t = i / numSegments;
      const directX = from.x + (to.x - from.x) * t;
      const directY = from.y + (to.y - from.y) * t;

      // Try to find a path that avoids steep terrain
      let bestX = directX;
      let bestY = directY;
      let bestScore = this.evaluateRoadPoint(directX, directY, maxSlope);

      const searchRadius = 200;
      const samples = 12;

      for (let j = 0; j < samples; j++) {
        const angle = (j / samples) * 2 * Math.PI;
        const testX = directX + Math.cos(angle) * searchRadius;
        const testY = directY + Math.sin(angle) * searchRadius;
        const score = this.evaluateRoadPoint(testX, testY, maxSlope);

        if (score > bestScore) {
          bestScore = score;
          bestX = testX;
          bestY = testY;
        }
      }

      path.push({ x: bestX, y: bestY });
    }

    path.push(to);
    return this.smoothPath(path);
  }

  private evaluateRoadPoint(x: number, y: number, maxSlope: number): number {
    const slope = this.context.slope(x, y);
    const isWater = this.context.isWater(x, y);

    if (isWater) return -1; // Avoid water (unless building bridges)
    if (slope > maxSlope) return 0; // Avoid too steep terrain

    return Math.max(0, 1 - slope / maxSlope); // Prefer flatter areas
  }

  private smoothPath(path: { x: number; y: number }[]): { x: number; y: number }[] {
    if (path.length < 3) return path;

    const smoothed = [path[0]];

    for (let i = 1; i < path.length - 1; i++) {
      const prev = path[i - 1];
      const curr = path[i];
      const next = path[i + 1];

      // Simple averaging for smoothing
      const smoothX = (prev.x + curr.x * 2 + next.x) / 4;
      const smoothY = (prev.y + curr.y * 2 + next.y) / 4;

      smoothed.push({ x: smoothX, y: smoothY });
    }

    smoothed.push(path[path.length - 1]);
    return smoothed;
  }

  private wouldCrossWater(x: number, y: number, checkRadius: number): boolean {
    // Check if a structure at this location would span water
    const samples = 8;
    for (let i = 0; i < samples; i++) {
      const angle = (i / samples) * 2 * Math.PI;
      const testX = x + Math.cos(angle) * checkRadius;
      const testY = y + Math.sin(angle) * checkRadius;
      if (this.context.isWater(testX, testY)) {
        return true;
      }
    }
    return false;
  }

  // Get terrain analysis for debugging/display
  public getTerrainAnalysis(
    x: number,
    y: number
  ): {
    height: number;
    slope: number;
    waterDistance: number;
    isWater: boolean;
    factors: SuitabilityFactors;
  } {
    return {
      height: this.context.terrainHeight(x, y),
      slope: this.context.slope(x, y),
      waterDistance: this.context.distanceToWater(x, y),
      isWater: this.context.isWater(x, y),
      factors: this.getSuitabilityFactors(x, y),
    };
  }
}

// Simple noise implementation for terrain generation
class SimplexNoise {
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
    // Simplified noise implementation
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

    return lerp(
      v,
      lerp(u, this.grad(this.perm[A], x, y), this.grad(this.perm[B], x - 1, y)),
      lerp(u, this.grad(this.perm[A + 1], x, y - 1), this.grad(this.perm[B + 1], x - 1, y - 1))
    );
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 1 ? y : h === 2 ? x : 0;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }
}

// Helper function to integrate with existing city generation
export function enhanceCityWithGeography(cityModel: any, terrainState: TerrainState): any {
  if (!terrainState.isEnabled) {
    return cityModel; // Return unchanged if terrain is disabled
  }

  const bounds = cityModel.bounds || {
    min_x: -5000,
    min_y: -5000,
    max_x: 5000,
    max_y: 5000,
  };

  const generator = new GeographicCityGenerator(terrainState, bounds);

  // Re-evaluate zones based on geography
  const enhancedZones =
    cityModel.zones?.map((zone: any) => {
      const centerX =
        zone.boundary?.reduce((sum: number, p: any) => sum + p.x, 0) / (zone.boundary?.length || 1);
      const centerY =
        zone.boundary?.reduce((sum: number, p: any) => sum + p.y, 0) / (zone.boundary?.length || 1);

      const zoneTypeNames = ['residential', 'commercial', 'industrial', 'downtown', 'park'];
      const zoneTypeName = zoneTypeNames[zone.type] || 'residential';
      const suitability = generator.getZoneSuitability(centerX, centerY, zoneTypeName);
      const analysis = generator.getTerrainAnalysis(centerX, centerY);

      return {
        ...zone,
        geographic_suitability: suitability,
        terrain_analysis: analysis,
      };
    }) || [];

  // Add geography-specific POIs
  const geographicPOIs: any[] = [];

  // Add landmarks based on terrain characteristics
  const profile = getTerrainProfile(terrainState.terrainProfile);
  if (profile) {
    // Add lighthouses for coastal areas
    if (profile.parameters.coastalDistance < 5000) {
      const lighthouse = generator.getOptimalPOILocation(
        'lighthouse',
        3000,
        bounds.min_x + 1000,
        (bounds.min_y + bounds.max_y) / 2
      );
      if (lighthouse && lighthouse.suitability > 0.5) {
        geographicPOIs.push({
          id: `lighthouse_${Date.now()}`,
          type: 5, // PARK type for landmarks
          position: { x: lighthouse.x, y: lighthouse.y },
          capacity: 50,
          properties: {
            name: 'Harbor Lighthouse',
            landmark: true,
            terrain_suitability: lighthouse.suitability,
          },
        });
      }
    }

    // Add scenic overlooks for mountainous areas
    if (profile.parameters.mountainHeight > 100) {
      const overlook = generator.getOptimalPOILocation(
        'observatory',
        4000,
        (bounds.min_x + bounds.max_x) / 2,
        (bounds.min_y + bounds.max_y) / 2
      );
      if (overlook && overlook.suitability > 0.7) {
        geographicPOIs.push({
          id: `scenic_overlook_${Date.now()}`,
          type: 5, // PARK type
          position: { x: overlook.x, y: overlook.y },
          capacity: 100,
          properties: {
            name: 'Scenic Overlook',
            landmark: true,
            terrain_suitability: overlook.suitability,
          },
        });
      }
    }
  }

  return {
    ...cityModel,
    zones: enhancedZones,
    pois: [...(cityModel.pois || []), ...geographicPOIs],
    geographic_metadata: {
      terrain_profile: terrainState.terrainProfile,
      terrain_seed: terrainState.seed,
      geographic_features: geographicPOIs.length,
      terrain_enabled: true,
      generation_timestamp: new Date().toISOString(),
    },
  };
}
