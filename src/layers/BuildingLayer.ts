import { PolygonLayer } from '@deck.gl/layers';
import { getTimeBasedColors } from '../utils/colorSchemes';
import { convertPointsToLatLng } from '../utils/coordinates';

export function createBuildingLayer(buildings: any[], timeOfDay: number = 12) {
  const colors = getTimeBasedColors(timeOfDay);

  console.log('Building layer data:', {
    count: buildings.length,
    sample: buildings.slice(0, 3),
    firstBuilding: buildings[0]
  });

  return new PolygonLayer({
    id: 'buildings',
    data: buildings,
    getPolygon: (d: any) => {
      if (!d.footprint) return [];
      const converted = convertPointsToLatLng(d.footprint);
      if (buildings.indexOf(d) === 0) {
        const center = {
          lat: converted.reduce((sum, p) => sum + p[1], 0) / converted.length,
          lng: converted.reduce((sum, p) => sum + p[0], 0) / converted.length
        };
        console.log('🏢 COORDINATE DEBUG - First building position:', {
          id: d.id,
          originalFootprint: d.footprint.slice(0, 2),
          convertedLatLng: converted.slice(0, 2),
          buildingCenter: center,
          height: d.height,
          distanceFromCamera: Math.sqrt(
            Math.pow(center.lng - (-74.0060), 2) +
            Math.pow(center.lat - 40.7128, 2)
          )
        });
        console.log('🎯 CAMERA vs BUILDING CENTER:', {
          camera: { lng: -74.0060, lat: 40.7128 },
          building: center,
          same_hemisphere: Math.abs(center.lng + 74) < 1 && Math.abs(center.lat - 40) < 1
        });
      }
      return converted;
    },
    getElevation: (d: any) => {
      const height = d.height || d.stories * 3.5 || (50 + Math.random() * 200);
      console.log('Building elevation:', height, 'extruded:', true, 'id:', d.id);
      return height;
    },
    getFillColor: (d: any) => {
      // GEMINI'S FIX: Force bright visible colors for debugging
      const height = d.height || d.stories * 3.5 || (20 + Math.random() * 80);

      if (buildings.indexOf(d) < 5) {
        console.log('🎨 Building color debug:', {
          id: d.id,
          height,
          color: [100, 150, 200, 255] // Bright blue for visibility
        });
      }

      // Return bright colors to ensure visibility
      return height > 100 ? [255, 100, 100, 255] : [100, 150, 200, 255]; // Red for tall, blue for short
    },
    getLineColor: [255, 255, 255, 255], // Bright white lines
    getLineWidth: 2,
    extruded: true,
    wireframe: false,
    filled: true,
    stroked: true,
    elevationScale: 2.0, // Increased for more prominent 3D buildings
    pickable: true,
    material: {
      ambient: 0.4,
      diffuse: 0.8,
      shininess: 64,
      specularColor: [255, 255, 255],
    },
    lightSettings: {
      lightsPosition: [-122.45, 37.8, 8000, -122.45, 37.8, 8000],
      ambientRatio: 0.4,
      diffuseRatio: 0.6,
      specularRatio: 0.2,
      lightsStrength: [2.0, 0.0, 0.8, 0.0],
      numberOfLights: 2
    },
    transitions: {
      getFillColor: 1000,
      getElevation: 0, // Remove elevation transition to prevent flickering
    },
  });
}

function getBuildingTypeName(buildingType: number): string {
  const types = ['residential', 'residential', 'office', 'commercial', 'industrial'];
  return types[buildingType] || 'residential';
}

// Height-based building colors for realistic urban density visualization
function getHeightBasedBuildingColor(buildingType: string, height: number, timeOfDay: number, colors: any): number[] {
  // Get base color for building type
  const baseColor = colors.buildings[buildingType] || colors.buildings.residential;

  // Create height-based variation for realism
  let heightFactor = 1.0;
  let shadowIntensity = 0;

  if (height > 200) {
    // Skyscrapers (200m+) - Glass towers, darker with height
    heightFactor = 0.7;
    shadowIntensity = 0.3;
  } else if (height > 100) {
    // High-rise (100-200m) - Office buildings, slight darkening
    heightFactor = 0.85;
    shadowIntensity = 0.2;
  } else if (height > 50) {
    // Mid-rise (50-100m) - Apartments/offices, slight variation
    heightFactor = 0.95;
    shadowIntensity = 0.1;
  } else {
    // Low-rise (0-50m) - Houses/small buildings, full brightness
    heightFactor = 1.0;
    shadowIntensity = 0;
  }

  // Apply night lighting effects
  if (timeOfDay < 6 || timeOfDay > 20) {
    // Night time - taller buildings have more lit windows
    const windowLightFactor = Math.min(height / 200, 1.0);
    heightFactor += windowLightFactor * 0.4; // Add window glow
  }

  // Apply height-based darkening (taller = more shadow)
  const finalColor = baseColor.map((channel: number, index: number) => {
    if (index === 3) return channel; // Keep alpha unchanged

    // Apply height factor and shadow
    let adjustedChannel = channel * heightFactor;
    adjustedChannel = adjustedChannel * (1 - shadowIntensity);

    return Math.round(Math.max(0, Math.min(255, adjustedChannel)));
  });

  // Add building type specific modifications
  switch (buildingType) {
    case 'office':
      if (height > 100) {
        // Tall office buildings have more glass (blue tint)
        finalColor[2] = Math.min(255, finalColor[2] + 20); // More blue
      }
      break;
    case 'commercial':
      // Commercial buildings are brighter (storefronts)
      finalColor.forEach((channel, index) => {
        if (index < 3) finalColor[index] = Math.min(255, channel * 1.1);
      });
      break;
    case 'industrial':
      // Industrial buildings are more muted
      finalColor.forEach((channel, index) => {
        if (index < 3) finalColor[index] = Math.round(channel * 0.9);
      });
      break;
  }

  return finalColor;
}