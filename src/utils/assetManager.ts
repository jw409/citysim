import { load } from '@loaders.gl/core';
import { GLTFLoader } from '@loaders.gl/gltf';
import { OBJLoader } from '@loaders.gl/obj';

export interface AssetMetadata {
  type: 'pedestrian' | 'car' | 'bus' | 'truck' | 'aircraft' | 'helicopter' | 'drone';
  variant: string;
  scale: number;
  height: number; // For camera positioning
  url: string;
  loaded?: boolean;
  data?: any;
}

export interface LODConfig {
  high: number;    // Distance threshold for high detail
  medium: number;  // Distance threshold for medium detail
  low: number;     // Distance threshold for low detail (billboard)
}

// Default asset configurations
export const ASSET_CATALOG: Record<string, AssetMetadata> = {
  // Pedestrians
  'pedestrian_male': {
    type: 'pedestrian',
    variant: 'male_casual',
    scale: 1.0,
    height: 1.7,
    url: '/models/pedestrians/male_casual.glb'
  },
  'pedestrian_female': {
    type: 'pedestrian',
    variant: 'female_business',
    scale: 1.0,
    height: 1.65,
    url: '/models/pedestrians/female_business.glb'
  },
  'pedestrian_child': {
    type: 'pedestrian',
    variant: 'child',
    scale: 0.8,
    height: 1.2,
    url: '/models/pedestrians/child.glb'
  },

  // Vehicles
  'car_sedan': {
    type: 'car',
    variant: 'sedan_blue',
    scale: 1.0,
    height: 1.2,
    url: '/models/vehicles/sedan_blue.glb'
  },
  'car_suv': {
    type: 'car',
    variant: 'suv_red',
    scale: 1.1,
    height: 1.4,
    url: '/models/vehicles/suv_red.glb'
  },
  'car_sports': {
    type: 'car',
    variant: 'sports_yellow',
    scale: 0.9,
    height: 1.0,
    url: '/models/vehicles/sports_yellow.glb'
  },

  // Buses
  'bus_city': {
    type: 'bus',
    variant: 'city_bus',
    scale: 1.0,
    height: 2.0,
    url: '/models/vehicles/bus_city.glb'
  },
  'bus_coach': {
    type: 'bus',
    variant: 'coach',
    scale: 1.1,
    height: 2.2,
    url: '/models/vehicles/bus_coach.glb'
  },

  // Trucks
  'truck_delivery': {
    type: 'truck',
    variant: 'delivery',
    scale: 1.0,
    height: 1.8,
    url: '/models/vehicles/truck_delivery.glb'
  },
  'truck_semi': {
    type: 'truck',
    variant: 'semi',
    scale: 1.2,
    height: 2.5,
    url: '/models/vehicles/truck_semi.glb'
  },

  // Aircraft
  'aircraft_commercial': {
    type: 'aircraft',
    variant: 'boeing_737',
    scale: 1.0,
    height: 12.0,
    url: '/models/aircraft/commercial_plane.glb'
  },
  'helicopter_police': {
    type: 'helicopter',
    variant: 'police',
    scale: 1.0,
    height: 4.0,
    url: '/models/aircraft/helicopter_police.glb'
  },
  'drone_delivery': {
    type: 'drone',
    variant: 'delivery',
    scale: 1.0,
    height: 0.5,
    url: '/models/aircraft/drone_delivery.glb'
  }
};

// LOD configuration
export const LOD_CONFIG: LODConfig = {
  high: 100,     // < 100m = high detail
  medium: 500,   // 100-500m = medium detail
  low: 1000      // > 500m = low detail/billboard
};

class AssetManager {
  private loadedAssets: Map<string, any> = new Map();
  private loadingPromises: Map<string, Promise<any>> = new Map();
  private fallbackAssets: Map<string, any> = new Map();

  constructor() {
    this.createFallbackAssets();
  }

  // Create simple geometric fallbacks for when models fail to load
  private createFallbackAssets() {
    // These will be simple colored boxes/cylinders as fallbacks
    this.fallbackAssets.set('pedestrian', {
      type: 'primitive',
      geometry: 'cylinder',
      color: [100, 150, 255],
      dimensions: [0.5, 1.7, 0.5]
    });

    this.fallbackAssets.set('car', {
      type: 'primitive',
      geometry: 'box',
      color: [200, 50, 50],
      dimensions: [4.5, 1.5, 2.0]
    });

    this.fallbackAssets.set('bus', {
      type: 'primitive',
      geometry: 'box',
      color: [255, 200, 50],
      dimensions: [12.0, 3.0, 2.5]
    });

    this.fallbackAssets.set('truck', {
      type: 'primitive',
      geometry: 'box',
      color: [150, 150, 150],
      dimensions: [8.0, 2.5, 2.5]
    });

    this.fallbackAssets.set('aircraft', {
      type: 'primitive',
      geometry: 'box',
      color: [255, 255, 255],
      dimensions: [30.0, 4.0, 25.0]
    });
  }

  // Get asset for agent, with automatic fallback selection
  async getAssetForAgent(agentType: string, agentId?: string): Promise<any> {
    const assetKey = this.selectAssetVariant(agentType, agentId);

    try {
      return await this.loadAsset(assetKey);
    } catch (error) {
      console.warn(`Failed to load asset ${assetKey}, using fallback:`, error);
      return this.getFallbackAsset(agentType);
    }
  }

  // Select asset variant based on agent type and optional ID (for consistent assignment)
  private selectAssetVariant(agentType: string, agentId?: string): string {
    const typeAssets = Object.keys(ASSET_CATALOG).filter(key =>
      ASSET_CATALOG[key].type === agentType.toLowerCase()
    );

    if (typeAssets.length === 0) {
      throw new Error(`No assets found for type: ${agentType}`);
    }

    // Use agent ID to consistently select the same variant
    if (agentId) {
      const hash = this.hashString(agentId.toString());
      return typeAssets[hash % typeAssets.length];
    }

    // Random selection
    return typeAssets[Math.floor(Math.random() * typeAssets.length)];
  }

  // Simple string hash for consistent asset selection
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  // Load a specific asset by key
  async loadAsset(assetKey: string): Promise<any> {
    // Return cached asset if already loaded
    if (this.loadedAssets.has(assetKey)) {
      return this.loadedAssets.get(assetKey);
    }

    // Return existing loading promise if in progress
    if (this.loadingPromises.has(assetKey)) {
      return this.loadingPromises.get(assetKey);
    }

    const assetConfig = ASSET_CATALOG[assetKey];
    if (!assetConfig) {
      throw new Error(`Asset not found: ${assetKey}`);
    }

    // Start loading
    const loadingPromise = this.loadAssetData(assetConfig);
    this.loadingPromises.set(assetKey, loadingPromise);

    try {
      const assetData = await loadingPromise;
      this.loadedAssets.set(assetKey, assetData);
      this.loadingPromises.delete(assetKey);
      return assetData;
    } catch (error) {
      this.loadingPromises.delete(assetKey);
      throw error;
    }
  }

  // Load the actual asset data
  private async loadAssetData(config: AssetMetadata): Promise<any> {
    try {
      const loader = config.url.endsWith('.glb') || config.url.endsWith('.gltf')
        ? GLTFLoader
        : OBJLoader;

      const data = await load(config.url, loader);

      return {
        ...config,
        data,
        loaded: true
      };
    } catch (error) {
      console.error(`Failed to load asset from ${config.url}:`, error);
      throw error;
    }
  }

  // Get fallback asset for a type
  getFallbackAsset(agentType: string): any {
    const fallback = this.fallbackAssets.get(agentType.toLowerCase());
    if (!fallback) {
      // Ultimate fallback - a simple colored box
      return {
        type: 'primitive',
        geometry: 'box',
        color: [128, 128, 128],
        dimensions: [2.0, 1.5, 4.0]
      };
    }
    return fallback;
  }

  // Preload commonly used assets
  async preloadAssets(assetKeys: string[]): Promise<void> {
    const loadPromises = assetKeys.map(key =>
      this.loadAsset(key).catch(error =>
        console.warn(`Failed to preload asset ${key}:`, error)
      )
    );

    await Promise.all(loadPromises);
  }

  // Get asset metadata
  getAssetMetadata(assetKey: string): AssetMetadata | null {
    return ASSET_CATALOG[assetKey] || null;
  }

  // Get all assets of a specific type
  getAssetsByType(type: string): AssetMetadata[] {
    return Object.values(ASSET_CATALOG).filter(asset => asset.type === type);
  }

  // Calculate LOD level based on distance
  getLODLevel(distance: number): 'high' | 'medium' | 'low' {
    if (distance < LOD_CONFIG.high) return 'high';
    if (distance < LOD_CONFIG.medium) return 'medium';
    return 'low';
  }

  // Get camera height for agent type
  getCameraHeight(agentType: string, assetKey?: string): number {
    if (assetKey && ASSET_CATALOG[assetKey]) {
      return ASSET_CATALOG[assetKey].height;
    }

    // Default heights by type
    const defaults: Record<string, number> = {
      'pedestrian': 1.7,
      'car': 1.2,
      'bus': 2.0,
      'truck': 1.8,
      'aircraft': 12.0,
      'helicopter': 4.0,
      'drone': 0.5
    };

    return defaults[agentType.toLowerCase()] || 1.5;
  }

  // Clear cache (useful for development)
  clearCache(): void {
    this.loadedAssets.clear();
    this.loadingPromises.clear();
  }
}

// Singleton instance
export const assetManager = new AssetManager();

// Preload common assets on import
const COMMON_ASSETS = [
  'pedestrian_male',
  'pedestrian_female',
  'car_sedan',
  'car_suv',
  'bus_city'
];

assetManager.preloadAssets(COMMON_ASSETS).catch(error =>
  console.warn('Failed to preload common assets:', error)
);