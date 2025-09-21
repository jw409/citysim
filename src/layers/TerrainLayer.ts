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

export function createWaterLayer() {
  // Add water bodies around the city
  const centerLng = -74.0060;
  const centerLat = 40.7128;

  const waterBodies = [
    {
      id: 'hudson-river',
      polygon: [
        [centerLng - 0.03, centerLat - 0.02],
        [centerLng - 0.025, centerLat - 0.02],
        [centerLng - 0.025, centerLat + 0.03],
        [centerLng - 0.03, centerLat + 0.03]
      ]
    },
    {
      id: 'east-river',
      polygon: [
        [centerLng + 0.025, centerLat - 0.015],
        [centerLng + 0.03, centerLat - 0.015],
        [centerLng + 0.03, centerLat + 0.025],
        [centerLng + 0.025, centerLat + 0.025]
      ]
    }
  ];

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