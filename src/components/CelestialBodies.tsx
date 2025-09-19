import { useMemo } from 'react';
import { ScatterplotLayer } from '@deck.gl/layers';
import { localToLatLng } from '../utils/coordinates';

interface CelestialBodiesProps {
  bounds: any;
  timeOfDay: number; // 0-24 hours
  scale: number;
  showMoon: boolean;
  showSun: boolean;
}

// Celestial constants (commented out unused)
// const SUN_DISTANCE = 150000000; // 150M km from Earth
// const MOON_DISTANCE = 384400; // 384K km from Earth
// const SUN_SIZE_KM = 1392700; // Sun diameter
// const MOON_SIZE_KM = 3474; // Moon diameter

// Calculate celestial body position based on time
function getCelestialPosition(timeOfDay: number, bounds: any, isEarth: boolean = false) {
  const { min_x, min_y, max_x, max_y } = bounds;
  const centerX = (min_x + max_x) / 2;
  const centerY = (min_y + max_y) / 2;
  const viewRadius = Math.max(max_x - min_x, max_y - min_y) * 2;

  if (isEarth) {
    // For planetary view, position sun relative to Earth's rotation
    const sunAngle = ((timeOfDay - 6) / 24) * 2 * Math.PI; // 6 AM = sunrise
    const sunX = centerX + Math.cos(sunAngle) * viewRadius * 3;
    const sunY = centerY + Math.sin(sunAngle) * viewRadius * 0.8;
    const sunZ = Math.abs(Math.sin(sunAngle)) * viewRadius * 0.5;

    return { x: sunX, y: sunY, z: Math.max(sunZ, viewRadius * 0.1) };
  } else {
    // For local views, sun moves in a realistic arc
    const sunAngle = ((timeOfDay - 6) / 12) * Math.PI; // Daytime arc
    const sunElevation = Math.max(0, Math.sin(sunAngle)) * viewRadius * 0.8;
    const sunAzimuth = ((timeOfDay - 6) / 12) * Math.PI - Math.PI / 2;

    const sunX = centerX + Math.cos(sunAzimuth) * viewRadius;
    const sunY = centerY + Math.sin(sunAzimuth) * viewRadius * 0.3;

    return { x: sunX, y: sunY, z: sunElevation + viewRadius * 0.2 };
  }
}

function getMoonPosition(timeOfDay: number, bounds: any, _moonPhase: number = 0) {
  const { min_x, min_y, max_x, max_y } = bounds;
  const centerX = (min_x + max_x) / 2;
  const centerY = (min_y + max_y) / 2;
  const viewRadius = Math.max(max_x - min_x, max_y - min_y) * 2;

  // Moon has ~12.5 hour offset from sun and moves in opposite direction
  const moonAngle = ((timeOfDay + 12) / 24) * 2 * Math.PI;
  const moonElevation = Math.max(0, Math.sin(moonAngle)) * viewRadius * 0.6;
  const moonAzimuth = moonAngle - Math.PI / 2;

  const moonX = centerX + Math.cos(moonAzimuth) * viewRadius * 1.2;
  const moonY = centerY + Math.sin(moonAzimuth) * viewRadius * 0.4;

  return { x: moonX, y: moonY, z: moonElevation + viewRadius * 0.15 };
}

// Calculate sun color based on time of day and atmospheric perspective
function getSunColor(timeOfDay: number, scale: number): number[] {
  const sunAngle = ((timeOfDay - 6) / 12) * Math.PI;
  const elevation = Math.sin(sunAngle);

  if (elevation <= 0) {
    return [255, 100, 0, 0]; // Hidden sun (transparent)
  }

  // Atmospheric coloring - red/orange near horizon, yellow/white at zenith
  let color: number[];
  if (elevation < 0.2) {
    // Near horizon - deep orange/red
    const intensity = elevation / 0.2;
    color = [
      255,
      Math.round(69 + intensity * 186), // 69 to 255
      Math.round(0 + intensity * 100), // 0 to 100
      Math.round(150 + intensity * 105), // 150 to 255 alpha
    ];
  } else if (elevation < 0.5) {
    // Low in sky - orange to yellow
    const intensity = (elevation - 0.2) / 0.3;
    color = [
      255,
      Math.round(165 + intensity * 90), // 165 to 255
      Math.round(0 + intensity * 200), // 0 to 200
      255,
    ];
  } else {
    // High in sky - yellow to white
    const intensity = (elevation - 0.5) / 0.5;
    color = [
      255,
      255,
      Math.round(200 + intensity * 55), // 200 to 255
      255,
    ];
  }

  // For planetary scale, make sun smaller but brighter
  if (scale > 1000) {
    color[3] = Math.min(255, color[3] * 1.5);
  }

  return color;
}

// Calculate moon color and brightness based on phase and time
function getMoonColor(timeOfDay: number, moonPhase: number = 0): number[] {
  const moonAngle = ((timeOfDay + 12) / 24) * 2 * Math.PI;
  const moonElevation = Math.sin(moonAngle);

  if (moonElevation <= 0) {
    return [200, 200, 255, 0]; // Hidden moon
  }

  // Moon phase affects brightness (0 = new moon, 1 = full moon)
  const phaseBrightness = 0.3 + moonPhase * 0.7;
  const elevationBrightness = Math.max(0.1, moonElevation);
  const totalBrightness = phaseBrightness * elevationBrightness;

  // Moon has a bluish-white color
  return [
    Math.round(220 * totalBrightness),
    Math.round(220 * totalBrightness),
    Math.round(255 * totalBrightness),
    Math.round(180 * totalBrightness),
  ];
}

// Generate stars for nighttime sky
function generateStars(bounds: any, timeOfDay: number, count: number = 200) {
  const isDarkEnough = timeOfDay < 5 || timeOfDay > 20;
  if (!isDarkEnough) return [];

  const { min_x, min_y, max_x, max_y } = bounds;
  const centerX = (min_x + max_x) / 2;
  const centerY = (min_y + max_y) / 2;
  const viewRadius = Math.max(max_x - min_x, max_y - min_y) * 3;

  const stars = [];
  const seed = 12345; // Fixed seed for consistent star positions
  let rng = seed;

  for (let i = 0; i < count; i++) {
    rng = (rng * 9301 + 49297) % 233280;
    const random1 = rng / 233280;
    rng = (rng * 9301 + 49297) % 233280;
    const random2 = rng / 233280;
    rng = (rng * 9301 + 49297) % 233280;
    const random3 = rng / 233280;

    const angle = random1 * 2 * Math.PI;
    const distance = viewRadius * (0.5 + random2 * 0.5);

    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;
    const z = viewRadius * (0.3 + random3 * 0.4);

    const brightness = Math.random() * 0.8 + 0.2;
    const starColor = [
      Math.round(255 * brightness),
      Math.round(255 * brightness * (0.8 + random3 * 0.2)),
      Math.round(255 * brightness),
      Math.round(120 * brightness),
    ];

    stars.push({
      x,
      y,
      z,
      color: starColor,
      size: 1 + random3 * 2,
    });
  }

  return stars;
}

export function CelestialBodies({
  bounds,
  timeOfDay,
  scale,
  showMoon,
  showSun,
}: CelestialBodiesProps) {
  const celestialLayers = useMemo(() => {
    const layers: any[] = [];

    // Calculate current moon phase (simplified - full moon every 29.5 days)
    const dayOfYear = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % 365;
    const moonPhase = Math.abs(Math.sin((dayOfYear / 29.5) * Math.PI));

    // Add stars for nighttime
    const stars = generateStars(bounds, timeOfDay, scale > 100 ? 500 : 200);
    if (stars.length > 0) {
      layers.push(
        new ScatterplotLayer({
          id: 'stars',
          data: stars,
          getPosition: (d: any) => {
            const [lng, lat] = localToLatLng(d.x, d.y);
            return [lng, lat, d.z];
          },
          getRadius: (d: any) => d.size,
          getFillColor: (d: any) => d.color,
          pickable: false,
          radiusUnits: 'pixels',
          radiusMinPixels: 1,
          radiusMaxPixels: 3,
        })
      );
    }

    // Add sun
    if (showSun) {
      const sunPos = getCelestialPosition(timeOfDay, bounds, scale > 5000);
      const sunColor = getSunColor(timeOfDay, scale);

      if (sunColor[3] > 0) {
        // Only show if visible
        const sunSize = scale > 1000 ? 30 : scale > 100 ? 50 : 80;

        layers.push(
          new ScatterplotLayer({
            id: 'sun',
            data: [
              {
                x: sunPos.x,
                y: sunPos.y,
                z: sunPos.z,
                color: sunColor,
                size: sunSize,
              },
            ],
            getPosition: (d: any) => {
              const [lng, lat] = localToLatLng(d.x, d.y);
              return [lng, lat, d.z];
            },
            getRadius: (d: any) => d.size,
            getFillColor: (d: any) => d.color,
            pickable: false,
            radiusUnits: 'pixels',
            radiusMinPixels: 20,
            radiusMaxPixels: 100,
            // Add glow effect
            material: {
              ambient: 1.0,
              diffuse: 0.0,
              shininess: 0,
              specularColor: [255, 255, 255],
            },
          })
        );

        // Add sun corona/glow effect for larger scales
        if (scale > 100) {
          layers.push(
            new ScatterplotLayer({
              id: 'sun_glow',
              data: [
                {
                  x: sunPos.x,
                  y: sunPos.y,
                  z: sunPos.z - 100,
                  color: [sunColor[0], sunColor[1], sunColor[2], Math.round(sunColor[3] * 0.3)],
                  size: sunSize * 3,
                },
              ],
              getPosition: (d: any) => {
                const [lng, lat] = localToLatLng(d.x, d.y);
                return [lng, lat, d.z];
              },
              getRadius: (d: any) => d.size,
              getFillColor: (d: any) => d.color,
              pickable: false,
              radiusUnits: 'pixels',
              radiusMinPixels: 40,
              radiusMaxPixels: 200,
            })
          );
        }
      }
    }

    // Add moon
    if (showMoon) {
      const moonPos = getMoonPosition(timeOfDay, bounds, moonPhase);
      const moonColor = getMoonColor(timeOfDay, moonPhase);

      if (moonColor[3] > 0) {
        // Only show if visible
        const moonSize = scale > 1000 ? 8 : scale > 100 ? 15 : 25;

        layers.push(
          new ScatterplotLayer({
            id: 'moon',
            data: [
              {
                x: moonPos.x,
                y: moonPos.y,
                z: moonPos.z,
                color: moonColor,
                size: moonSize,
              },
            ],
            getPosition: (d: any) => {
              const [lng, lat] = localToLatLng(d.x, d.y);
              return [lng, lat, d.z];
            },
            getRadius: (d: any) => d.size,
            getFillColor: (d: any) => d.color,
            pickable: false,
            radiusUnits: 'pixels',
            radiusMinPixels: 5,
            radiusMaxPixels: 40,
            material: {
              ambient: 0.8,
              diffuse: 0.2,
              shininess: 16,
              specularColor: [200, 200, 255],
            },
          })
        );
      }
    }

    return layers;
  }, [bounds, timeOfDay, scale, showMoon, showSun]);

  return <>{celestialLayers}</>;
}
