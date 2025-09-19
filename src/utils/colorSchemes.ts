export const DAY_COLORS = {
  sky: [135, 206, 235],
  ground: [34, 139, 34],
  buildings: {
    residential: [255, 228, 181],
    commercial: [176, 224, 230],
    industrial: [169, 169, 169],
    office: [70, 130, 180],
  },
  roads: {
    highway: [64, 64, 64],
    arterial: [96, 96, 96],
    local: [128, 128, 128],
  },
  zones: {
    residential: [144, 238, 144, 100],
    commercial: [255, 182, 193, 100],
    industrial: [192, 192, 192, 100],
    downtown: [255, 215, 0, 100],
    park: [34, 139, 34, 100],
    water: [30, 144, 255, 150],
  },
  agents: {
    car: [255, 69, 0],
    bus: [255, 215, 0],
    truck: [160, 82, 45],
    pedestrian: [0, 191, 255],
  },
};

export const NIGHT_COLORS = {
  sky: [25, 25, 112],
  ground: [20, 20, 20],
  buildings: {
    residential: [255, 255, 224, 200],
    commercial: [255, 255, 255, 220],
    industrial: [128, 128, 128, 150],
    office: [255, 255, 255, 240],
  },
  roads: {
    highway: [40, 40, 40],
    arterial: [50, 50, 50],
    local: [60, 60, 60],
  },
  zones: {
    residential: [100, 149, 237, 60],
    commercial: [255, 105, 180, 60],
    industrial: [105, 105, 105, 60],
    downtown: [255, 215, 0, 80],
    park: [0, 100, 0, 60],
    water: [0, 0, 139, 120],
  },
  agents: {
    car: [255, 255, 255],
    bus: [255, 255, 0],
    truck: [255, 165, 0],
    pedestrian: [173, 216, 230],
  },
};

export function interpolateColors(color1: number[], color2: number[], factor: number): number[] {
  return color1.map((c1, i) => {
    const c2 = color2[i] || 0;
    return Math.round(c1 + (c2 - c1) * factor);
  });
}

export function getTimeBasedColors(timeOfDay: number) {
  // timeOfDay: 0-24 hours
  let dayFactor: number;

  if (timeOfDay >= 6 && timeOfDay <= 18) {
    // Day time (6 AM - 6 PM)
    dayFactor = 1.0;
  } else if (timeOfDay >= 19 || timeOfDay <= 5) {
    // Night time (7 PM - 5 AM)
    dayFactor = 0.0;
  } else {
    // Transition periods
    if (timeOfDay > 18) {
      // Evening transition (6 PM - 7 PM)
      dayFactor = 1.0 - (timeOfDay - 18);
    } else {
      // Morning transition (5 AM - 6 AM)
      dayFactor = timeOfDay - 5;
    }
  }

  const result = {
    sky: interpolateColors(NIGHT_COLORS.sky, DAY_COLORS.sky, dayFactor),
    ground: interpolateColors(NIGHT_COLORS.ground, DAY_COLORS.ground, dayFactor),
    buildings: {} as any,
    roads: {} as any,
    zones: {} as any,
    agents: {} as any,
  };

  // Interpolate all building colors
  Object.keys(DAY_COLORS.buildings).forEach(key => {
    result.buildings[key] = interpolateColors(
      NIGHT_COLORS.buildings[key as keyof typeof NIGHT_COLORS.buildings],
      DAY_COLORS.buildings[key as keyof typeof DAY_COLORS.buildings],
      dayFactor
    );
  });

  // Interpolate other categories
  ['roads', 'zones', 'agents'].forEach(category => {
    Object.keys(DAY_COLORS[category as keyof typeof DAY_COLORS]).forEach(key => {
      result[category][key] = interpolateColors(
        NIGHT_COLORS[category][key as any],
        DAY_COLORS[category][key as any],
        dayFactor
      );
    });
  });

  return result;
}