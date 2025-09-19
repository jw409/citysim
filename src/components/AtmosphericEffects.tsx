import { useMemo } from 'react';
import { ScatterplotLayer, PathLayer } from '@deck.gl/layers';
import { localToLatLng } from '../utils/coordinates';

interface AtmosphericEffectsProps {
  bounds: any;
  timeOfDay: number; // 0-24 hours
  scale: number;
  sunPosition: { x: number; y: number; z: number };
  showAtmosphere: boolean;
  showClouds: boolean;
  weatherIntensity: number; // 0-1
}

// Atmospheric scattering constants (commented out unused)
// const RAYLEIGH_SCALE = 8000; // meters
// const MIE_SCALE = 1200; // meters
// const EARTH_RADIUS = 6371000; // meters

// Generate atmospheric scattering effect
function generateAtmosphericScattering(bounds: any, timeOfDay: number, scale: number, sunPos: any) {
  if (scale < 50) return []; // Only show for larger scales

  const { min_x, min_y, max_x, max_y } = bounds;
  const centerX = (min_x + max_x) / 2;
  const centerY = (min_y + max_y) / 2;
  const viewRadius = Math.max(max_x - min_x, max_y - min_y);

  const scatteringPoints = [];
  const numPoints = Math.min(2000, scale * 10);

  // Calculate sun angle for atmospheric coloring
  const sunAngle = Math.atan2(sunPos.y - centerY, sunPos.x - centerX);
  const sunElevation = Math.max(0, sunPos.z / viewRadius);

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    const distance = viewRadius * (0.8 + Math.random() * 0.4);
    const height = Math.random() * viewRadius * 0.3;

    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;

    // Calculate distance from sun direction
    const pointAngle = Math.atan2(y - centerY, x - centerX);
    const angleDiff = Math.abs(pointAngle - sunAngle);
    const sunProximity = Math.max(0, 1 - angleDiff / Math.PI);

    // Atmospheric scattering colors
    let color: number[];

    if ((timeOfDay >= 5.5 && timeOfDay <= 6.5) || (timeOfDay >= 17.5 && timeOfDay <= 18.5)) {
      // Sunrise/sunset - strong Rayleigh scattering
      const intensity = sunProximity * sunElevation;
      color = [
        Math.round(255 * intensity + 135 * (1 - intensity)),
        Math.round(165 * intensity + 180 * (1 - intensity)),
        Math.round(0 * intensity + 235 * (1 - intensity)),
        Math.round(80 * intensity + 20 * (1 - intensity)),
      ];
    } else if (timeOfDay >= 6 && timeOfDay <= 18) {
      // Daytime - blue sky with Rayleigh scattering
      const blueIntensity = 0.7 + sunElevation * 0.3;
      color = [
        Math.round(135 * blueIntensity),
        Math.round(206 * blueIntensity),
        Math.round(235 * blueIntensity),
        Math.round(40 * blueIntensity),
      ];
    } else {
      // Nighttime - minimal atmosphere visibility
      color = [25, 25, 50, 10];
    }

    scatteringPoints.push({
      x,
      y,
      z: height,
      color,
      size: 15 + Math.random() * 10,
    });
  }

  return scatteringPoints;
}

// Generate cloud layers
function generateClouds(bounds: any, timeOfDay: number, scale: number, weatherIntensity: number) {
  if (!weatherIntensity || weatherIntensity === 0) return [];

  const { min_x, min_y, max_x, max_y } = bounds;
  const clouds = [];

  // Cloud density based on weather intensity
  const numClouds = Math.round(weatherIntensity * 50 * Math.min(scale / 10, 10));
  const isDaytime = timeOfDay >= 6 && timeOfDay <= 18;

  for (let i = 0; i < numClouds; i++) {
    const x = min_x + Math.random() * (max_x - min_x);
    const y = min_y + Math.random() * (max_y - min_y);
    const z = 1000 + Math.random() * 5000; // Cloud altitude 1-6km

    // Cloud size varies with scale
    const size = (20 + Math.random() * 60) * Math.min(scale / 5, 20);

    // Cloud color based on time and weather
    let cloudColor: number[];
    if ((timeOfDay >= 5.5 && timeOfDay <= 6.5) || (timeOfDay >= 17.5 && timeOfDay <= 18.5)) {
      // Sunrise/sunset clouds - golden/orange tint
      cloudColor = [
        Math.round(255 * (0.8 + weatherIntensity * 0.2)),
        Math.round(200 * (0.8 + weatherIntensity * 0.2)),
        Math.round(150 * (0.6 + weatherIntensity * 0.4)),
        Math.round(120 * weatherIntensity),
      ];
    } else if (isDaytime) {
      // Daytime clouds - white/gray
      const brightness = 1 - weatherIntensity * 0.4; // Darker with more weather
      cloudColor = [
        Math.round(255 * brightness),
        Math.round(255 * brightness),
        Math.round(255 * brightness),
        Math.round(180 * weatherIntensity),
      ];
    } else {
      // Nighttime clouds - dark gray
      cloudColor = [
        Math.round(80 * (1 - weatherIntensity * 0.5)),
        Math.round(80 * (1 - weatherIntensity * 0.5)),
        Math.round(90 * (1 - weatherIntensity * 0.5)),
        Math.round(100 * weatherIntensity),
      ];
    }

    clouds.push({
      x,
      y,
      z,
      color: cloudColor,
      size,
    });
  }

  return clouds;
}

// Generate volumetric lighting rays (god rays) during sunrise/sunset
function generateVolumetricLighting(bounds: any, timeOfDay: number, sunPos: any, scale: number) {
  const isSunriseOrSunset =
    (timeOfDay >= 5.5 && timeOfDay <= 7) || (timeOfDay >= 17 && timeOfDay <= 18.5);
  if (!isSunriseOrSunset || scale < 10) return [];

  const { min_x, min_y, max_x, max_y } = bounds;
  const centerX = (min_x + max_x) / 2;
  const centerY = (min_y + max_y) / 2;

  const rays = [];
  const numRays = 20;
  const rayLength = Math.max(max_x - min_x, max_y - min_y) * 2;

  for (let i = 0; i < numRays; i++) {
    const angle = ((i / numRays) * Math.PI) / 3 - Math.PI / 6; // 60-degree spread
    const sunDirection = Math.atan2(sunPos.y - centerY, sunPos.x - centerX);
    const rayAngle = sunDirection + angle;

    const startX = centerX + Math.cos(rayAngle) * rayLength * 0.3;
    const startY = centerY + Math.sin(rayAngle) * rayLength * 0.3;
    const endX = centerX + Math.cos(rayAngle) * rayLength;
    const endY = centerY + Math.sin(rayAngle) * rayLength;

    // Ray intensity based on sun elevation and position
    const sunElevation = Math.max(0, sunPos.z / rayLength);
    const rayIntensity = sunElevation * 0.3;

    if (rayIntensity > 0.05) {
      rays.push({
        path: [
          { x: startX, y: startY, z: 100 },
          { x: endX, y: endY, z: 2000 },
        ],
        color: [
          Math.round(255 * rayIntensity),
          Math.round(220 * rayIntensity),
          Math.round(150 * rayIntensity),
          Math.round(60 * rayIntensity),
        ],
        width: 50 + Math.random() * 100,
      });
    }
  }

  return rays;
}

// Calculate atmospheric perspective effect for distant objects
function calculateAtmosphericPerspective(
  distance: number,
  scale: number,
  timeOfDay: number
): number[] {
  if (scale < 100) return [1, 1, 1, 0]; // No effect at city scale

  const maxDistance = scale * 1000; // Maximum visible distance
  const normalizedDistance = Math.min(1, distance / maxDistance);

  // Atmospheric haze color varies with time of day
  let hazeColor: number[];
  if ((timeOfDay >= 5.5 && timeOfDay <= 7) || (timeOfDay >= 17 && timeOfDay <= 18.5)) {
    hazeColor = [0.8, 0.7, 0.5]; // Warm haze during sunrise/sunset
  } else if (timeOfDay >= 6 && timeOfDay <= 18) {
    hazeColor = [0.7, 0.8, 0.9]; // Cool blue haze during day
  } else {
    hazeColor = [0.3, 0.3, 0.4]; // Dark haze at night
  }

  const hazeStrength = normalizedDistance * 0.6;

  return [
    1 - hazeStrength + hazeStrength * hazeColor[0],
    1 - hazeStrength + hazeStrength * hazeColor[1],
    1 - hazeStrength + hazeStrength * hazeColor[2],
    hazeStrength,
  ];
}

export function AtmosphericEffects({
  bounds,
  timeOfDay,
  scale,
  sunPosition,
  showAtmosphere,
  showClouds,
  weatherIntensity,
}: AtmosphericEffectsProps) {
  const atmosphericLayers = useMemo(() => {
    const layers: any[] = [];

    // Add atmospheric scattering
    if (showAtmosphere && scale > 20) {
      const scattering = generateAtmosphericScattering(bounds, timeOfDay, scale, sunPosition);

      if (scattering.length > 0) {
        layers.push(
          new ScatterplotLayer({
            id: 'atmospheric_scattering',
            data: scattering,
            getPosition: (d: any) => {
              const [lng, lat] = localToLatLng(d.x, d.y);
              return [lng, lat, d.z];
            },
            getRadius: (d: any) => d.size,
            getFillColor: (d: any) => d.color,
            pickable: false,
            radiusUnits: 'pixels',
            radiusMinPixels: 8,
            radiusMaxPixels: 30,
            parameters: {
              depthTest: false, // Always render atmosphere
            },
          })
        );
      }
    }

    // Add clouds
    if (showClouds && weatherIntensity > 0) {
      const clouds = generateClouds(bounds, timeOfDay, scale, weatherIntensity);

      if (clouds.length > 0) {
        layers.push(
          new ScatterplotLayer({
            id: 'clouds',
            data: clouds,
            getPosition: (d: any) => {
              const [lng, lat] = localToLatLng(d.x, d.y);
              return [lng, lat, d.z];
            },
            getRadius: (d: any) => d.size,
            getFillColor: (d: any) => d.color,
            pickable: false,
            radiusUnits: 'meters',
            radiusMinPixels: 20,
            radiusMaxPixels: 200,
            material: {
              ambient: 0.9,
              diffuse: 0.1,
              shininess: 4,
              specularColor: [255, 255, 255],
            },
          })
        );
      }
    }

    // Add volumetric lighting (god rays)
    if (showAtmosphere && scale >= 5) {
      const rays = generateVolumetricLighting(bounds, timeOfDay, sunPosition, scale);

      if (rays.length > 0) {
        layers.push(
          new PathLayer({
            id: 'volumetric_lighting',
            data: rays,
            getPath: (d: any) =>
              d.path.map((p: any) => {
                const [lng, lat] = localToLatLng(p.x, p.y);
                return [lng, lat, p.z];
              }),
            getColor: (d: any) => d.color,
            getWidth: (d: any) => d.width,
            widthUnits: 'meters',
            widthMinPixels: 2,
            widthMaxPixels: 20,
            pickable: false,
            parameters: {
              blend: true,
              blendFunc: ['SRC_ALPHA', 'ONE'], // Additive blending for light rays
            },
          })
        );
      }
    }

    return layers;
  }, [bounds, timeOfDay, scale, sunPosition, showAtmosphere, showClouds, weatherIntensity]);

  return <>{atmosphericLayers}</>;
}

// Export utility function for atmospheric perspective
export { calculateAtmosphericPerspective };
