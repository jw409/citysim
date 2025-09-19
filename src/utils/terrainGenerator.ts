import { PolygonLayer, PathLayer, ScatterplotLayer } from '@deck.gl/layers';
import { localToLatLng } from './coordinates';

// Generate terrain features around city bounds
export function generateTerrainLayers(bounds: any, timeOfDay: number = 12) {
  const { min_x, min_y, max_x, max_y } = bounds;
  const cityWidth = max_x - min_x;
  const cityHeight = max_y - min_y;
  const padding = Math.max(cityWidth, cityHeight) * 0.5;

  const layers: any[] = [];

  // Generate hills/mountains around the city
  const hills = generateHills(bounds, padding);
  if (hills.length > 0) {
    layers.push(new PolygonLayer({
      id: 'hills',
      data: hills,
      getPolygon: (d: any) => d.polygon.map((p: any) => localToLatLng(p[0], p[1])),
      getFillColor: getHillColor(timeOfDay),
      getLineColor: [100, 120, 80, 100],
      getLineWidth: 1,
      filled: true,
      stroked: true,
      extruded: true,
      getElevation: (d: any) => d.height,
      pickable: false,
    }));
  }

  // Generate forests around the perimeter
  const forests = generateForests(bounds, padding);
  if (forests.length > 0) {
    layers.push(new PolygonLayer({
      id: 'forests',
      data: forests,
      getPolygon: (d: any) => d.polygon.map((p: any) => localToLatLng(p[0], p[1])),
      getFillColor: getForestColor(timeOfDay),
      getLineColor: [40, 80, 40, 80],
      getLineWidth: 0.5,
      filled: true,
      stroked: false,
      extruded: false,
      pickable: false,
    }));
  }

  // Generate water features
  const waterFeatures = generateWaterFeatures(bounds, padding);
  if (waterFeatures.length > 0) {
    layers.push(new PolygonLayer({
      id: 'water',
      data: waterFeatures,
      getPolygon: (d: any) => d.polygon.map((p: any) => localToLatLng(p[0], p[1])),
      getFillColor: getWaterColor(timeOfDay),
      getLineColor: [70, 130, 180, 120],
      getLineWidth: 1,
      filled: true,
      stroked: true,
      extruded: false,
      pickable: false,
    }));
  }

  // Generate scattered vegetation/trees
  const vegetation = generateScatteredVegetation(bounds, padding);
  if (vegetation.length > 0) {
    layers.push(new ScatterplotLayer({
      id: 'vegetation',
      data: vegetation,
      getPosition: (d: any) => localToLatLng(d.x, d.y),
      getRadius: (d: any) => d.size,
      getFillColor: getVegetationColor(timeOfDay),
      pickable: false,
      radiusMinPixels: 2,
      radiusMaxPixels: 8,
    }));
  }

  return layers;
}

function generateHills(bounds: any, padding: number): any[] {
  const { min_x, min_y, max_x, max_y } = bounds;
  const hills: any[] = [];

  // Generate 3-5 hills around the city
  const numHills = 3 + Math.floor(Math.random() * 3);

  for (let i = 0; i < numHills; i++) {
    const angle = (i / numHills) * 2 * Math.PI + Math.random() * 0.5;
    const distance = padding * (0.7 + Math.random() * 0.6);

    const centerX = ((min_x + max_x) / 2) + Math.cos(angle) * distance;
    const centerY = ((min_y + max_y) / 2) + Math.sin(angle) * distance;

    const hillRadius = 200 + Math.random() * 400;
    const hillHeight = 50 + Math.random() * 150;

    // Create irregular hill shape
    const hillPoints: number[][] = [];
    const numPoints = 8 + Math.floor(Math.random() * 4);

    for (let j = 0; j < numPoints; j++) {
      const pointAngle = (j / numPoints) * 2 * Math.PI;
      const variance = 0.7 + Math.random() * 0.6;
      const pointDistance = hillRadius * variance;

      hillPoints.push([
        centerX + Math.cos(pointAngle) * pointDistance,
        centerY + Math.sin(pointAngle) * pointDistance
      ]);
    }

    hills.push({
      polygon: hillPoints,
      height: hillHeight,
      type: 'hill'
    });
  }

  return hills;
}

function generateForests(bounds: any, padding: number): any[] {
  const { min_x, min_y, max_x, max_y } = bounds;
  const forests: any[] = [];

  // Generate forest patches around the city
  const numForests = 4 + Math.floor(Math.random() * 4);

  for (let i = 0; i < numForests; i++) {
    const side = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
    let centerX: number, centerY: number;

    switch (side) {
      case 0: // Top
        centerX = min_x + Math.random() * (max_x - min_x);
        centerY = max_y + padding * (0.3 + Math.random() * 0.4);
        break;
      case 1: // Right
        centerX = max_x + padding * (0.3 + Math.random() * 0.4);
        centerY = min_y + Math.random() * (max_y - min_y);
        break;
      case 2: // Bottom
        centerX = min_x + Math.random() * (max_x - min_x);
        centerY = min_y - padding * (0.3 + Math.random() * 0.4);
        break;
      default: // Left
        centerX = min_x - padding * (0.3 + Math.random() * 0.4);
        centerY = min_y + Math.random() * (max_y - min_y);
        break;
    }

    const forestSize = 300 + Math.random() * 500;

    // Create organic forest shape
    const forestPoints: number[][] = [];
    const numPoints = 6 + Math.floor(Math.random() * 4);

    for (let j = 0; j < numPoints; j++) {
      const angle = (j / numPoints) * 2 * Math.PI;
      const variance = 0.6 + Math.random() * 0.8;
      const distance = forestSize * variance;

      forestPoints.push([
        centerX + Math.cos(angle) * distance,
        centerY + Math.sin(angle) * distance
      ]);
    }

    forests.push({
      polygon: forestPoints,
      type: 'forest'
    });
  }

  return forests;
}

function generateWaterFeatures(bounds: any, padding: number): any[] {
  const { min_x, min_y, max_x, max_y } = bounds;
  const waterFeatures: any[] = [];

  // Generate 1-2 water features (lakes, rivers)
  const numWaterFeatures = 1 + Math.floor(Math.random() * 2);

  for (let i = 0; i < numWaterFeatures; i++) {
    if (Math.random() < 0.6) {
      // Generate a lake
      const centerX = min_x + Math.random() * (max_x - min_x);
      const centerY = min_y + Math.random() * (max_y - min_y);
      const lakeSize = 150 + Math.random() * 300;

      const lakePoints: number[][] = [];
      const numPoints = 8 + Math.floor(Math.random() * 4);

      for (let j = 0; j < numPoints; j++) {
        const angle = (j / numPoints) * 2 * Math.PI;
        const variance = 0.7 + Math.random() * 0.6;
        const distance = lakeSize * variance;

        lakePoints.push([
          centerX + Math.cos(angle) * distance,
          centerY + Math.sin(angle) * distance
        ]);
      }

      waterFeatures.push({
        polygon: lakePoints,
        type: 'lake'
      });
    } else {
      // Generate a river (simplified as elongated water body)
      const startX = Math.random() < 0.5 ? min_x - padding * 0.5 : max_x + padding * 0.5;
      const startY = min_y + Math.random() * (max_y - min_y);
      const endX = Math.random() < 0.5 ? min_x - padding * 0.5 : max_x + padding * 0.5;
      const endY = min_y + Math.random() * (max_y - min_y);

      const riverWidth = 50 + Math.random() * 100;

      waterFeatures.push({
        polygon: [
          [startX - riverWidth/2, startY],
          [endX - riverWidth/2, endY],
          [endX + riverWidth/2, endY],
          [startX + riverWidth/2, startY]
        ],
        type: 'river'
      });
    }
  }

  return waterFeatures;
}

function generateScatteredVegetation(bounds: any, padding: number): any[] {
  const { min_x, min_y, max_x, max_y } = bounds;
  const vegetation: any[] = [];

  // Generate scattered trees and bushes
  const numVegetation = 50 + Math.floor(Math.random() * 100);

  for (let i = 0; i < numVegetation; i++) {
    // Place vegetation around the city perimeter
    const angle = Math.random() * 2 * Math.PI;
    const distance = padding * (0.2 + Math.random() * 0.8);

    const x = ((min_x + max_x) / 2) + Math.cos(angle) * distance;
    const y = ((min_y + max_y) / 2) + Math.sin(angle) * distance;

    vegetation.push({
      x,
      y,
      size: 10 + Math.random() * 20,
      type: Math.random() < 0.7 ? 'tree' : 'bush'
    });
  }

  return vegetation;
}

// Color functions based on time of day
function getHillColor(timeOfDay: number): number[] {
  if (timeOfDay >= 6 && timeOfDay <= 18) {
    // Daytime - brown/green hills
    return [101, 67, 33, 180];
  } else {
    // Nighttime - darker hills
    return [60, 40, 20, 180];
  }
}

function getForestColor(timeOfDay: number): number[] {
  if (timeOfDay >= 6 && timeOfDay <= 18) {
    // Daytime - green forest
    return [34, 139, 34, 160];
  } else {
    // Nighttime - darker forest
    return [20, 80, 20, 160];
  }
}

function getWaterColor(timeOfDay: number): number[] {
  if (timeOfDay >= 6 && timeOfDay <= 18) {
    // Daytime - blue water
    return [70, 130, 180, 200];
  } else {
    // Nighttime - darker water
    return [30, 60, 90, 200];
  }
}

function getVegetationColor(timeOfDay: number): number[] {
  if (timeOfDay >= 6 && timeOfDay <= 18) {
    // Daytime - green vegetation
    return [46, 125, 50, 180];
  } else {
    // Nighttime - darker vegetation
    return [25, 70, 30, 180];
  }
}