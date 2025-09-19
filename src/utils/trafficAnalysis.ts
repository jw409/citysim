export interface TrafficPoint {
  x: number;
  y: number;
  congestion: number;
  flow_rate: number;
  agent_density: number;
}

export function processTrafficData(
  trafficData: any,
  roads: any[],
  agents: any[]
): TrafficPoint[] {
  const trafficPoints: TrafficPoint[] = [];

  // Convert agents to traffic data points
  agents.forEach((agent, index) => {
    if (agent.position) {
      trafficPoints.push({
        x: agent.position.x || 0,
        y: agent.position.y || 0,
        congestion: Math.random() * 0.8, // Simulate congestion
        flow_rate: agent.speed || 0,
        agent_density: 1
      });
    }
  });

  // Add road-based traffic points
  roads.forEach((road, index) => {
    if (road.path && Array.isArray(road.path)) {
      road.path.forEach((point: any, pointIndex: number) => {
        trafficPoints.push({
          x: point[0] || point.x || 0,
          y: point[1] || point.y || 0,
          congestion: Math.random() * 0.5,
          flow_rate: road.traffic_density || Math.random() * 60,
          agent_density: Math.random() * 3
        });
      });
    }
  });

  return trafficPoints;
}
