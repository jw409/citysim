import { TrafficData } from '../types/simulation';
import { TrafficDensityPoint } from '../types/optimization';

export function processTrafficData(
  trafficData: TrafficData,
  roads: any[],
  agents: any[]
): TrafficDensityPoint[] {
  const densityPoints: TrafficDensityPoint[] = [];
  const gridSize = 200; // 200m grid

  // Create a grid of density points
  const bounds = calculateBounds(roads);
  for (let x = bounds.minX; x < bounds.maxX; x += gridSize) {
    for (let y = bounds.minY; y < bounds.maxY; y += gridSize) {
      const density = calculateTrafficDensityAt({ x, y }, agents, roads);
      const flowVolume = calculateFlowVolumeAt({ x, y }, trafficData);

      if (density > 0) {
        densityPoints.push({
          position: { x, y },
          density,
          flow_volume: flowVolume,
          peak_hours: [8, 9, 17, 18], // Assume rush hours
        });
      }
    }
  }

  return densityPoints.sort((a, b) => b.density - a.density);
}

function calculateBounds(roads: any[]) {
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  roads.forEach(road => {
    road.path?.forEach((point: any) => {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    });
  });

  return { minX, minY, maxX, maxY };
}

function calculateTrafficDensityAt(
  position: { x: number; y: number },
  agents: any[],
  roads: any[]
): number {
  const searchRadius = 100; // 100m radius
  let density = 0;

  // Count agents within radius
  agents.forEach(agent => {
    const distance = Math.sqrt(
      Math.pow(agent.position.x - position.x, 2) +
      Math.pow(agent.position.y - position.y, 2)
    );

    if (distance <= searchRadius) {
      density += 1;
    }
  });

  // Weight by nearby road capacity
  roads.forEach(road => {
    const roadDistance = distanceToRoad(position, road.path || []);
    if (roadDistance <= searchRadius) {
      const weight = 1 - (roadDistance / searchRadius);
      density += weight * (road.lanes || 2) * 0.5;
    }
  });

  return density;
}

function calculateFlowVolumeAt(
  position: { x: number; y: number },
  trafficData: TrafficData
): number {
  // Aggregate flow from nearby congestion points
  let flowVolume = 0;

  trafficData.congestion_points?.forEach(point => {
    const distance = Math.sqrt(
      Math.pow(point.position.x - position.x, 2) +
      Math.pow(point.position.y - position.y, 2)
    );

    if (distance <= 300) { // 300m influence radius
      flowVolume += point.severity * (1 - distance / 300);
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
      roadPath[i],
      roadPath[i + 1]
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

  const t = Math.max(0, Math.min(1,
    ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (dx * dx + dy * dy)
  ));

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
    .slice(0, 50) // Top 50 traffic points
    .filter(point => point.density > 5); // Minimum density threshold

  for (const point of sortedPoints) {
    // Check distance from existing stations
    const tooClose = existingStations.some(station => {
      const distance = Math.sqrt(
        Math.pow(station.position.x - point.position.x, 2) +
        Math.pow(station.position.y - point.position.y, 2)
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
    road.path?.forEach((point: any) => {
      const distance = Math.sqrt(
        Math.pow(point.x - position.x, 2) +
        Math.pow(point.y - position.y, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = { x: point.x, y: point.y };
      }
    });
  });

  return nearestPoint;
}