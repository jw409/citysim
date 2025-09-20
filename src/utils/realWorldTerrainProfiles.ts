interface TerrainProfile {
  name: string;
  description: string;
  parameters: {
    mountainHeight: number; // meters - max elevation variation
    waterLevel: number; // meters - sea level reference (negative = below sea level)
    hilliness: number; // 0-1 - terrain variation factor
    riverProbability: number; // 0-1 - likelihood of rivers
    coastalDistance: number; // meters - distance to coast/major water
  };
  recommendedScale: number; // 1=city, 100=regional, 1000=planetary
  characteristics: string[]; // Human-readable traits
  realWorldContext: string; // Why this city is like this
}

export function getTerrainProfilePresets(): Record<string, TerrainProfile> {
  return {
    manhattan: {
      name: 'Manhattan',
      description: 'Dense island city surrounded by rivers and harbors',
      parameters: {
        mountainHeight: 25, // Manhattan's highest point is ~80m, but most is very flat
        waterLevel: 0, // Sea level
        hilliness: 0.1, // Very flat overall
        riverProbability: 0.9, // Surrounded by Hudson, East rivers
        coastalDistance: 800 // Island - very close to water
      },
      recommendedScale: 1,
      characteristics: [
        'Island setting',
        'Multiple rivers and harbors',
        'Extremely flat terrain',
        'Dense waterfront development',
        'Bridge and tunnel connections'
      ],
      realWorldContext: 'Manhattan is a narrow island between two rivers, leading to intense vertical development due to limited land area. The flat terrain enabled the famous grid system.'
    },

    san_francisco: {
      name: 'San Francisco',
      description: 'Hilly peninsula with dramatic elevation changes and bay access',
      parameters: {
        mountainHeight: 180, // Twin Peaks ~280m, but very hilly throughout
        waterLevel: 0,
        hilliness: 0.8, // Very hilly - famous for steep streets
        riverProbability: 0.2, // Few rivers, mostly bay
        coastalDistance: 1500 // Peninsula with bay on multiple sides
      },
      recommendedScale: 1,
      characteristics: [
        'Extremely steep hills',
        'Peninsula location',
        'San Francisco Bay',
        'Varied neighborhood elevations',
        'Cable car terrain'
      ],
      realWorldContext: 'San Francisco is built on steep hills that dictated its unique development pattern. The peninsula location creates microclimates and stunning water views from elevated areas.'
    },

    denver: {
      name: 'Denver',
      description: 'High plains city with Rocky Mountain backdrop',
      parameters: {
        mountainHeight: 200, // City itself is relatively flat, but foothills nearby
        waterLevel: -1600, // 1 mile high - 1609m above sea level
        hilliness: 0.3, // Moderate terrain variation
        riverProbability: 0.4, // South Platte River system
        coastalDistance: 1600000 // Landlocked - ~1000 miles to nearest coast
      },
      recommendedScale: 10, // Regional scale to show mountain context
      characteristics: [
        'High elevation (mile high)',
        'Great Plains setting',
        'Rocky Mountain foothills',
        'Continental climate',
        'Grid system possible due to flat terrain'
      ],
      realWorldContext: 'Denver sits on the high plains at the base of the Rocky Mountains. The high elevation and continental location create a unique urban environment with dramatic mountain views.'
    },

    miami: {
      name: 'Miami',
      description: 'Coastal lowlands with barrier islands and wetlands',
      parameters: {
        mountainHeight: 8, // Extremely flat - highest point ~13m
        waterLevel: 2, // Slightly above sea level, flood prone
        hilliness: 0.02, // Virtually no elevation change
        riverProbability: 0.6, // Miami River, Everglades canals
        coastalDistance: 400 // Right on Atlantic coast
      },
      recommendedScale: 1,
      characteristics: [
        'Extremely flat terrain',
        'Barrier island system',
        'Coastal flooding risk',
        'Subtropical wetlands',
        'Artificial waterways'
      ],
      realWorldContext: 'Miami is built on former swampland with virtually no elevation. The flat terrain and proximity to sea level make it highly vulnerable to flooding and hurricanes.'
    },

    seattle: {
      name: 'Seattle',
      description: 'Puget Sound hills with multiple water bodies',
      parameters: {
        mountainHeight: 160, // Capitol Hill, Queen Anne Hill ~120-150m
        waterLevel: 0,
        hilliness: 0.6, // Rolling hills throughout
        riverProbability: 0.5, // Limited rivers, but lots of water
        coastalDistance: 1200 // Puget Sound, Lake Washington
      },
      recommendedScale: 1,
      characteristics: [
        'Rolling hills',
        'Multiple water bodies',
        'Puget Sound waterfront',
        'Distinct neighborhoods on hills',
        'Rain shadow effects'
      ],
      realWorldContext: 'Seattle is built on hills between Puget Sound and Lake Washington, creating distinct neighborhoods with water views. The terrain influenced the city\'s organic growth pattern.'
    },

    chicago: {
      name: 'Chicago',
      description: 'Great Lakes shore on former prairie land',
      parameters: {
        mountainHeight: 12, // Extremely flat - built on former lakebed
        waterLevel: 0,
        hilliness: 0.03, // Almost perfectly flat
        riverProbability: 0.3, // Chicago River system
        coastalDistance: 600 // Lake Michigan shoreline
      },
      recommendedScale: 5, // Larger scale to show Great Lakes context
      characteristics: [
        'Perfectly flat terrain',
        'Great Lakes shoreline',
        'Former prairie landscape',
        'Grid system enabled by flatness',
        'Engineered river reversal'
      ],
      realWorldContext: 'Chicago was built on flat prairie land next to Lake Michigan. The extremely flat terrain enabled the famous grid system and made large-scale urban planning possible.'
    },

    las_vegas: {
      name: 'Las Vegas',
      description: 'Desert valley surrounded by mountains',
      parameters: {
        mountainHeight: 300, // Valley floor to surrounding peaks
        waterLevel: -600, // ~600m above sea level, desert valley
        hilliness: 0.4, // Valley with surrounding mountains
        riverProbability: 0.1, // Desert - very little water
        coastalDistance: 400000 // Desert - hundreds of miles from coast
      },
      recommendedScale: 10,
      characteristics: [
        'Desert valley setting',
        'Surrounded by mountains',
        'Arid environment',
        'Planned city development',
        'Water scarcity'
      ],
      realWorldContext: 'Las Vegas sits in a desert valley surrounded by mountains. The scarcity of water and extreme climate shaped its development as a modern planned city.'
    },

    new_orleans: {
      name: 'New Orleans',
      description: 'Below-sea-level bowl shaped city with levees',
      parameters: {
        mountainHeight: 6, // Mostly below sea level to slightly above
        waterLevel: 3, // Much of city below sea level
        hilliness: 0.05, // Very flat, bowl-shaped
        riverProbability: 0.8, // Mississippi River, Lake Pontchartrain
        coastalDistance: 160000 // ~100 miles from Gulf of Mexico
      },
      recommendedScale: 1,
      characteristics: [
        'Below sea level',
        'Bowl-shaped topography',
        'Levee system required',
        'Flood risk',
        'River delta location'
      ],
      realWorldContext: 'New Orleans sits in a natural bowl below sea level in the Mississippi River delta. The unique topography requires extensive levee systems and creates perpetual flood risk.'
    },

    custom: {
      name: 'Custom',
      description: 'User-defined terrain parameters for experimental cities',
      parameters: {
        mountainHeight: 100,
        waterLevel: 0,
        hilliness: 0.5,
        riverProbability: 0.3,
        coastalDistance: 5000
      },
      recommendedScale: 1,
      characteristics: [
        'Fully customizable',
        'Experimental terrain',
        'User-defined parameters'
      ],
      realWorldContext: 'Create your own unique geographic setting to explore how different terrain shapes urban development patterns.'
    }
  };
}

export function getTerrainProfileList(): { value: string; label: string; description: string; context: string }[] {
  const profiles = getTerrainProfilePresets();
  return Object.entries(profiles).map(([key, profile]) => ({
    value: key,
    label: profile.name,
    description: profile.description,
    context: profile.realWorldContext
  }));
}

// Helper function to get profile by key
export function getTerrainProfile(profileKey: string): TerrainProfile | null {
  const profiles = getTerrainProfilePresets();
  return profiles[profileKey] || null;
}

// Helper to determine terrain difficulty for city building
export function getTerrainDifficulty(profile: TerrainProfile): 'easy' | 'moderate' | 'challenging' {
  const { hilliness, mountainHeight, waterLevel } = profile.parameters;

  // Calculate difficulty based on terrain factors
  const slopeChallenge = hilliness * mountainHeight / 100;
  const floodRisk = waterLevel > 0 ? waterLevel / 10 : 0;
  const elevationChallenge = Math.abs(waterLevel) / 1000;

  const totalDifficulty = slopeChallenge + floodRisk + elevationChallenge;

  if (totalDifficulty < 0.5) return 'easy';
  if (totalDifficulty < 1.5) return 'moderate';
  return 'challenging';
}

// Helper to get recommended development patterns
export function getDevelopmentRecommendations(profile: TerrainProfile): {
  downtown: string;
  residential: string;
  industrial: string;
  transportation: string;
} {
  const { hilliness, coastalDistance, riverProbability, waterLevel } = profile.parameters;

  return {
    downtown: hilliness < 0.3 ?
      'Flat areas near water for easy access and trade' :
      'Elevated areas with good views and drainage',

    residential: hilliness > 0.5 ?
      'Hills and elevated areas for views and status' :
      'Flat areas for efficient development',

    industrial: hilliness < 0.2 && waterLevel < 10 ?
      'Flat areas near water for transport and utilities' :
      'Level ground away from flood zones',

    transportation: hilliness > 0.6 ?
      'Winding roads following contours, bridges and tunnels' :
      'Grid system possible, efficient straight routes'
  };
}