import { PolygonLayer } from '@deck.gl/layers';

// Simplex noise function for realistic terrain generation
function noise(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return (n - Math.floor(n));
}

// Generate layered noise for realistic terrain with local hills
function getTerrainHeight(x: number, y: number): number {
  const scale1 = 0.0003; // Very large terrain features
  const scale2 = 0.0015; // Medium terrain features
  const scale3 = 0.006;  // Fine terrain details

  const noise1 = noise(x * scale1, y * scale1) * 20; // ±20m major elevation
  const noise2 = noise(x * scale2, y * scale2) * 12; // ±12m medium hills
  const noise3 = noise(x * scale3, y * scale3) * 4;  // ±4m fine details

  // Create 3 large dramatic hills with smooth falloff
  const hill1CenterX = 2500, hill1CenterY = 2000; // Northeast hill
  const hill2CenterX = -3000, hill2CenterY = -1500; // Southwest hill
  const hill3CenterX = 1000, hill3CenterY = -3500; // Southeast hill

  // Calculate distance to each hill center
  const dist1 = Math.sqrt((x - hill1CenterX) * (x - hill1CenterX) + (y - hill1CenterY) * (y - hill1CenterY));
  const dist2 = Math.sqrt((x - hill2CenterX) * (x - hill2CenterX) + (y - hill2CenterY) * (y - hill2CenterY));
  const dist3 = Math.sqrt((x - hill3CenterX) * (x - hill3CenterX) + (y - hill3CenterY) * (y - hill3CenterY));

  // Create dramatic hill profiles with smooth Gaussian falloff
  const hillRadius = 2200; // 2.2km radius for each hill (slightly larger)
  const hill1Height = Math.max(0, 180 * Math.exp(-Math.pow(dist1 / hillRadius, 2))); // Peak 180m - DRAMATIC!
  const hill2Height = Math.max(0, 200 * Math.exp(-Math.pow(dist2 / hillRadius, 2))); // Peak 200m - MASSIVE!
  const hill3Height = Math.max(0, 160 * Math.exp(-Math.pow(dist3 / hillRadius, 2))); // Peak 160m - BIG!

  // Add noise variation to hill surfaces for naturalness
  const hillNoise1 = hill1Height > 5 ? noise(x * 0.002, y * 0.002) * hill1Height * 0.15 : 0;
  const hillNoise2 = hill2Height > 5 ? noise(x * 0.002 + 100, y * 0.002 + 100) * hill2Height * 0.15 : 0;
  const hillNoise3 = hill3Height > 5 ? noise(x * 0.002 + 200, y * 0.002 + 200) * hill3Height * 0.15 : 0;

  const hills = hill1Height + hill2Height + hill3Height + hillNoise1 + hillNoise2 + hillNoise3;

  // Base terrain (very subtle)
  const baseTerrain = noise1 + noise2 + noise3;

  // Combine with reduced base terrain influence
  const totalElevation = baseTerrain * 0.3 + hills;

  // Less flattening near downtown, but still some
  const distanceFromCenter = Math.sqrt(x * x + y * y);
  const flatteningFactor = Math.max(0.7, 1 - (distanceFromCenter / 10000)); // Less aggressive flattening

  return totalElevation * flatteningFactor;
}

export function createTerrainLayer() {
  // Use the same coordinate system as buildings (meters from city center)
  const terrainSize = 12000; // 12km x 12km to cover entire city
  const patchSize = 600; // 600m x 600m patches for very smooth borders
  const patchesPerSide = Math.ceil(terrainSize / patchSize);
  const halfSize = terrainSize / 2;

  const terrainPatches = [];

  for (let x = 0; x < patchesPerSide; x++) {
    for (let y = 0; y < patchesPerSide; y++) {
      const centerX = -halfSize + (x + 0.5) * patchSize;
      const centerY = -halfSize + (y + 0.5) * patchSize;

      // Get terrain height at this location
      const elevation = getTerrainHeight(centerX, centerY);

      // Ultra-realistic terrain coloring with proper elevation zones and lighting
      const distanceFromCenter = Math.sqrt(centerX * centerX + centerY * centerY);
      const urbanFactor = Math.max(0, 1 - (distanceFromCenter / 5000)); // 0 = rural, 1 = urban

      // Calculate slope for lighting (approximate using nearby elevation changes)
      const sampleDistance = 300; // Sample distance for slope calculation
      const elevationEast = getTerrainHeight(centerX + sampleDistance, centerY);
      const elevationWest = getTerrainHeight(centerX - sampleDistance, centerY);
      const elevationNorth = getTerrainHeight(centerX, centerY + sampleDistance);
      const elevationSouth = getTerrainHeight(centerX, centerY - sampleDistance);

      const slopeX = (elevationEast - elevationWest) / (sampleDistance * 2);
      const slopeY = (elevationNorth - elevationSouth) / (sampleDistance * 2);
      const slopeAngle = Math.sqrt(slopeX * slopeX + slopeY * slopeY);

      // Realistic elevation-based terrain types
      let baseColor;
      if (elevation > 150) {
        // Mountain peaks - rocky gray-brown
        baseColor = [95, 85, 75];
      } else if (elevation > 100) {
        // High hills - exposed rock and sparse vegetation
        baseColor = [110, 100, 85];
      } else if (elevation > 50) {
        // Mid hills - mixed forest and meadow
        baseColor = [75, 95, 55];
      } else if (elevation > 20) {
        // Low hills - dense forest
        baseColor = [65, 85, 45];
      } else if (elevation > 5) {
        // Suburban areas - grass and development
        baseColor = [85, 100, 65];
      } else if (elevation > -5) {
        // Urban lowlands - mixed pavement and vegetation
        baseColor = [95, 95, 85];
      } else {
        // Water level areas - wetlands
        baseColor = [70, 80, 90];
      }

      // Add slope-based lighting (north-facing slopes darker, south-facing brighter)
      const lightDirection = [0, 1, 0.8]; // Light from south-east, slightly from above
      const slopeShading = 1 + (slopeY * lightDirection[1] + slopeX * lightDirection[0]) * 0.3;
      const shadingFactor = Math.max(0.6, Math.min(1.4, slopeShading));

      // Apply urban development overlay
      if (urbanFactor > 0.2) {
        const concreteAmount = urbanFactor * 0.7;
        const concreteColor = [115, 115, 120];
        baseColor = [
          Math.floor(baseColor[0] * (1 - concreteAmount) + concreteColor[0] * concreteAmount),
          Math.floor(baseColor[1] * (1 - concreteAmount) + concreteColor[1] * concreteAmount),
          Math.floor(baseColor[2] * (1 - concreteAmount) + concreteColor[2] * concreteAmount)
        ];
      }

      // Add realistic atmospheric perspective (distant areas more blue/hazy)
      const atmosphericDistance = Math.min(1, distanceFromCenter / 8000);
      const atmosphericBlue = 20 * atmosphericDistance;

      // Apply all effects
      const color = [
        Math.max(30, Math.min(255, Math.floor((baseColor[0] + atmosphericBlue) * shadingFactor))),
        Math.max(30, Math.min(255, Math.floor((baseColor[1] + atmosphericBlue) * shadingFactor))),
        Math.max(30, Math.min(255, Math.floor((baseColor[2] + atmosphericBlue * 1.2) * shadingFactor))),
        255
      ];

      // Create terrain patch with local coordinates
      const halfPatch = patchSize / 2;
      terrainPatches.push({
        id: `terrain-${x}-${y}`,
        polygon: [
          [centerX - halfPatch, centerY - halfPatch],
          [centerX + halfPatch, centerY - halfPatch],
          [centerX + halfPatch, centerY + halfPatch],
          [centerX - halfPatch, centerY + halfPatch]
        ],
        elevation: elevation,
        color: color
      });
    }
  }

  return new PolygonLayer({
    id: 'terrain-layer',
    data: terrainPatches,
    coordinateSystem: 2, // COORDINATE_SYSTEM.METER_OFFSETS to match buildings
    coordinateOrigin: [-74.0060, 40.7128, 0], // NYC center
    getPolygon: (d: any) => d.polygon,
    getElevation: (d: any) => d.elevation,
    getFillColor: (d: any) => d.color,
    getLineColor: [0, 0, 0, 0], // No borders for seamless terrain
    getLineWidth: 0,
    extruded: true,
    wireframe: false,
    filled: true,
    stroked: false,
    elevationScale: 1.0, // 1:1 scale to match building heights
    pickable: false,
    material: {
      ambient: 0.4,   // Reduced ambient for more dramatic shadows
      diffuse: 0.9,   // High diffuse for realistic light response
      shininess: 1,   // Very low shininess - natural terrain is not shiny
      specularColor: [40, 45, 50] // Slightly cool specular highlights
    },
    // Enhanced lighting settings for ultra realism
    lightSettings: {
      lightsPosition: [-74.0060, 40.7128, 5000, -74.0060, 40.7128, 5000], // High sun position
      ambientRatio: 0.35,   // Lower ambient ratio for better contrast
      diffuseRatio: 0.65,   // Higher diffuse for realistic lighting
      specularRatio: 0.05,  // Minimal specular for natural terrain
      numberOfLights: 2
    }
  });
}

export function createWaterLayer(riverData?: any) {
  // Use the actual generated river data if available
  if (!riverData || !riverData.path || riverData.path.length === 0) {
    // Fallback to default rivers if no river data provided
    const centerLng = -74.0060;
    const centerLat = 40.7128;

    const waterBodies = [
      {
        id: 'default-water',
        polygon: [
          [centerLng - 0.02, centerLat - 0.01],
          [centerLng + 0.02, centerLat - 0.01],
          [centerLng + 0.02, centerLat + 0.01],
          [centerLng - 0.02, centerLat + 0.01]
        ]
      }
    ];

    return new PolygonLayer({
      id: 'water-layer',
      data: waterBodies,
      getPolygon: (d: any) => d.polygon,
      getFillColor: [64, 164, 223, 180],
      getLineColor: [255, 255, 255, 0],
      getLineWidth: 0,
      extruded: false,
      wireframe: false,
      filled: true,
      stroked: false,
      pickable: false
    });
  }

  // Generate water polygons from the actual river path
  const waterBodies = [];
  const riverWidth = riverData.width || 200; // meters

  // Create water segments along the river path
  for (let i = 0; i < riverData.path.length - 1; i++) {
    const p1 = riverData.path[i];
    const p2 = riverData.path[i + 1];

    if (!p1 || !p2) continue;

    // Convert from local coordinates to lat/lng (simplified conversion)
    const centerLng = -74.0060;
    const centerLat = 40.7128;
    const metersToDegreesLng = 1 / 111320;
    const metersToDegreesLat = 1 / 110540;

    const lng1 = centerLng + (p1.x * metersToDegreesLng);
    const lat1 = centerLat + (p1.y * metersToDegreesLat);
    const lng2 = centerLng + (p2.x * metersToDegreesLng);
    const lat2 = centerLat + (p2.y * metersToDegreesLat);

    // Create water segment with width
    const dx = lng2 - lng1;
    const dy = lat2 - lat1;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length > 0) {
      const perpX = -dy / length * (riverWidth * metersToDegreesLng / 2);
      const perpY = dx / length * (riverWidth * metersToDegreesLat / 2);

      waterBodies.push({
        id: `river-segment-${i}`,
        polygon: [
          [lng1 + perpX, lat1 + perpY],
          [lng1 - perpX, lat1 - perpY],
          [lng2 - perpX, lat2 - perpY],
          [lng2 + perpX, lat2 + perpY]
        ]
      });
    }
  }

  return new PolygonLayer({
    id: 'water-layer',
    data: waterBodies,
    getPolygon: (d: any) => d.polygon,
    getElevation: () => -2, // Below ground level
    getFillColor: [30, 144, 255, 200], // Deep sky blue with transparency
    getLineColor: [0, 100, 200, 255],
    getLineWidth: 2,
    extruded: true,
    wireframe: false,
    filled: true,
    stroked: true,
    elevationScale: 1.0,
    pickable: true,
    material: {
      ambient: 0.3,
      diffuse: 0.6,
      shininess: 128,
      specularColor: [255, 255, 255]
    }
  });
}