/**
 * Dynamic Lighting System for Enhanced Urban Aesthetics
 */

export interface LightingConfig {
  ambientRatio: number;
  diffuseRatio: number;
  specularRatio: number;
  lightsPosition: number[];
  lightsStrength: number[];
  numberOfLights: number;
  sunColor: [number, number, number];
  skyColor: [number, number, number];
}

export function getDynamicLighting(timeOfDay: number = 12): LightingConfig {
  // Normalize time to 0-24 hours
  const hour = ((timeOfDay % 24) + 24) % 24;

  // Calculate sun position based on time
  const sunAngle = (hour - 6) * 15; // Degrees from horizon (6am = 0°, 12pm = 90°, 6pm = 180°)
  const sunHeight = Math.sin((sunAngle * Math.PI) / 180) * 10000; // Height above ground
  const sunDistance = Math.cos((sunAngle * Math.PI) / 180) * 8000; // Distance from center

  // Base coordinates (NYC center)
  const centerLng = -74.006;
  const centerLat = 40.7128;

  // Calculate sun position
  const sunLng = centerLng + sunDistance / 100000; // Convert to degrees
  const sunLat = centerLat;
  const sunZ = Math.max(1000, sunHeight);

  // Time-based lighting conditions
  let lighting: LightingConfig;

  if (hour >= 6 && hour <= 8) {
    // Dawn - warm golden light
    lighting = {
      ambientRatio: 0.4,
      diffuseRatio: 0.8,
      specularRatio: 0.3,
      lightsPosition: [sunLng, sunLat, sunZ],
      lightsStrength: [1.5],
      numberOfLights: 1,
      sunColor: [255, 200, 150],
      skyColor: [255, 180, 120],
    };
  } else if (hour >= 8 && hour <= 17) {
    // Day - bright clear light
    lighting = {
      ambientRatio: 0.3,
      diffuseRatio: 0.7,
      specularRatio: 0.4,
      lightsPosition: [
        sunLng,
        sunLat,
        sunZ, // Main sun
        centerLng + 0.01,
        centerLat,
        5000, // Fill light
        centerLng - 0.01,
        centerLat,
        3000, // Ambient fill
      ],
      lightsStrength: [2.5, 0.8, 0.5],
      numberOfLights: 3,
      sunColor: [255, 255, 240],
      skyColor: [135, 206, 235],
    };
  } else if (hour >= 17 && hour <= 19) {
    // Sunset - warm orange/red light
    lighting = {
      ambientRatio: 0.5,
      diffuseRatio: 0.9,
      specularRatio: 0.2,
      lightsPosition: [sunLng, sunLat, Math.max(500, sunZ)],
      lightsStrength: [2.0],
      numberOfLights: 1,
      sunColor: [255, 150, 80],
      skyColor: [255, 140, 100],
    };
  } else {
    // Night - artificial lighting with moon
    const moonLng = centerLng - 0.02;
    const moonLat = centerLat + 0.01;
    const moonZ = 8000;

    lighting = {
      ambientRatio: 0.6,
      diffuseRatio: 0.4,
      specularRatio: 0.6,
      lightsPosition: [
        moonLng,
        moonLat,
        moonZ, // Moon light
        centerLng,
        centerLat,
        1000, // Street lights
        centerLng + 0.005,
        centerLat,
        800, // Building lights
      ],
      lightsStrength: [0.8, 1.2, 1.0],
      numberOfLights: 3,
      sunColor: [200, 220, 255],
      skyColor: [25, 25, 50],
    };
  }

  return lighting;
}

export function getTimeBasedColors(timeOfDay: number = 12) {
  const hour = ((timeOfDay % 24) + 24) % 24;

  // Base building colors adjusted for time of day
  const baseBuildingColors = {
    residential: [200, 180, 160, 255],
    office: [180, 180, 180, 255],
    commercial: [160, 160, 180, 255],
    industrial: [140, 160, 140, 255],
    mixed: [220, 200, 180, 255],
  };

  // Apply time-based color temperature
  if (hour >= 17 && hour <= 19) {
    // Sunset - warmer tones
    Object.keys(baseBuildingColors).forEach(key => {
      const color = baseBuildingColors[key as keyof typeof baseBuildingColors];
      color[0] = Math.min(255, color[0] * 1.1); // More red
      color[1] = Math.min(255, color[1] * 1.05); // Slightly more green
      color[2] = Math.min(255, color[2] * 0.9); // Less blue
    });
  } else if (hour >= 19 || hour <= 6) {
    // Night - cooler, darker tones with lit windows
    Object.keys(baseBuildingColors).forEach(key => {
      const color = baseBuildingColors[key as keyof typeof baseBuildingColors];
      color[0] = color[0] * 0.3; // Darker
      color[1] = color[1] * 0.3;
      color[2] = Math.min(255, color[2] * 0.4); // Slightly more blue

      // Add window glow effect randomly
      if (Math.random() > 0.7) {
        color[0] = Math.min(255, color[0] + 100);
        color[1] = Math.min(255, color[1] + 80);
        color[2] = Math.min(255, color[2] + 60);
      }
    });
  }

  return { buildings: baseBuildingColors };
}
