import { ScatterplotLayer, PathLayer } from '@deck.gl/layers';

export interface AutonomousAgent {
  id: string;
  type: 'car' | 'drone' | 'airplane' | 'person';
  position: [number, number, number];
  velocity: [number, number, number];
  path?: [number, number, number][];
  color: [number, number, number, number];
  size: number;
}

export function createAutonomousAgentLayer(agents: AutonomousAgent[]) {
  return [
    // Vehicle positions
    new ScatterplotLayer({
      id: 'autonomous-agents',
      data: agents,
      getPosition: (d: AutonomousAgent) => d.position,
      getRadius: (d: AutonomousAgent) => d.size,
      getFillColor: (d: AutonomousAgent) => d.color,
      getLineColor: [255, 255, 255, 100],
      lineWidthMinPixels: 1,
      radiusScale: 1,
      radiusMinPixels: 2,
      radiusMaxPixels: 20,
      pickable: false, // PERF: Disabled to prevent picking overhead on interaction
      stroked: true,
      filled: true,
    }),

    // Vehicle paths
    new PathLayer({
      id: 'agent-paths',
      data: agents.filter(a => a.path && a.path.length > 1),
      getPath: (d: AutonomousAgent) => d.path!,
      getColor: (d: AutonomousAgent) => [d.color[0], d.color[1], d.color[2], 80],
      getWidth: (d: AutonomousAgent) => (d.type === 'airplane' ? 5 : 2),
      widthScale: 1,
      widthMinPixels: 1,
      pickable: false,
    }),
  ];
}

export function generateAutonomousAgents(
  centerLat: number,
  centerLng: number,
  cityData?: any
): AutonomousAgent[] {
  const agents: AutonomousAgent[] = [];

  // Generate cars spawned near residential buildings (not randomly in air)
  // PERF: Reduced from 100 to 20 cars for faster initial render
  if (cityData?.buildings) {
    const residentialBuildings = cityData.buildings.filter(
      (b: any) => b.type === 0 || b.zone_id?.includes('residential')
    );
    const maxCars = Math.min(20, residentialBuildings.length); // Reduced for performance

    for (let i = 0; i < maxCars; i++) {
      const building =
        residentialBuildings[Math.floor(Math.random() * residentialBuildings.length)];
      if (building?.footprint?.[0]) {
        // Spawn car near building entrance (first footprint point + small offset)
        const buildingPos = building.footprint[0];
        const position: [number, number, number] = [
          buildingPos.x + (Math.random() - 0.5) * 30, // ±15m from building
          buildingPos.y + (Math.random() - 0.5) * 30,
          1, // 1 meter above ground (realistic car height)
        ];

        agents.push({
          id: `car-${i}`,
          type: 'car',
          position,
          velocity: [(Math.random() - 0.5) * 0.0005, (Math.random() - 0.5) * 0.0005, 0],
          color: [
            Math.random() * 100 + 100, // Car colors (darker than before)
            Math.random() * 100 + 100,
            Math.random() * 100 + 100,
            255,
          ],
          size: 2,
        });
      }
    }
  } else {
    // Fallback if no city data provided
    for (let i = 0; i < 50; i++) {
      const roadOffset = (Math.random() - 0.5) * 0.01;
      const position: [number, number, number] = [
        centerLng + roadOffset,
        centerLat + (Math.random() - 0.5) * 0.01,
        1,
      ];

      agents.push({
        id: `car-${i}`,
        type: 'car',
        position,
        velocity: [(Math.random() - 0.5) * 0.0005, (Math.random() - 0.5) * 0.0005, 0],
        color: [150, 150, 150, 255],
        size: 2,
      });
    }
  }

  // Generate drones spawned on building rooftops (realistic)
  // PERF: Reduced from 15 to 5 drones for faster initial render
  if (cityData?.buildings) {
    const tallBuildings = cityData.buildings.filter((b: any) => b.height > 50);
    const maxDrones = Math.min(5, Math.floor(tallBuildings.length / 5)); // Reduced for performance

    for (let i = 0; i < maxDrones; i++) {
      const building = tallBuildings[Math.floor(Math.random() * tallBuildings.length)];
      if (building?.footprint?.[0] && building.height) {
        // Spawn drone on rooftop center
        const rooftopCenter = building.footprint.reduce(
          (acc: any, point: any) => ({
            x: acc.x + point.x / building.footprint.length,
            y: acc.y + point.y / building.footprint.length,
          }),
          { x: 0, y: 0 }
        );

        const takeoffHeight = building.height + 10; // 10m above rooftop
        const position: [number, number, number] = [
          rooftopCenter.x,
          rooftopCenter.y,
          takeoffHeight,
        ];

        // Generate patrol path that avoids buildings
        const path: [number, number, number][] = [];
        const patrolRadius = 200; // 200m patrol radius
        const safeHeight = Math.max(takeoffHeight, 100); // Stay at least 100m high

        for (let j = 0; j < 12; j++) {
          const angle = (j / 12) * Math.PI * 2; // Circle patrol
          path.push([
            rooftopCenter.x + Math.cos(angle) * patrolRadius,
            rooftopCenter.y + Math.sin(angle) * patrolRadius,
            safeHeight + Math.sin(j * 0.5) * 20, // Gentle altitude variation
          ]);
        }

        agents.push({
          id: `drone-${i}`,
          type: 'drone',
          position,
          velocity: [0, 0, 2],
          path,
          color: [255, 150, 0, 255], // Bright orange for visibility
          size: 3,
        });
      }
    }
  } else {
    // Fallback drone generation
    for (let i = 0; i < 10; i++) {
      const height = 100 + Math.random() * 100;
      const position: [number, number, number] = [
        centerLng + (Math.random() - 0.5) * 0.01,
        centerLat + (Math.random() - 0.5) * 0.01,
        height,
      ];

      agents.push({
        id: `drone-${i}`,
        type: 'drone',
        position,
        velocity: [0, 0, 2],
        color: [255, 150, 0, 255],
        size: 3,
      });
    }
  }

  // Generate people near building entrances (realistic pedestrians)
  // PERF: Reduced from 50 to 15 for faster initial render
  if (cityData?.buildings) {
    const allBuildings = cityData.buildings;
    const maxPeople = Math.min(15, Math.floor(allBuildings.length / 3)); // Reduced for performance

    for (let i = 0; i < maxPeople; i++) {
      const building = allBuildings[Math.floor(Math.random() * allBuildings.length)];
      if (building?.footprint?.[0]) {
        // Spawn person near building entrance (first footprint point represents entrance)
        const entrancePos = building.footprint[0];

        // Convert from building coordinate system to lat/lng if needed
        let finalX, finalY;
        if (typeof entrancePos === 'object' && 'x' in entrancePos && 'y' in entrancePos) {
          // Building uses {x, y} coordinates - need conversion
          finalX = entrancePos.x + (Math.random() - 0.5) * 10;
          finalY = entrancePos.y + (Math.random() - 0.5) * 10;
        } else if (Array.isArray(entrancePos) && entrancePos.length >= 2) {
          // Building already in [lng, lat] format
          finalX = entrancePos[0] + (Math.random() - 0.5) * 0.0001; // Small offset in degrees
          finalY = entrancePos[1] + (Math.random() - 0.5) * 0.0001;
        } else {
          // Fallback to city center if can't parse
          finalX = centerLng;
          finalY = centerLat;
        }

        const position: [number, number, number] = [
          finalX,
          finalY,
          0.1, // Just above ground level
        ];

        agents.push({
          id: `person-${i}`,
          type: 'person',
          position,
          velocity: [(Math.random() - 0.5) * 0.0002, (Math.random() - 0.5) * 0.0002, 0], // Slow walking speed
          color: [
            Math.random() * 50 + 50, // Darker, more realistic person colors
            Math.random() * 50 + 50,
            Math.random() * 50 + 50,
            255,
          ],
          size: 1, // Small size for people
        });
      }
    }
  }

  // Generate airplanes - PERF: Reduced from 10 to 3
  for (let i = 0; i < 3; i++) {
    const altitude = 1000 + Math.random() * 5000; // 1-6km altitude
    const startLng = centerLng + (Math.random() - 0.5) * 0.1;
    const startLat = centerLat + (Math.random() - 0.5) * 0.1;

    // Generate flight path across the city
    const path: [number, number, number][] = [];
    const direction = Math.random() * Math.PI * 2;
    for (let j = 0; j < 50; j++) {
      const distance = j * 0.002;
      path.push([
        startLng + Math.cos(direction) * distance,
        startLat + Math.sin(direction) * distance,
        altitude + (Math.random() - 0.5) * 100, // Slight altitude variation
      ]);
    }

    agents.push({
      id: `airplane-${i}`,
      type: 'airplane',
      position: path[0],
      velocity: [Math.cos(direction) * 0.01, Math.sin(direction) * 0.01, 0],
      path,
      color: [255, 255, 255, 255], // White
      size: 8,
    });
  }

  // PERF: Removed duplicate 500 people generation - already generated above near buildings

  return agents;
}
