/**
 * Spatial indexing utilities for efficient object lookup and clustering
 */

export interface SpatialObject {
  id: string;
  longitude: number;
  latitude: number;
  type?: string;
  data?: any;
}

export interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface QuadTreeNode {
  bounds: BoundingBox;
  objects: SpatialObject[];
  children?: QuadTreeNode[];
  level: number;
}

export class QuadTree {
  private root: QuadTreeNode;
  private readonly maxObjects: number;
  private readonly maxLevels: number;
  public nodeCount: number = 0;
  public maxDepth: number = 0;

  constructor(bounds: BoundingBox, maxObjects: number = 10, maxLevels: number = 8) {
    this.maxObjects = maxObjects;
    this.maxLevels = maxLevels;
    this.root = {
      bounds,
      objects: [],
      level: 0
    };
    this.nodeCount = 1;
  }

  /**
   * Insert an object into the quadtree
   */
  insert(object: SpatialObject): void {
    this.insertIntoNode(this.root, object);
  }

  /**
   * Insert multiple objects efficiently
   */
  insertMany(objects: SpatialObject[]): void {
    objects.forEach(obj => this.insert(obj));
  }

  /**
   * Query objects within a bounding box
   */
  query(bounds: BoundingBox): SpatialObject[] {
    const results: SpatialObject[] = [];
    this.queryNode(this.root, bounds, results);
    return results;
  }

  /**
   * Query objects within a circular area
   */
  queryCircle(centerX: number, centerY: number, radius: number): SpatialObject[] {
    const bounds: BoundingBox = {
      minX: centerX - radius,
      maxX: centerX + radius,
      minY: centerY - radius,
      maxY: centerY + radius
    };

    const candidates = this.query(bounds);

    // Filter by actual distance
    return candidates.filter(obj => {
      const dx = obj.longitude - centerX;
      const dy = obj.latitude - centerY;
      return Math.sqrt(dx * dx + dy * dy) <= radius;
    });
  }

  /**
   * Find the nearest objects to a point
   */
  findNearest(x: number, y: number, count: number = 1): SpatialObject[] {
    const allObjects = this.getAllObjects();

    // Calculate distances and sort
    const withDistances = allObjects.map(obj => ({
      object: obj,
      distance: this.getDistance(x, y, obj.longitude, obj.latitude)
    }));

    withDistances.sort((a, b) => a.distance - b.distance);

    return withDistances.slice(0, count).map(item => item.object);
  }

  /**
   * Get all objects in the tree
   */
  getAllObjects(): SpatialObject[] {
    const results: SpatialObject[] = [];
    this.collectAllObjects(this.root, results);
    return results;
  }

  /**
   * Get objects by type
   */
  getObjectsByType(type: string): SpatialObject[] {
    return this.getAllObjects().filter(obj => obj.type === type);
  }

  /**
   * Clear the tree
   */
  clear(): void {
    this.root = {
      bounds: this.root.bounds,
      objects: [],
      level: 0
    };
    this.nodeCount = 1;
    this.maxDepth = 0;
  }

  /**
   * Get tree statistics
   */
  getStats(): {
    totalObjects: number;
    nodeCount: number;
    maxDepth: number;
    averageObjectsPerLeaf: number;
  } {
    const leafNodes: QuadTreeNode[] = [];
    this.collectLeafNodes(this.root, leafNodes);

    const totalObjects = this.getAllObjects().length;
    const averageObjectsPerLeaf = leafNodes.length > 0 ?
      leafNodes.reduce((sum, node) => sum + node.objects.length, 0) / leafNodes.length : 0;

    return {
      totalObjects,
      nodeCount: this.nodeCount,
      maxDepth: this.maxDepth,
      averageObjectsPerLeaf
    };
  }

  /**
   * Create clusters based on spatial proximity
   */
  createClusters(minClusterSize: number = 5, maxDistance: number = 0.001): ObjectCluster[] {
    const objects = this.getAllObjects();
    const clusters: ObjectCluster[] = [];
    const processed = new Set<string>();

    for (const obj of objects) {
      if (processed.has(obj.id)) continue;

      // Find nearby objects
      const nearby = this.queryCircle(obj.longitude, obj.latitude, maxDistance);

      if (nearby.length >= minClusterSize) {
        const clusterObjects = nearby.filter(o => !processed.has(o.id));

        if (clusterObjects.length >= minClusterSize) {
          // Calculate cluster bounds
          const bounds = this.calculateBounds(clusterObjects);

          const cluster: ObjectCluster = {
            id: `cluster_${clusters.length}`,
            type: this.getMostCommonType(clusterObjects),
            position: [
              (bounds.minX + bounds.maxX) / 2,
              (bounds.minY + bounds.maxY) / 2,
              0
            ],
            bounds,
            objects: clusterObjects
          };

          clusters.push(cluster);

          // Mark objects as processed
          clusterObjects.forEach(o => processed.add(o.id));
        }
      }
    }

    return clusters;
  }

  // Private methods

  private insertIntoNode(node: QuadTreeNode, object: SpatialObject): void {
    // If object doesn't fit in this node's bounds, ignore it
    if (!this.boundsContainPoint(node.bounds, object.longitude, object.latitude)) {
      return;
    }

    // If node has no children and can accept more objects
    if (!node.children && node.objects.length < this.maxObjects) {
      node.objects.push(object);
      return;
    }

    // If node has no children but is at capacity, split it
    if (!node.children) {
      if (node.level < this.maxLevels) {
        this.split(node);
      } else {
        // At max level, just add to this node
        node.objects.push(object);
        return;
      }
    }

    // Insert into appropriate child
    if (node.children) {
      for (const child of node.children) {
        if (this.boundsContainPoint(child.bounds, object.longitude, object.latitude)) {
          this.insertIntoNode(child, object);
          break;
        }
      }
    }
  }

  private split(node: QuadTreeNode): void {
    const { bounds, level } = node;
    const midX = (bounds.minX + bounds.maxX) / 2;
    const midY = (bounds.minY + bounds.maxY) / 2;

    node.children = [
      // NW
      {
        bounds: { minX: bounds.minX, maxX: midX, minY: midY, maxY: bounds.maxY },
        objects: [],
        level: level + 1
      },
      // NE
      {
        bounds: { minX: midX, maxX: bounds.maxX, minY: midY, maxY: bounds.maxY },
        objects: [],
        level: level + 1
      },
      // SW
      {
        bounds: { minX: bounds.minX, maxX: midX, minY: bounds.minY, maxY: midY },
        objects: [],
        level: level + 1
      },
      // SE
      {
        bounds: { minX: midX, maxX: bounds.maxX, minY: bounds.minY, maxY: midY },
        objects: [],
        level: level + 1
      }
    ];

    this.nodeCount += 4;
    this.maxDepth = Math.max(this.maxDepth, level + 1);

    // Redistribute existing objects
    const objectsToRedistribute = [...node.objects];
    node.objects = [];

    for (const obj of objectsToRedistribute) {
      this.insertIntoNode(node, obj);
    }
  }

  private queryNode(node: QuadTreeNode, bounds: BoundingBox, results: SpatialObject[]): void {
    if (!this.boundsIntersect(node.bounds, bounds)) {
      return;
    }

    // Check objects in this node
    for (const obj of node.objects) {
      if (this.boundsContainPoint(bounds, obj.longitude, obj.latitude)) {
        results.push(obj);
      }
    }

    // Check children
    if (node.children) {
      for (const child of node.children) {
        this.queryNode(child, bounds, results);
      }
    }
  }

  private collectAllObjects(node: QuadTreeNode, results: SpatialObject[]): void {
    results.push(...node.objects);

    if (node.children) {
      for (const child of node.children) {
        this.collectAllObjects(child, results);
      }
    }
  }

  private collectLeafNodes(node: QuadTreeNode, leafNodes: QuadTreeNode[]): void {
    if (!node.children) {
      leafNodes.push(node);
    } else {
      for (const child of node.children) {
        this.collectLeafNodes(child, leafNodes);
      }
    }
  }

  private boundsContainPoint(bounds: BoundingBox, x: number, y: number): boolean {
    return x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY;
  }

  private boundsIntersect(bounds1: BoundingBox, bounds2: BoundingBox): boolean {
    return !(bounds1.maxX < bounds2.minX || bounds1.minX > bounds2.maxX ||
             bounds1.maxY < bounds2.minY || bounds1.minY > bounds2.maxY);
  }

  private getDistance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private calculateBounds(objects: SpatialObject[]): BoundingBox {
    if (objects.length === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    let minX = objects[0].longitude;
    let maxX = objects[0].longitude;
    let minY = objects[0].latitude;
    let maxY = objects[0].latitude;

    for (const obj of objects) {
      minX = Math.min(minX, obj.longitude);
      maxX = Math.max(maxX, obj.longitude);
      minY = Math.min(minY, obj.latitude);
      maxY = Math.max(maxY, obj.latitude);
    }

    return { minX, maxX, minY, maxY };
  }

  private getMostCommonType(objects: SpatialObject[]): string {
    const typeCounts = new Map<string, number>();

    for (const obj of objects) {
      const type = obj.type || 'unknown';
      typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
    }

    let mostCommonType = 'unknown';
    let maxCount = 0;

    for (const [type, count] of typeCounts) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonType = type;
      }
    }

    return mostCommonType;
  }
}

// Object cluster interface for debug manager
export interface ObjectCluster {
  id: string;
  type: string;
  position: [number, number, number];
  bounds: BoundingBox;
  objects: SpatialObject[];
}

/**
 * Utility function to create spatial objects from layer data
 */
export function createSpatialObjectsFromLayerData(layerData: any[], layerType: string): SpatialObject[] {
  const objects: SpatialObject[] = [];

  for (const item of layerData) {
    let longitude: number, latitude: number;

    // Extract coordinates based on different data formats
    if (item.longitude !== undefined && item.latitude !== undefined) {
      longitude = item.longitude;
      latitude = item.latitude;
    } else if (item.position && Array.isArray(item.position)) {
      longitude = item.position[0];
      latitude = item.position[1];
    } else if (item.footprint && Array.isArray(item.footprint) && item.footprint.length > 0) {
      // For polygons, use centroid
      const polygon = item.footprint;
      const centroid = calculatePolygonCentroid(polygon);
      longitude = centroid[0];
      latitude = centroid[1];
    } else if (item.x !== undefined && item.y !== undefined) {
      // Convert from local coordinates to lng/lat (simplified)
      longitude = item.x / 111320; // Rough conversion
      latitude = item.y / 110540;
    } else {
      continue; // Skip items without valid coordinates
    }

    objects.push({
      id: item.id || `${layerType}_${objects.length}`,
      longitude,
      latitude,
      type: layerType,
      data: item
    });
  }

  return objects;
}

/**
 * Calculate the centroid of a polygon
 */
function calculatePolygonCentroid(polygon: number[][]): [number, number] {
  let x = 0;
  let y = 0;
  const length = polygon.length;

  for (const point of polygon) {
    x += point[0];
    y += point[1];
  }

  return [x / length, y / length];
}