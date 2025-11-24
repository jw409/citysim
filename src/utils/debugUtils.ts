/**
 * Debug utilities for inspecting the 3D visualization system
 */

import {
  QuadTree,
  SpatialObject,
  createSpatialObjectsFromLayerData,
  ObjectCluster,
} from './spatialIndex';

interface LayerInfo {
  id: string;
  type: string;
  visible: boolean;
  objectCount: number;
  props: any;
  performance?: {
    updateTime?: number;
    renderTime?: number;
  };
}

// ObjectCluster is now imported from spatialIndex

interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

interface DebugInfo {
  layers: LayerInfo[];
  clusters: ObjectCluster[];
  viewState: ViewState;
  performance: {
    fps: number;
    frameTime: number;
    layerCount: number;
    totalObjects: number;
  };
  spatialIndex?: {
    type: string;
    nodeCount: number;
    maxDepth: number;
  };
}

class DebugManager {
  private static instance: DebugManager;
  private layers: Map<string, LayerInfo> = new Map();
  private clusters: ObjectCluster[] = [];
  private viewState: ViewState = { longitude: 0, latitude: 0, zoom: 0, pitch: 0, bearing: 0 };
  private performance = { fps: 0, frameTime: 0, layerCount: 0, totalObjects: 0 };
  private spatialIndex?: QuadTree;

  // Performance monitoring
  private frameCount = 0;
  private lastFPSUpdate = performance.now();
  private frameTimeStart = 0;

  static getInstance(): DebugManager {
    if (!DebugManager.instance) {
      DebugManager.instance = new DebugManager();
    }
    return DebugManager.instance;
  }

  /**
   * Register a layer for debugging
   */
  registerLayer(layer: any): void {
    try {
      if (!layer || !layer.id) {
        console.warn('Invalid layer passed to debugManager.registerLayer:', layer);
        return;
      }

      const layerInfo: LayerInfo = {
        id: layer.id || 'unknown',
        type: layer.constructor?.name || 'Unknown',
        visible: layer.props?.visible !== false,
        objectCount: Array.isArray(layer.props?.data) ? layer.props.data.length : 0,
        props: {
          extruded: layer.props?.extruded,
          elevationScale: layer.props?.elevationScale,
          pickable: layer.props?.pickable,
          ...(layer.props || {}),
        },
      };

      this.layers.set(layer.id, layerInfo);
      this.updatePerformance();
    } catch (error) {
      console.warn('Error registering layer for debugging:', error, layer);
    }
  }

  /**
   * Update layer performance metrics
   */
  updateLayerPerformance(layerId: string, updateTime: number, renderTime?: number): void {
    const layer = this.layers.get(layerId);
    if (layer) {
      layer.performance = {
        updateTime,
        renderTime,
      };
    }
  }

  /**
   * Register object clusters for spatial debugging
   */
  registerClusters(clusters: ObjectCluster[]): void {
    this.clusters = clusters;
  }

  /**
   * Update current view state
   */
  updateViewState(newViewState: ViewState): void {
    this.viewState = { ...newViewState };
  }

  /**
   * Build spatial index from all layer data
   */
  buildSpatialIndex(): void {
    try {
      // Calculate bounds from all layers
      const allObjects: SpatialObject[] = [];

      for (const [layerId, layerInfo] of this.layers) {
        if (layerInfo.props?.data && Array.isArray(layerInfo.props.data)) {
          try {
            const spatialObjects = createSpatialObjectsFromLayerData(layerInfo.props.data, layerId);
            allObjects.push(...spatialObjects);
          } catch (error) {
            console.warn(`Error creating spatial objects for layer ${layerId}:`, error);
          }
        }
      }

      if (allObjects.length === 0) {
        console.log('🗺️ No objects found for spatial indexing');
        return;
      }

      // Calculate world bounds
      const bounds = {
        minX: Math.min(...allObjects.map(o => o.longitude)),
        maxX: Math.max(...allObjects.map(o => o.longitude)),
        minY: Math.min(...allObjects.map(o => o.latitude)),
        maxY: Math.max(...allObjects.map(o => o.latitude)),
      };

      // Add some padding
      const paddingX = (bounds.maxX - bounds.minX) * 0.1;
      const paddingY = (bounds.maxY - bounds.minY) * 0.1;
      bounds.minX -= paddingX;
      bounds.maxX += paddingX;
      bounds.minY -= paddingY;
      bounds.maxY += paddingY;

      // Create and populate spatial index
      this.spatialIndex = new QuadTree(bounds, 10, 8);
      this.spatialIndex.insertMany(allObjects);

      // Generate clusters
      this.clusters = this.spatialIndex.createClusters(5, 0.001);

      console.log('🗺️ Spatial index built:', {
        objects: allObjects.length,
        clusters: this.clusters.length,
        stats: this.spatialIndex.getStats(),
      });
    } catch (error) {
      console.warn('Error building spatial index:', error);
      this.spatialIndex = undefined;
      this.clusters = [];
    }
  }

  /**
   * Update spatial index information (for legacy compatibility)
   */
  updateSpatialIndex(index?: any): void {
    if (index) {
      // Legacy method - just store the info
      this.spatialIndex = index;
    } else {
      // Auto-build from layer data
      this.buildSpatialIndex();
    }
  }

  /**
   * Start frame performance measurement
   */
  startFrame(): void {
    this.frameTimeStart = performance.now();
  }

  /**
   * End frame performance measurement
   */
  endFrame(): void {
    const frameTime = performance.now() - this.frameTimeStart;
    this.frameCount++;

    const now = performance.now();
    if (now - this.lastFPSUpdate >= 1000) {
      this.performance.fps = Math.round((this.frameCount * 1000) / (now - this.lastFPSUpdate));
      this.frameCount = 0;
      this.lastFPSUpdate = now;
    }

    this.performance.frameTime = frameTime;
    this.updatePerformance();
  }

  /**
   * Update overall performance metrics
   */
  private updatePerformance(): void {
    this.performance.layerCount = this.layers.size;
    this.performance.totalObjects = Array.from(this.layers.values()).reduce(
      (total, layer) => total + layer.objectCount,
      0
    );
  }

  /**
   * Get current debug information
   */
  getDebugInfo(): DebugInfo {
    let spatialIndexInfo = undefined;
    if (this.spatialIndex) {
      const stats = this.spatialIndex.getStats();
      spatialIndexInfo = {
        type: 'QuadTree',
        nodeCount: stats.nodeCount,
        maxDepth: stats.maxDepth,
      };
    }

    return {
      layers: Array.from(this.layers.values()),
      clusters: this.clusters,
      viewState: this.viewState,
      performance: { ...this.performance },
      spatialIndex: spatialIndexInfo,
    };
  }

  /**
   * Find objects at a specific location
   */
  findObjectsAt(longitude: number, latitude: number, radius: number = 0.001): any[] {
    if (this.spatialIndex) {
      // Use spatial index for efficient lookup
      const spatialObjects = this.spatialIndex.queryCircle(longitude, latitude, radius);
      return spatialObjects.map(obj => obj.data);
    }

    // Fallback to cluster search
    const objects: any[] = [];
    for (const cluster of this.clusters) {
      if (this.isPointInBounds(longitude, latitude, cluster.bounds, radius)) {
        objects.push(
          ...cluster.objects.filter(
            obj =>
              this.getDistance(
                longitude,
                latitude,
                obj.longitude || obj.x,
                obj.latitude || obj.y
              ) <= radius
          )
        );
      }
    }

    return objects;
  }

  /**
   * Search objects by ID or type
   */
  searchObjects(query: string): any[] {
    const results: any[] = [];
    const lowerQuery = query.toLowerCase();

    if (this.spatialIndex) {
      // Use spatial index for efficient search
      const allObjects = this.spatialIndex.getAllObjects();

      for (const obj of allObjects) {
        const data = obj.data;
        if (
          (obj.id && obj.id.toString().toLowerCase().includes(lowerQuery)) ||
          (obj.type && obj.type.toLowerCase().includes(lowerQuery)) ||
          (data && data.id && data.id.toString().toLowerCase().includes(lowerQuery)) ||
          (data && data.type && data.type.toLowerCase().includes(lowerQuery)) ||
          (data && data.name && data.name.toLowerCase().includes(lowerQuery))
        ) {
          results.push(data);
        }
      }
    } else {
      // Fallback to cluster search
      for (const cluster of this.clusters) {
        for (const obj of cluster.objects) {
          if (
            (obj.id && obj.id.toString().toLowerCase().includes(lowerQuery)) ||
            (obj.type && obj.type.toLowerCase().includes(lowerQuery)) ||
            (obj.name && obj.name.toLowerCase().includes(lowerQuery))
          ) {
            results.push(obj);
          }
        }
      }
    }

    return results;
  }

  /**
   * Get objects within viewport
   */
  getViewportObjects(): any[] {
    const { longitude, latitude, zoom } = this.viewState;
    const radius = this.getViewportRadius(zoom);

    return this.findObjectsAt(longitude, latitude, radius);
  }

  /**
   * Helper methods
   */
  private isPointInBounds(lng: number, lat: number, bounds: any, radius: number): boolean {
    return (
      lng + radius >= bounds.minX &&
      lng - radius <= bounds.maxX &&
      lat + radius >= bounds.minY &&
      lat - radius <= bounds.maxY
    );
  }

  private getDistance(lng1: number, lat1: number, lng2: number, lat2: number): number {
    const dLng = lng2 - lng1;
    const dLat = lat2 - lat1;
    return Math.sqrt(dLng * dLng + dLat * dLat);
  }

  private getViewportRadius(zoom: number): number {
    // Approximate viewport radius based on zoom level
    return 180 / Math.pow(2, zoom);
  }

  /**
   * Export debug data as JSON
   */
  exportDebugData(): string {
    return JSON.stringify(this.getDebugInfo(), null, 2);
  }

  /**
   * Log debug summary to console
   */
  logDebugSummary(): void {
    const info = this.getDebugInfo();
    console.group('🔍 Debug Summary');
    console.log('Layers:', info.layers.length);
    console.log('Total Objects:', info.performance.totalObjects);
    console.log('FPS:', info.performance.fps);
    console.log('Frame Time:', info.performance.frameTime.toFixed(2) + 'ms');
    console.log('View State:', info.viewState);
    console.table(
      info.layers.map(l => ({
        id: l.id,
        type: l.type,
        objects: l.objectCount,
        visible: l.visible,
        extruded: l.props.extruded,
      }))
    );
    console.groupEnd();
  }
}

// Export singleton instance
export const debugManager = DebugManager.getInstance();

// Make available globally for console debugging
(window as any).urbanSynthDebug = {
  manager: debugManager,
  getInfo: () => debugManager.getDebugInfo(),
  findAt: (lng: number, lat: number, radius?: number) =>
    debugManager.findObjectsAt(lng, lat, radius),
  search: (query: string) => debugManager.searchObjects(query),
  export: () => debugManager.exportDebugData(),
  log: () => debugManager.logDebugSummary(),
};

console.log('🔍 UrbanSynth Debug Tools loaded. Use `urbanSynthDebug` in console for debugging.');
