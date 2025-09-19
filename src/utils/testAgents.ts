// Test agent generator for immediate testing of first/third person views

export interface TestAgent {
  id: number;
  position: { x: number; y: number; z?: number };
  agent_type: string;
  speed: number;
  state: string;
  destination?: string;
  path: any[];
  path_progress: number;
  heading?: number;
}

export function generateTestAgents(count: number = 20): TestAgent[] {
  const agents: TestAgent[] = [];
  const agentTypes = ['Car', 'Pedestrian', 'Bus', 'Truck'];

  // Create a central area around coordinates (0, 0) for easy viewing
  const centerX = 0;
  const centerY = 0;
  const radius = 500; // 500m radius

  for (let i = 0; i < count; i++) {
    // Random position within radius
    const angle = (i / count) * 2 * Math.PI; // Distribute evenly around circle
    const r = Math.random() * radius;
    const x = centerX + Math.cos(angle) * r;
    const y = centerY + Math.sin(angle) * r;

    const agent: TestAgent = {
      id: i,
      position: {
        x: x,
        y: y,
        z: 5 // 5 meters above ground
      },
      agent_type: agentTypes[i % agentTypes.length],
      speed: 5 + Math.random() * 10, // 5-15 km/h
      state: 'Traveling',
      destination: `test_destination_${i}`,
      path: [
        { x: x, y: y },
        { x: x + Math.random() * 100 - 50, y: y + Math.random() * 100 - 50 }
      ],
      path_progress: 0,
      heading: Math.random() * 360 // Random heading for testing
    };

    agents.push(agent);
  }

  console.log(`Generated ${agents.length} test agents for first/third person view testing`);
  return agents;
}

export function generateMovingTestAgents(count: number = 15): TestAgent[] {
  const agents: TestAgent[] = [];
  const agentTypes = [
    { type: 'Pedestrian', speed: 5, height: 1.7 },
    { type: 'Car', speed: 30, height: 1.2 },
    { type: 'Bus', speed: 25, height: 2.0 },
    { type: 'Truck', speed: 20, height: 1.8 }
  ];

  // Create agents in a more compact area for easier viewing
  for (let i = 0; i < count; i++) {
    const agentType = agentTypes[i % agentTypes.length];

    // Place agents in a grid pattern for easy selection
    const gridSize = Math.ceil(Math.sqrt(count));
    const row = Math.floor(i / gridSize);
    const col = i % gridSize;

    const spacing = 80; // 80m spacing between agents
    const x = (col - gridSize/2) * spacing;
    const y = (row - gridSize/2) * spacing;

    const agent: TestAgent = {
      id: i,
      position: {
        x: x,
        y: y,
        z: agentType.height
      },
      agent_type: agentType.type,
      speed: agentType.speed + Math.random() * 5, // Add some variation
      state: 'Traveling',
      destination: `destination_${i}`,
      path: [
        { x: x, y: y },
        { x: x + 200, y: y + 200 }, // Move northeast
        { x: x - 200, y: y + 200 }, // Move northwest
        { x: x - 200, y: y - 200 }, // Move southwest
        { x: x + 200, y: y - 200 }, // Move southeast
        { x: x, y: y } // Return to start
      ],
      path_progress: 0,
      heading: i * 24 // Different headings for variety (0, 24, 48, 72, etc. degrees)
    };

    agents.push(agent);
  }

  console.log(`Generated ${agents.length} moving test agents with headings for camera testing`);
  return agents;
}