// Spherical coordinate transformation utilities for 3D planet rendering

// Earth constants
export const EARTH_RADIUS_KM = 6371;
export const EARTH_RADIUS_M = EARTH_RADIUS_KM * 1000;

// Convert lat/lng to 3D Cartesian coordinates on sphere surface
export function latLngToCartesian(
  lat: number,
  lng: number,
  elevation: number = 0
): [number, number, number] {
  const radius = EARTH_RADIUS_M + elevation;
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;

  const x = radius * Math.cos(latRad) * Math.cos(lngRad);
  const y = radius * Math.cos(latRad) * Math.sin(lngRad);
  const z = radius * Math.sin(latRad);

  return [x, y, z];
}

// Convert 3D Cartesian coordinates to lat/lng
export function cartesianToLatLng(
  x: number,
  y: number,
  z: number
): [number, number, number] {
  const radius = Math.sqrt(x * x + y * y + z * z);
  const elevation = radius - EARTH_RADIUS_M;

  const lat = Math.asin(z / radius) * (180 / Math.PI);
  const lng = Math.atan2(y, x) * (180 / Math.PI);

  return [lat, lng, elevation];
}

// Generate sphere geometry for a given level of detail
export function generateSphereGeometry(
  radius: number,
  widthSegments: number = 32,
  heightSegments: number = 16
): {
  positions: number[];
  indices: number[];
  normals: number[];
  uvs: number[];
} {
  const positions: number[] = [];
  const indices: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];

  // Generate vertices
  for (let i = 0; i <= heightSegments; i++) {
    const theta = (i / heightSegments) * Math.PI;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    for (let j = 0; j <= widthSegments; j++) {
      const phi = (j / widthSegments) * Math.PI * 2;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);

      const x = radius * sinTheta * cosPhi;
      const y = radius * cosTheta;
      const z = radius * sinTheta * sinPhi;

      positions.push(x, y, z);

      // Normals point outward from center
      const length = Math.sqrt(x * x + y * y + z * z);
      normals.push(x / length, y / length, z / length);

      // UV coordinates
      uvs.push(j / widthSegments, i / heightSegments);
    }
  }

  // Generate indices for triangles
  for (let i = 0; i < heightSegments; i++) {
    for (let j = 0; j < widthSegments; j++) {
      const a = i * (widthSegments + 1) + j;
      const b = a + widthSegments + 1;

      indices.push(a, b, a + 1);
      indices.push(b, b + 1, a + 1);
    }
  }

  return { positions, indices, normals, uvs };
}

// Create terrain points on sphere surface
export function generateSphericalTerrain(
  bounds: any,
  scale: number,
  noiseFunction: (x: number, y: number) => number,
  resolution: number = 1000
): Array<{
  position: [number, number, number];
  color: [number, number, number, number];
  elevation: number;
  lat: number;
  lng: number;
}> {
  const { min_x, min_y, max_x, max_y } = bounds;
  const terrain: any[] = [];

  // Convert local coordinates to lat/lng bounds
  const centerLat = 40.7128; // NYC latitude
  const centerLng = -74.006; // NYC longitude

  // Calculate lat/lng range based on scale
  const latRange = (max_y - min_y) / (111000 * scale); // ~111km per degree
  const lngRange = (max_x - min_x) / (111000 * Math.cos(centerLat * Math.PI / 180) * scale);

  const minLat = centerLat - latRange / 2;
  const maxLat = centerLat + latRange / 2;
  const minLng = centerLng - lngRange / 2;
  const maxLng = centerLng + lngRange / 2;

  // Generate terrain points
  const latStep = (maxLat - minLat) / resolution;
  const lngStep = (maxLng - minLng) / resolution;

  for (let lat = minLat; lat <= maxLat; lat += latStep) {
    for (let lng = minLng; lng <= maxLng; lng += lngStep) {
      // Generate elevation using noise function
      const x = (lng - centerLng) * 111000 * Math.cos(lat * Math.PI / 180) * scale;
      const y = (lat - centerLat) * 111000 * scale;

      let elevation = noiseFunction(x, y);

      // Scale elevation based on planetary scale
      if (scale > 100) {
        elevation *= 10; // Exaggerate elevation for planetary view
      }

      // Convert to 3D cartesian coordinates on sphere
      const [posX, posY, posZ] = latLngToCartesian(lat, lng, elevation);

      // Determine terrain color based on elevation and lat/lng
      const color = getSphericalTerrainColor(elevation, lat, lng, scale);

      terrain.push({
        position: [posX, posY, posZ] as [number, number, number],
        color,
        elevation,
        lat,
        lng
      });
    }
  }

  return terrain;
}

// Get terrain color for spherical rendering
function getSphericalTerrainColor(
  elevation: number,
  lat: number,
  lng: number,
  scale: number
): [number, number, number, number] {
  // Base terrain colors
  let baseColor: [number, number, number];

  if (elevation < -100) {
    // Deep ocean
    baseColor = [25, 25, 112];
  } else if (elevation < 0) {
    // Shallow water
    baseColor = [65, 105, 225];
  } else if (elevation < 100) {
    // Coastal/lowlands - vary by latitude
    if (Math.abs(lat) > 60) {
      // Arctic regions
      baseColor = [240, 248, 255];
    } else if (Math.abs(lat) > 30) {
      // Temperate regions
      baseColor = [34, 139, 34];
    } else {
      // Tropical regions
      baseColor = [0, 100, 0];
    }
  } else if (elevation < 500) {
    // Hills
    baseColor = [139, 119, 101];
  } else if (elevation < 1500) {
    // Mountains
    baseColor = [139, 137, 137];
  } else {
    // High peaks (snow)
    baseColor = [255, 255, 255];
  }

  // Add atmospheric perspective for distant terrain
  if (scale > 100) {
    const atmosphericBlue = [135, 206, 235];
    const distance = Math.min(1, scale / 10000);
    baseColor = baseColor.map((c, i) =>
      Math.round(c * (1 - distance * 0.3) + atmosphericBlue[i] * distance * 0.3)
    ) as [number, number, number];
  }

  return [...baseColor, 200] as [number, number, number, number];
}

// Create sphere mesh data for SimpleMeshLayer
export function createSphereMesh(
  radius: number = EARTH_RADIUS_M,
  resolution: number = 32
) {
  const { positions, indices, normals, uvs } = generateSphereGeometry(
    radius,
    resolution,
    resolution / 2
  );

  return {
    positions: new Float32Array(positions),
    indices: new Uint32Array(indices),
    normals: new Float32Array(normals),
    texCoords: new Float32Array(uvs)
  };
}

// Calculate visible hemisphere based on camera position
export function getVisibleHemisphere(
  cameraLat: number,
  cameraLng: number,
  cameraDistance: number
): {
  centerLat: number;
  centerLng: number;
  radius: number;
} {
  // For now, return the hemisphere centered on camera position
  // TODO: Calculate actual visible area based on camera distance and FOV
  const radius = Math.min(90, cameraDistance / (EARTH_RADIUS_M * 0.1));

  return {
    centerLat: cameraLat,
    centerLng: cameraLng,
    radius
  };
}