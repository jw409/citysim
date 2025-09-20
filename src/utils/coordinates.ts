// Convert local city coordinates to lat/lng for deck.gl
// This is a simplified conversion - in reality you'd use proper map projections

const CITY_CENTER_LAT = 40.7128; // NYC latitude as default
const CITY_CENTER_LNG = -74.0060; // NYC longitude as default
const METERS_PER_DEGREE_LAT = 111000; // Approximate
const METERS_PER_DEGREE_LNG = 85000; // Approximate at NYC latitude

export function localToLatLng(x: number, y: number): [number, number] {
  // Convert meters to degrees
  const lat = CITY_CENTER_LAT + (y / METERS_PER_DEGREE_LAT);
  const lng = CITY_CENTER_LNG + (x / METERS_PER_DEGREE_LNG);

  // 💡 GEMINI'S FIX: Validate coordinates and log details
  if (isNaN(lng) || isNaN(lat) || !isFinite(lng) || !isFinite(lat)) {
    console.error("❌ Generated invalid coordinates for point:", {
      input: { x, y },
      output: { lng, lat },
      constants: { CITY_CENTER_LAT, CITY_CENTER_LNG, METERS_PER_DEGREE_LAT, METERS_PER_DEGREE_LNG }
    });
    return [-74.0060, 40.7128]; // Return NYC center as default
  }

  // Log first few conversions for debugging
  if (Math.random() < 0.01) { // 1% sampling
    console.log('📍 Coordinate conversion sample:', {
      local: { x, y },
      latLng: { lat, lng },
      distance_from_center: Math.sqrt(x*x + y*y)
    });
  }

  return [lng, lat]; // deck.gl expects [longitude, latitude]
}

export function convertPointsToLatLng(points: Array<{x: number, y: number}>): Array<[number, number]> {
  return points.map(p => localToLatLng(p.x, p.y));
}

export function getBoundsFromCityModel(cityModel: any): {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
} {
  console.log('Raw city model bounds:', cityModel.bounds);

  let min_x: number, min_y: number, max_x: number, max_y: number;

  if (!cityModel.bounds) {
    console.log('No bounds found in city model, calculating from zones/buildings...');

    // Calculate bounds from zones and buildings if bounds are missing
    const allPoints: {x: number, y: number}[] = [];

    // Add points from zones
    if (cityModel.zones) {
      cityModel.zones.forEach((zone: any) => {
        if (zone.boundary) {
          allPoints.push(...zone.boundary);
        }
      });
    }

    // Add points from buildings
    if (cityModel.buildings) {
      cityModel.buildings.forEach((building: any) => {
        if (building.footprint) {
          allPoints.push(...building.footprint);
        }
      });
    }

    if (allPoints.length === 0) {
      console.log('No coordinate data found, using default view');
      return {
        longitude: CITY_CENTER_LNG,
        latitude: CITY_CENTER_LAT,
        zoom: 12,
        pitch: 45,
        bearing: 0
      };
    }

    // Calculate bounds from all points
    const calculatedBounds = {
      min_x: Math.min(...allPoints.map(p => p.x)),
      min_y: Math.min(...allPoints.map(p => p.y)),
      max_x: Math.max(...allPoints.map(p => p.x)),
      max_y: Math.max(...allPoints.map(p => p.y))
    };

    console.log('Calculated bounds from geometry:', calculatedBounds);
    ({ min_x, min_y, max_x, max_y } = calculatedBounds);
  } else {
    ({ min_x, min_y, max_x, max_y } = cityModel.bounds);
  }

  // Get center point
  const centerX = (min_x + max_x) / 2;
  const centerY = (min_y + max_y) / 2;
  const [centerLng, centerLat] = localToLatLng(centerX, centerY);

  // Calculate appropriate zoom level based on city size
  const width = max_x - min_x;
  const height = max_y - min_y;
  const maxDimension = Math.max(width, height);

  console.log(`City bounds: ${width}x${height}, max dimension: ${maxDimension}`);

  // More aggressive zoom calculation to see the city
  let zoom = 17;
  if (maxDimension > 10000) zoom = 11;
  else if (maxDimension > 5000) zoom = 13;
  else if (maxDimension > 2000) zoom = 15;
  else if (maxDimension > 1000) zoom = 16;

  console.log(`Setting view to: lng=${centerLng}, lat=${centerLat}, zoom=${zoom}`);

  return {
    longitude: centerLng,
    latitude: centerLat,
    zoom,
    pitch: 45,
    bearing: 0
  };
}