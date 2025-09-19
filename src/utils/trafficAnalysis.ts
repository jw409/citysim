import { TrafficDensityPoint } from '../types/optimization';

export function processTrafficData(
  trafficData: any,
  roads: any[],
  agents: any[]
): TrafficDensityPoint[] {
  const densityPoints: TrafficDensityPoint[] = [];
  const gridSize = 200; // 200m grid

  // Calculate bounds from roads and agents
  const bounds = calculateBounds(roads, agents);

  // Create a grid-based analysis
  for (let x = bounds.minX; x < bounds.maxX; x += gridSize) {
    for (let y = bounds.minY; y < bounds.maxY; y += gridSize) {
      const gridCenter = { x: x + gridSize / 2, y: y + gridSize / 2 };
      const density = calculateTrafficDensityAt(gridCenter, agents, roads);
      const flowVolume = calculateFlowVolumeAt(gridCenter, agents, roads);

      // Only include points with significant traffic
      if (density > 0.5) {
        densityPoints.push({
          position: gridCenter,
          density,
          flow_volume: flowVolume,
          peak_hours: [8, 9, 17, 18], // Rush hours
        });
      }
    }
  }

  // Sort by density (highest first) and limit for performance
  return densityPoints.sort((a, b) => b.density - a.density).slice(0, 50);
}

function calculateBounds(roads: any[], agents: any[]) {
  let minX = Infinity,
    minY = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity;

  // Include road bounds
  roads.forEach(road => {
    if (road.path && Array.isArray(road.path)) {
      road.path.forEach((point: any) => {
        const px = point.x || point[0] || 0;
        const py = point.y || point[1] || 0;
        minX = Math.min(minX, px);
        minY = Math.min(minY, py);
        maxX = Math.max(maxX, px);
        maxY = Math.max(maxY, py);
      });
    }
  });

  // Include agent bounds
  agents.forEach(agent => {
    if (agent.position) {
      minX = Math.min(minX, agent.position.x || 0);
      minY = Math.min(minY, agent.position.y || 0);
      maxX = Math.max(maxX, agent.position.x || 0);
      maxY = Math.max(maxY, agent.position.y || 0);
    }
  });

  // Fallback bounds if no data
  if (!isFinite(minX)) {
    minX = -1000;
    minY = -1000;
    maxX = 1000;
    maxY = 1000;
  }

  return { minX, minY, maxX, maxY };
}

function calculateTrafficDensityAt(
  position: { x: number; y: number },
  agents: any[],
  roads: any[]
): number {
  const searchRadius = 150; // 150m radius
  let density = 0;

  // Count agents within radius
  agents.forEach(agent => {
    if (!agent.position) return;

    const distance = Math.sqrt(
      Math.pow((agent.position.x || 0) - position.x, 2) +
        Math.pow((agent.position.y || 0) - position.y, 2)
    );

    if (distance <= searchRadius) {
      // Weight by agent activity (slower = more congested)
      const speedFactor = Math.max(0.1, 1 - (agent.speed || 0) / 50);
      density += speedFactor;
    }
  });

  // Add road capacity influence
  roads.forEach(road => {
    if (!road.path || !Array.isArray(road.path)) return;

    const roadDistance = distanceToRoad(position, road.path);
    if (roadDistance <= searchRadius) {
      const weight = 1 - roadDistance / searchRadius;
      const lanes = road.lanes || 2;
      density += weight * lanes * 0.3;
    }
  });

  return density;
}

function calculateFlowVolumeAt(
  position: { x: number; y: number },
  agents: any[],
  roads: any[]
): number {
  const searchRadius = 200; // 200m influence radius
  let flowVolume = 0;

  // Calculate flow from nearby agents
  agents.forEach(agent => {
    if (!agent.position) return;

    const distance = Math.sqrt(
      Math.pow((agent.position.x || 0) - position.x, 2) +
        Math.pow((agent.position.y || 0) - position.y, 2)
    );

    if (distance <= searchRadius) {
      const weight = 1 - distance / searchRadius;
      flowVolume += weight * (agent.speed || 0);
    }
  });

  // Add road flow contribution
  roads.forEach(road => {
    const roadDistance = distanceToRoad(position, road.path || []);
    if (roadDistance <= searchRadius) {
      const weight = 1 - roadDistance / searchRadius;
      flowVolume += weight * (road.traffic_density || 10);
    }
  });

  return flowVolume;
}

function distanceToRoad(point: { x: number; y: number }, roadPath: any[]): number {
  if (roadPath.length < 2) return Infinity;

  let minDistance = Infinity;

  for (let i = 0; i < roadPath.length - 1; i++) {
    const segmentDistance = distanceToLineSegment(
      point,
      {
        x: roadPath[i].x || roadPath[i][0] || 0,
        y: roadPath[i].y || roadPath[i][1] || 0,
      },
      {
        x: roadPath[i + 1].x || roadPath[i + 1][0] || 0,
        y: roadPath[i + 1].y || roadPath[i + 1][1] || 0,
      }
    );
    minDistance = Math.min(minDistance, segmentDistance);
  }

  return minDistance;
}

function distanceToLineSegment(
  point: { x: number; y: number },
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number }
): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;

  if (dx === 0 && dy === 0) {
    // Line is actually a point
    const dx2 = point.x - lineStart.x;
    const dy2 = point.y - lineStart.y;
    return Math.sqrt(dx2 * dx2 + dy2 * dy2);
  }

  const t = Math.max(
    0,
    Math.min(1, ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (dx * dx + dy * dy))
  );

  const closestX = lineStart.x + t * dx;
  const closestY = lineStart.y + t * dy;

  const dx3 = point.x - closestX;
  const dy3 = point.y - closestY;

  return Math.sqrt(dx3 * dx3 + dy3 * dy3);
}

export function generateCandidateLocations(
  trafficPoints: TrafficDensityPoint[],
  roads: any[],
  existingStations: any[] = []
): { x: number; y: number }[] {
  const candidates: { x: number; y: number }[] = [];
  const minDistance = 500; // Minimum 500m between stations

  // Sort by traffic density and take top candidates
  const sortedPoints = trafficPoints
    .filter(point => point.density > 2) // Minimum density threshold
    .slice(0, 30); // Top 30 traffic points

  for (const point of sortedPoints) {
    // Check distance from existing stations
    const tooClose = existingStations.some(station => {
      const distance = Math.sqrt(
        Math.pow((station.position?.x || 0) - point.position.x, 2) +
          Math.pow((station.position?.y || 0) - point.position.y, 2)
      );
      return distance < minDistance;
    });

    if (!tooClose) {
      // Find nearest road for practical placement
      const nearestRoad = findNearestRoadPoint(point.position, roads);
      if (nearestRoad) {
        candidates.push(nearestRoad);
      }
    }
  }

  return candidates.slice(0, 20); // Limit to 20 candidates for performance
}

function findNearestRoadPoint(
  position: { x: number; y: number },
  roads: any[]
): { x: number; y: number } | null {
  let nearestPoint: { x: number; y: number } | null = null;
  let minDistance = Infinity;

  roads.forEach(road => {
    if (!road.path || !Array.isArray(road.path)) return;

    road.path.forEach((point: any) => {
      const px = point.x || point[0] || 0;
      const py = point.y || point[1] || 0;
      const distance = Math.sqrt(Math.pow(px - position.x, 2) + Math.pow(py - position.y, 2));

      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = { x: px, y: py };
      }
    });
  });

  return nearestPoint;
}
