import { ScatterplotLayer, PathLayer } from '@deck.gl/layers';

export interface WeatherData {
  id: string;
  type: 'rain' | 'snow' | 'fog' | 'cloud' | 'wind';
  position: [number, number, number];
  intensity: number;
  velocity: [number, number, number];
  size: number;
  color: [number, number, number, number];
  lifespan: number;
}

export function createWeatherLayer(weatherData: WeatherData[]) {
  return new ScatterplotLayer({
    id: 'weather-layer',
    data: weatherData,
    getPosition: (d: WeatherData) => d.position,
    getRadius: (d: WeatherData) => d.size * d.intensity,
    getFillColor: (d: WeatherData) => [
      d.color[0],
      d.color[1],
      d.color[2],
      Math.floor(d.color[3] * d.intensity * (d.lifespan / 100)),
    ],
    radiusScale: 1,
    radiusMinPixels: 1,
    radiusMaxPixels: 15,
    pickable: false,
    stroked: false,
    filled: true,
  });
}

export function generateWeatherSystem(
  centerLat: number,
  centerLng: number,
  weatherType: 'clear' | 'rain' | 'snow' | 'fog' = 'clear'
): WeatherData[] {
  const weather: WeatherData[] = [];

  if (weatherType === 'clear') {
    // Add some atmospheric particles for depth
    for (let i = 0; i < 100; i++) {
      weather.push({
        id: `dust-${i}`,
        type: 'fog',
        position: [
          centerLng + (Math.random() - 0.5) * 0.05,
          centerLat + (Math.random() - 0.5) * 0.05,
          100 + Math.random() * 500,
        ],
        intensity: 0.1,
        velocity: [(Math.random() - 0.5) * 0.0001, (Math.random() - 0.5) * 0.0001, 0],
        size: 2,
        color: [200, 200, 200, 30],
        lifespan: 100,
      });
    }
    return weather;
  }

  if (weatherType === 'rain') {
    // Generate rain drops
    for (let i = 0; i < 2000; i++) {
      weather.push({
        id: `rain-${i}`,
        type: 'rain',
        position: [
          centerLng + (Math.random() - 0.5) * 0.08,
          centerLat + (Math.random() - 0.5) * 0.08,
          200 + Math.random() * 800,
        ],
        intensity: 0.6 + Math.random() * 0.4,
        velocity: [0.0001, 0, -20], // Falling down
        size: 0.5,
        color: [100, 150, 255, 120],
        lifespan: 50 + Math.random() * 50,
      });
    }

    // Add rain clouds
    for (let i = 0; i < 20; i++) {
      weather.push({
        id: `cloud-${i}`,
        type: 'cloud',
        position: [
          centerLng + (Math.random() - 0.5) * 0.1,
          centerLat + (Math.random() - 0.5) * 0.1,
          800 + Math.random() * 400,
        ],
        intensity: 0.3 + Math.random() * 0.4,
        velocity: [(Math.random() - 0.5) * 0.001, (Math.random() - 0.5) * 0.001, 0],
        size: 50,
        color: [80, 80, 80, 100],
        lifespan: 100,
      });
    }
  }

  if (weatherType === 'snow') {
    // Generate snowflakes
    for (let i = 0; i < 1500; i++) {
      weather.push({
        id: `snow-${i}`,
        type: 'snow',
        position: [
          centerLng + (Math.random() - 0.5) * 0.08,
          centerLat + (Math.random() - 0.5) * 0.08,
          100 + Math.random() * 600,
        ],
        intensity: 0.7 + Math.random() * 0.3,
        velocity: [
          (Math.random() - 0.5) * 0.0002, // Slight horizontal drift
          (Math.random() - 0.5) * 0.0002,
          -5 - Math.random() * 10, // Slower fall than rain
        ],
        size: 1 + Math.random() * 2,
        color: [255, 255, 255, 180],
        lifespan: 80 + Math.random() * 40,
      });
    }
  }

  if (weatherType === 'fog') {
    // Generate fog particles
    for (let i = 0; i < 500; i++) {
      weather.push({
        id: `fog-${i}`,
        type: 'fog',
        position: [
          centerLng + (Math.random() - 0.5) * 0.06,
          centerLat + (Math.random() - 0.5) * 0.06,
          10 + Math.random() * 200, // Low altitude fog
        ],
        intensity: 0.2 + Math.random() * 0.4,
        velocity: [(Math.random() - 0.5) * 0.0003, (Math.random() - 0.5) * 0.0003, 0],
        size: 10 + Math.random() * 20,
        color: [220, 220, 220, 80],
        lifespan: 100,
      });
    }
  }

  return weather;
}

export function createWindLayer(centerLat: number, centerLng: number): PathLayer {
  // Generate wind flow visualization
  const windVectors = [];
  const gridSize = 20;
  const spacing = 0.004;

  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      const startLng = centerLng - (gridSize * spacing) / 2 + x * spacing;
      const startLat = centerLat - (gridSize * spacing) / 2 + y * spacing;

      // Generate wind direction (simplified model)
      const windAngle = Math.sin(x * 0.3) * Math.cos(y * 0.3) + Math.random() * 0.5;
      const windSpeed = 0.001 + Math.random() * 0.002;

      const endLng = startLng + Math.cos(windAngle) * windSpeed;
      const endLat = startLat + Math.sin(windAngle) * windSpeed;

      windVectors.push({
        id: `wind-${x}-${y}`,
        path: [
          [startLng, startLat, 50],
          [endLng, endLat, 50],
        ],
        intensity: Math.random(),
      });
    }
  }

  return new PathLayer({
    id: 'wind-vectors',
    data: windVectors,
    getPath: (d: any) => d.path,
    getColor: (d: any) => [100, 200, 255, Math.floor(100 * d.intensity)],
    getWidth: 2,
    widthScale: 1,
    pickable: false,
  });
}
