import { PolygonLayer } from '@deck.gl/layers';
import { getTimeBasedColors } from '../utils/colorSchemes';
import { convertPointsToLatLng } from '../utils/coordinates';

export function createBuildingLayer(buildings: any[], timeOfDay: number = 12) {
  const colors = getTimeBasedColors(timeOfDay);

  // Filter out buildings with invalid footprints BEFORE creating the layer
  const validBuildings = buildings.filter(building => {
    const hasValidFootprint = building.footprint &&
                              Array.isArray(building.footprint) &&
                              building.footprint.length >= 3;

    if (!hasValidFootprint) {
      console.warn('🚫 Filtering out building with invalid footprint:', building.id);
    }

    return hasValidFootprint;
  });

  console.log('🏢 BUILDING LAYER ANALYSIS:');
  console.log('📊 Total buildings provided:', buildings.length);
  console.log('✅ Valid buildings (have footprints):', validBuildings.length);
  console.log('❌ Invalid buildings filtered out:', buildings.length - validBuildings.length);

  if (validBuildings.length > 0) {
    console.log('🔍 First valid building:', validBuildings[0]);
  }

  if (buildings.length - validBuildings.length > 0) {
    const firstInvalid = buildings.find(b => !validBuildings.includes(b));
    console.log('❌ First invalid building:', firstInvalid);
  }

  return new PolygonLayer({
    id: 'buildings',
    data: validBuildings,
    getPolygon: (d: any) => {
      if (!d.footprint || !Array.isArray(d.footprint) || d.footprint.length < 3) {
        console.warn('🚫 Building has invalid footprint:', {
          id: d.id,
          footprint: d.footprint,
          type: typeof d.footprint
        });
        return [];
      }

      // Check if footprint is already in lat/lng format (test buildings)
      const isLatLng = d.footprint[0].length === 2 &&
                      Math.abs(d.footprint[0][1]) <= 90 &&
                      Math.abs(d.footprint[0][0]) <= 180;

      const converted = isLatLng ? d.footprint : convertPointsToLatLng(d.footprint);

      if (validBuildings.indexOf(d) < 5) {
        console.log('🏢 POLYGON DEBUG:', {
          index: validBuildings.indexOf(d),
          id: d.id,
          footprintPoints: d.footprint.length,
          convertedPoints: converted.length,
          firstPoint: converted[0],
          isLatLng,
          isValidPolygon: converted.length >= 3
        });
      }
      return converted;
    },
    getElevation: (d: any) => {
      const height = d.height || d.stories * 3.5 || (50 + Math.random() * 200);
      const finalHeight = Math.max(20, height); // Reasonable minimum height
      if (validBuildings.indexOf(d) < 10) {
        console.log('🏢 Building elevation DEBUG:', {
          index: validBuildings.indexOf(d),
          id: d.id,
          rawHeight: d.height,
          stories: d.stories,
          calculatedHeight: height,
          finalHeight,
          hasFootprint: !!d.footprint,
          footprintLength: d.footprint?.length || 0,
          extruded: true,
          elevationScale: 10.0,
          isVisible: finalHeight > 0 && !!d.footprint
        });
      }
      return finalHeight;
    },
    getFillColor: (d: any) => {
      // Use realistic building type colors instead of height-based
      const buildingType = getBuildingType(d);
      const baseColor = colors.buildings[buildingType] || colors.buildings.residential;

      // Add subtle variation for realism (+/- 5% per channel)
      const variation = 0.05;
      const seed = d.id ? hashString(d.id.toString()) : Math.random();
      const variedColor = baseColor.map((channel: number, index: number) => {
        if (index === 3) return channel; // Keep alpha unchanged
        const randomFactor = (seed * (index + 1)) % 1; // Deterministic variation
        const variance = (randomFactor - 0.5) * 2 * variation;
        return Math.max(0, Math.min(255, Math.round(channel * (1 + variance))));
      });

      if (validBuildings.indexOf(d) < 3) {
        console.log('🎨 Building color debug:', {
          id: d.id,
          type: buildingType,
          baseColor,
          variedColor,
          height: d.height || d.stories * 3.5 || 0
        });
      }

      return variedColor;
    },
    getLineColor: [255, 255, 255, 255], // Bright white lines
    getLineWidth: 2,
    extruded: true,
    wireframe: false,
    filled: true,
    stroked: true,
    elevationScale: 2.0, // Reasonable elevation scale
    pickable: true,
    material: {
      ambient: 0.35,
      diffuse: 0.85,
      shininess: 128,
      specularColor: [240, 240, 240],
    },
    lightSettings: {
      lightsPosition: [-74.0060, 40.7128, 5000, -74.0060, 40.7128, 8000],
      ambientRatio: 0.35,
      diffuseRatio: 0.65,
      specularRatio: 0.25,
      lightsStrength: [1.8, 0.0, 1.2, 0.0],
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

function getBuildingType(building: any): string {
  // Try multiple sources for building type
  if (building.type) {
    return building.type.toLowerCase();
  }
  if (building.buildingType !== undefined) {
    return getBuildingTypeName(building.buildingType);
  }
  if (building.zone?.type) {
    return building.zone.type.toLowerCase();
  }
  if (building.zoneType) {
    return building.zoneType.toLowerCase();
  }

  // Enhanced fallback: guess based on height, location, and building characteristics
  const height = building.height || building.stories * 3.5 || 20;
  const stories = building.stories || Math.ceil(height / 3.5);

  // Very tall buildings are almost always offices
  if (height > 200) {
    return 'office';
  }
  // Tall buildings with fewer floors are likely office buildings
  else if (height > 100 && stories < 50) {
    return 'office';
  }
  // Mid-height buildings could be commercial or mixed-use
  else if (height > 50) {
    // Use building ID to create deterministic variety
    const seed = building.id ? hashString(building.id.toString()) : Math.random();
    return seed > 0.6 ? 'commercial' : 'office';
  }
  // Low buildings in dense areas are likely commercial
  else if (height > 20 && height <= 50) {
    return 'commercial';
  }
  // Everything else is residential
  else {
    return 'residential';
  }
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) / 2147483647; // Normalize to 0-1
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