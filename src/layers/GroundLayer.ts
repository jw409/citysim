import { PolygonLayer } from '@deck.gl/layers';

export function createGroundLayer() {
  // Create a simple ground plane with texture-like pattern
  const centerLng = -74.0060;
  const centerLat = 40.7128;
  const groundSize = 0.2; // degrees (covers large area)

  // Create ground tiles with texture-like variation
  const groundTiles = [];
  const tileSize = 0.01; // Size of each ground tile
  const tilesPerSide = Math.ceil(groundSize / tileSize);

  for (let x = 0; x < tilesPerSide; x++) {
    for (let y = 0; y < tilesPerSide; y++) {
      const offsetX = (x - tilesPerSide / 2) * tileSize;
      const offsetY = (y - tilesPerSide / 2) * tileSize;

      // Create color variation for texture effect
      const baseGray = 120;
      const variation = ((x + y) % 3) * 10; // Checkerboard-like pattern
      const noiseVariation = Math.sin(x * 0.5) * Math.cos(y * 0.5) * 15;

      const color = [
        Math.max(80, Math.min(160, baseGray + variation + noiseVariation)),
        Math.max(80, Math.min(160, baseGray + variation + noiseVariation)),
        Math.max(80, Math.min(160, baseGray + variation + noiseVariation)),
        255
      ];

      // Create ground tile
      groundTiles.push({
        id: `ground-${x}-${y}`,
        polygon: [
          [centerLng + offsetX, centerLat + offsetY],
          [centerLng + offsetX + tileSize, centerLat + offsetY],
          [centerLng + offsetX + tileSize, centerLat + offsetY + tileSize],
          [centerLng + offsetX, centerLat + offsetY + tileSize]
        ],
        elevation: -1, // Slightly below ground level
        color: color
      });
    }
  }

  return new PolygonLayer({
    id: 'ground',
    data: groundTiles,
    getPolygon: (d: any) => d.polygon,
    getElevation: (d: any) => d.elevation,
    getFillColor: (d: any) => d.color,
    getLineColor: [0, 0, 0, 0], // No outlines
    getLineWidth: 0,
    extruded: false,
    wireframe: false,
    filled: true,
    stroked: false,
    pickable: false,
    material: {
      ambient: 0.6,
      diffuse: 0.4,
      shininess: 2,
      specularColor: [20, 20, 20]
    }
  });
}