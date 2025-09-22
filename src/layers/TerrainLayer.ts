import { PolygonLayer } from '@deck.gl/layers';

export function createTerrainLayer() {
  // Create a large ground plane with realistic terrain
  const terrainSize = 0.1; // degrees (covers large area)
  const centerLng = -74.0060;
  const centerLat = 40.7128;

  // Generate terrain patches with elevation variation
  const terrainPatches = [];
  const patchSize = 0.005; // Size of each terrain patch
  const patchesPerSide = Math.ceil(terrainSize / patchSize);

  for (let x = 0; x < patchesPerSide; x++) {
    for (let y = 0; y < patchesPerSide; y++) {
      const offsetX = (x - patchesPerSide / 2) * patchSize;
      const offsetY = (y - patchesPerSide / 2) * patchSize;

      // Create elevation variation using noise
      const distanceFromCenter = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
      const baseElevation = Math.max(0, 20 - distanceFromCenter * 1000); // Lower near edges
      const noiseElevation = (Math.random() - 0.5) * 10; // ±5m variation
      const elevation = baseElevation + noiseElevation;

      // Color based on elevation and distance from city center
      let color;
      if (elevation > 15) {
        color = [139, 69, 19, 255]; // Brown (higher ground)
      } else if (elevation > 10) {
        color = [34, 139, 34, 255]; // Forest green (parks)
      } else if (elevation > 5) {
        color = [154, 205, 50, 255]; // Yellow green (grass)
      } else {
        color = [105, 105, 105, 255]; // Gray (urban ground)
      }

      // Create terrain patch
      terrainPatches.push({
        id: `terrain-${x}-${y}`,
        polygon: [
          [centerLng + offsetX, centerLat + offsetY],
          [centerLng + offsetX + patchSize, centerLat + offsetY],
          [centerLng + offsetX + patchSize, centerLat + offsetY + patchSize],
          [centerLng + offsetX, centerLat + offsetY + patchSize]
        ],
        elevation: elevation,
        color: color
      });
    }
  }

  return new PolygonLayer({
    id: 'terrain-layer',
    data: terrainPatches,
    getPolygon: (d: any) => d.polygon,
    getElevation: (d: any) => d.elevation,
    getFillColor: (d: any) => d.color,
    getLineColor: [120, 120, 120, 100],
    getLineWidth: 1,
    extruded: true,
    wireframe: false,
    filled: true,
    stroked: false,
    elevationScale: 3.0,
    pickable: false,
    material: {
      ambient: 0.4,
      diffuse: 0.8,
      shininess: 4,
      specularColor: [100, 100, 100]
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