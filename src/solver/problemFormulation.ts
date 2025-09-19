import {
  OptimizationInput,
  OptimizationConfig,
  ChargingStation,
  TrafficDensityPoint,
} from '../types/optimization';
import { generateCandidateLocations } from '../utils/trafficAnalysis';

export class FacilityLocationProblem {
  private input: OptimizationInput;
  private candidateLocations: { x: number; y: number }[];
  private coverageMatrix: number[][];

  constructor(input: OptimizationInput) {
    this.input = input;
    this.candidateLocations = this.generateCandidates();
    this.coverageMatrix = this.calculateCoverageMatrix();
  }

  private generateCandidates(): { x: number; y: number }[] {
    // Use the traffic analysis utility to generate candidate locations
    return generateCandidateLocations(
      this.input.traffic_data,
      this.input.roads,
      this.input.existing_stations
    );
  }

  private calculateCoverageMatrix(): number[][] {
    const { traffic_data, config } = this.input;
    const matrix: number[][] = [];

    // For each candidate location, calculate which traffic points it covers
    this.candidateLocations.forEach((candidate, i) => {
      matrix[i] = [];
      traffic_data.forEach((trafficPoint, j) => {
        const distance = Math.sqrt(
          Math.pow(candidate.x - trafficPoint.position.x, 2) +
          Math.pow(candidate.y - trafficPoint.position.y, 2)
        );

        if (distance <= config.coverage_radius) {
          // Coverage value is weighted by traffic density and flow
          matrix[i][j] = trafficPoint.density * trafficPoint.flow_volume;
        } else {
          matrix[i][j] = 0;
        }
      });
    });

    return matrix;
  }

  public getProblemData() {
    return {
      candidates: this.candidateLocations,
      coverageMatrix: this.coverageMatrix,
      trafficPoints: this.input.traffic_data,
      config: this.input.config,
    };
  }

  public calculateCoverage(selectedStations: number[]): number {
    const coveredTrafficPoints = new Set<number>();
    const { traffic_data } = this.input;

    selectedStations.forEach(stationIndex => {
      this.coverageMatrix[stationIndex]?.forEach((coverage, trafficIndex) => {
        if (coverage > 0) {
          coveredTrafficPoints.add(trafficIndex);
        }
      });
    });

    const totalTraffic = traffic_data.reduce((sum, point) => sum + point.density, 0);
    const coveredTraffic = Array.from(coveredTrafficPoints)
      .reduce((sum, index) => sum + traffic_data[index].density, 0);

    return totalTraffic > 0 ? coveredTraffic / totalTraffic : 0;
  }

  public calculateCost(selectedStations: number[]): number {
    return selectedStations.length * this.input.config.cost_per_station;
  }

  public calculateObjectiveValue(selectedStations: number[]): number {
    const coverage = this.calculateCoverage(selectedStations);
    const cost = this.calculateCost(selectedStations);
    const { weight_coverage, weight_cost } = this.input.config;

    // Maximize coverage, minimize cost
    return coverage * weight_coverage - (cost / 100000) * weight_cost;
  }

  public getCandidateCount(): number {
    return this.candidateLocations.length;
  }

  public getTrafficPointCount(): number {
    return this.input.traffic_data.length;
  }
}

export function formatSolutionForVisualization(
  problemData: any,
  selectedStations: number[]
): ChargingStation[] {
  return selectedStations.map((stationIndex, id) => {
    const position = problemData.candidates[stationIndex];
    const coverage = problemData.coverageMatrix[stationIndex] || [];
    const totalCoverage = coverage.reduce((sum: number, cov: number) => sum + cov, 0);

    // Calculate which POIs are covered (for future use)
    const coveredPOIs: string[] = [];

    return {
      id: `station_${id + 1}`,
      position,
      capacity: 4, // 4 charging ports per station
      cost: problemData.config.cost_per_station,
      coverage_radius: problemData.config.coverage_radius,
      traffic_coverage: totalCoverage,
      poi_ids_covered: coveredPOIs,
    };
  });
}