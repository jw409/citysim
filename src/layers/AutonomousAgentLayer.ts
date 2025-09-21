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
      pickable: true,
      stroked: true,
      filled: true
    }),

    // Vehicle paths
    new PathLayer({
      id: 'agent-paths',
      data: agents.filter(a => a.path && a.path.length > 1),
      getPath: (d: AutonomousAgent) => d.path!,
      getColor: (d: AutonomousAgent) => [d.color[0], d.color[1], d.color[2], 80],
      getWidth: (d: AutonomousAgent) => d.type === 'airplane' ? 5 : 2,
      widthScale: 1,
      widthMinPixels: 1,
      pickable: false
    })
  ];
}

export function generateAutonomousAgents(centerLat: number, centerLng: number): AutonomousAgent[] {
  const agents: AutonomousAgent[] = [];

  // Generate cars on roads
  for (let i = 0; i < 200; i++) {
    const roadOffset = (Math.random() - 0.5) * 0.02;
    const position: [number, number, number] = [
      centerLng + roadOffset,
      centerLat + (Math.random() - 0.5) * 0.02,
      2 // 2 meters above ground
    ];

    agents.push({
      id: `car-${i}`,
      type: 'car',
      position,
      velocity: [(Math.random() - 0.5) * 0.001, (Math.random() - 0.5) * 0.001, 0],
      color: [
        Math.random() * 100 + 155, // Random bright colors
        Math.random() * 100 + 155,
        Math.random() * 100 + 155,
        255
      ],
      size: 3
    });
  }

  // Generate drones
  for (let i = 0; i < 30; i++) {
    const height = 50 + Math.random() * 200; // 50-250m altitude
    const position: [number, number, number] = [
      centerLng + (Math.random() - 0.5) * 0.03,
      centerLat + (Math.random() - 0.5) * 0.03,
      height
    ];

    // Generate spiral flight path
    const path: [number, number, number][] = [];
    for (let j = 0; j < 20; j++) {
      const angle = (j / 20) * Math.PI * 4; // 2 full spirals
      const radius = 0.001 * (1 + j * 0.1);
      path.push([
        position[0] + Math.cos(angle) * radius,
        position[1] + Math.sin(angle) * radius,
        height + j * 5
      ]);
    }

    agents.push({
      id: `drone-${i}`,
      type: 'drone',
      position,
      velocity: [0, 0, 5],
      path,
      color: [255, 100, 0, 255], // Orange
      size: 2
    });
  }

  // Generate airplanes
  for (let i = 0; i < 10; i++) {
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
        altitude + (Math.random() - 0.5) * 100 // Slight altitude variation
      ]);
    }

    agents.push({
      id: `airplane-${i}`,
      type: 'airplane',
      position: path[0],
      velocity: [Math.cos(direction) * 0.01, Math.sin(direction) * 0.01, 0],
      path,
      color: [255, 255, 255, 255], // White
      size: 8
    });
  }

  // Generate people
  for (let i = 0; i < 500; i++) {
    const position: [number, number, number] = [
      centerLng + (Math.random() - 0.5) * 0.015,
      centerLat + (Math.random() - 0.5) * 0.015,
      1.7 // Average human height
    ];

    agents.push({
      id: `person-${i}`,
      type: 'person',
      position,
      velocity: [(Math.random() - 0.5) * 0.0001, (Math.random() - 0.5) * 0.0001, 0],
      color: [255, 200, 100, 255], // Skin tone
      size: 1
    });
  }

  return agents;
}