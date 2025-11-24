import { PolygonLayer } from '@deck.gl/layers';
import { LAYER_DEFINITIONS } from '../../types/layers';
// convertPointsToLatLng no longer needed - coordinates already converted by convertAllCoordinates

export function createUndergroundParkingLayer(parkingData: any[]) {
  const layerConfig = LAYER_DEFINITIONS.underground_parking;

  return new PolygonLayer({
    id: 'underground_parking',
    data: parkingData,
    getPolygon: (d: any) => {
      const polygon = d.footprint || d.polygon;
      if (!polygon || !Array.isArray(polygon)) return [];
      // Polygon coordinates already converted by convertAllCoordinates
      return polygon;
    },
    getElevation: (d: any) => Math.abs(d.depth || 3), // Height of parking level
    getPosition: (d: any) => [d.lng || 0, d.lat || 0, d.elevation || -8],
    getFillColor: (d: any) => {
      // Color by occupancy
      const occupancy = (d.occupied_spots || 0) / (d.total_spots || 1);
      if (occupancy > 0.9) return [255, 0, 0, 180]; // Red for full
      if (occupancy > 0.7) return [255, 165, 0, 180]; // Orange for busy
      if (occupancy > 0.3) return [255, 255, 0, 180]; // Yellow for moderate
      return layerConfig.color; // Gray for available
    },
    getLineColor: [0, 0, 0, 100],
    getLineWidth: 1,
    extruded: true,
    wireframe: false,
    filled: true,
    stroked: true,
    pickable: true,
    opacity: layerConfig.opacity,
    material: {
      ambient: 0.2,
      diffuse: 0.6,
      shininess: 16,
      specularColor: [150, 150, 150],
    },
    transitions: {
      getFillColor: 600,
      getElevation: 400,
    },
  });
}

export function generateUndergroundParking(buildings: any[], density: number = 0.3): any[] {
  const parking: any[] = [];

  buildings.forEach((building, index) => {
    // Only some buildings have underground parking
    if (Math.random() < density) {
      const footprint = building.footprint || [];
      if (footprint.length === 0) return;

      // Calculate parking levels based on building size
      const buildingArea = calculatePolygonArea(footprint);
      const levels = Math.min(3, Math.floor(buildingArea / 1000) + 1);

      for (let level = 1; level <= levels; level++) {
        const spotsPerLevel = Math.floor(buildingArea / 25); // ~25 sq units per spot
        const occupiedSpots = Math.floor(Math.random() * spotsPerLevel);

        parking.push({
          id: `parking_${building.id || index}_level_${level}`,
          building_id: building.id || index,
          footprint: footprint,
          elevation: -3 * level,
          depth: 3,
          level: level,
          total_spots: spotsPerLevel,
          occupied_spots: occupiedSpots,
          hourly_rate: 2 + Math.random() * 3,
          access_type: level === 1 ? 'ramp' : 'elevator',
          security_level: Math.random() > 0.5 ? 'secured' : 'public',
        });
      }
    }
  });

  return parking;
}

function calculatePolygonArea(polygon: any[]): number {
  if (polygon.length < 3) return 0;

  let area = 0;
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    area += polygon[i].x * polygon[j].y;
    area -= polygon[j].x * polygon[i].y;
  }
  return Math.abs(area) / 2;
}
