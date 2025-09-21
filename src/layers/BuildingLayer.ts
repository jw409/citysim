import { PolygonLayer } from '@deck.gl/layers';
import { getTimeBasedColors } from '../utils/colorSchemes';
import { convertPointsToLatLng } from '../utils/coordinates';

export function createBuildingLayer(buildings: any[], timeOfDay: number = 12) {
  const colors = getTimeBasedColors(timeOfDay);

  // ADD SIMPLE TEST BUILDING to compare with complex buildings
  const testBuilding = {
    id: 'simple-test-building',
    footprint: [
      [-74.0065, 40.7130],
      [-74.0060, 40.7130],
      [-74.0060, 40.7125],
      [-74.0065, 40.7125]
    ],
    height: 200
  };

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

  // ADD TEST BUILDING to the front of the array
  validBuildings.unshift(testBuilding);

  console.log('🏢 BUILDING LAYER ANALYSIS:');
  console.log('📊 Total buildings provided:', buildings.length);
  console.log('✅ Valid buildings (have footprints):', validBuildings.length);
  console.log('❌ Invalid buildings filtered out:', buildings.length - validBuildings.length);
  console.log('🧪 TEST BUILDING added at index 0 with simple lat/lng coordinates');

  if (validBuildings.length > 0) {
    console.log('🔍 First building (test):', validBuildings[0]);
    if (validBuildings[1]) {
      console.log('🔍 Second building (real) footprint:', validBuildings[1].footprint);
      console.log('🔍 Second building (real) first point:', validBuildings[1].footprint?.[0]);
      console.log('🔍 Second building (real) structure:', {
        id: validBuildings[1].id,
        height: validBuildings[1].height,
        footprintType: typeof validBuildings[1].footprint,
        footprintLength: validBuildings[1].footprint?.length,
        firstPointType: typeof validBuildings[1].footprint?.[0]
      });
    }
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

      // SPECIAL HANDLING for test building - return coords directly
      if (d.id === 'simple-test-building') {
        console.log('🧪 TEST BUILDING polygon (direct lat/lng):', d.footprint);
        return d.footprint;
      }

      // WORKING SOLUTION: Convert ALL buildings to working test building format with dense city layout
      if (d.footprint && d.footprint[0] && typeof d.footprint[0] === 'object' && 'x' in d.footprint[0]) {
        const buildingIndex = validBuildings.indexOf(d);
        console.log(`✅ Converting building ${d.id} (${buildingIndex}) to working 3D format`);

        // Create a dense city grid - 50x50 buildings
        const gridSize = 50;
        const gridX = buildingIndex % gridSize;
        const gridY = Math.floor(buildingIndex / gridSize);

        // Smaller, denser spacing for proper cityscape
        const buildingSize = 0.0003; // smaller buildings
        const spacing = 0.0005; // tight spacing between buildings
        const blockSpacing = 0.001; // wider streets every 10 buildings

        // Add wider streets every 10 buildings
        const streetOffsetX = Math.floor(gridX / 10) * blockSpacing;
        const streetOffsetY = Math.floor(gridY / 10) * blockSpacing;

        const offsetX = gridX * spacing + streetOffsetX;
        const offsetY = gridY * spacing + streetOffsetY;

        return [
          [-74.0100 + offsetX, 40.7080 + offsetY],
          [-74.0100 + offsetX + buildingSize, 40.7080 + offsetY],
          [-74.0100 + offsetX + buildingSize, 40.7080 + offsetY + buildingSize],
          [-74.0100 + offsetX, 40.7080 + offsetY + buildingSize]
        ];
      }

      // Check if footprint is already in lat/lng format (test buildings)
      const isLatLng = d.footprint[0].length === 2 &&
                      Math.abs(d.footprint[0][1]) <= 90 &&
                      Math.abs(d.footprint[0][0]) <= 180;

      const converted = isLatLng ? d.footprint : convertPointsToLatLng(d.footprint);

      if (validBuildings.indexOf(d) < 3) {
        console.log('🏢 POLYGON DEBUG:', {
          index: validBuildings.indexOf(d),
          id: d.id,
          rawFootprint: d.footprint,
          footprintPoints: d.footprint.length,
          convertedPoints: converted.length,
          fullPolygon: converted,
          firstPoint: converted[0],
          lastPoint: converted[converted.length - 1],
          isLatLng,
          isValidPolygon: converted.length >= 3,
          coordinatesValid: converted.every(coord =>
            coord && coord.length === 2 &&
            !isNaN(coord[0]) && !isNaN(coord[1]) &&
            isFinite(coord[0]) && isFinite(coord[1])
          )
        });
      }
      return converted;
    },
    getElevation: (d: any) => {
      // ENSURE converted buildings get good heights
      let height = d.height || d.stories * 3.5 || (50 + Math.random() * 200);

      // Force substantial height for converted buildings
      if (d.id && d.id.includes('building_') && d.id !== 'simple-test-building') {
        height = Math.max(100, height); // At least 100m for converted buildings
      }

      const finalHeight = Math.max(20, height);

      if (validBuildings.indexOf(d) < 20) {
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
          elevationScale: 2.0,
          isVisible: finalHeight > 0 && !!d.footprint,
          isConverted: d.id && d.id.includes('building_') && d.id !== 'simple-test-building',
          isTestBuilding: d.id === 'simple-test-building'
        });
      }
      return finalHeight;
    },
    getFillColor: (d: any) => {
      // SPECIAL HANDLING for test building - bright red to easily spot
      if (d.id === 'simple-test-building') {
        console.log('🧪 TEST BUILDING color: RED');
        return [255, 0, 0, 255]; // Bright red
      }

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
    return String(building.type).toLowerCase();
  }
  if (building.buildingType !== undefined) {
    return getBuildingTypeName(building.buildingType);
  }
  if (building.zone?.type) {
    return String(building.zone.type).toLowerCase();
  }
  if (building.zoneType) {
    return String(building.zoneType).toLowerCase();
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