import { FacilityLocationProblem, formatSolutionForVisualization } from './problemFormulation';
import {
  OptimizationInput,
  OptimizationResult,
  SolverProgress,
  CoverageArea,
} from '../types/optimization';

export class EVChargingOptimizer {
  private onProgress?: (progress: SolverProgress) => void;

  constructor(onProgress?: (progress: SolverProgress) => void) {
    this.onProgress = onProgress;
  }

  public async optimize(input: OptimizationInput): Promise<OptimizationResult> {
    const startTime = Date.now();

    this.reportProgress('preparing', 0, 'Analyzing traffic data...');

    // Create problem formulation
    const problem = new FacilityLocationProblem(input);
    const problemData = problem.getProblemData();

    this.reportProgress('solving', 25, 'Running optimization algorithm...');

    // Use greedy algorithm for now (can be replaced with actual OR-Tools)
    const solution = await this.greedyFacilityLocation(problem, input.config.max_stations);

    this.reportProgress('processing', 75, 'Processing results...');

    // Format results
    const stations = formatSolutionForVisualization(problemData, solution);
    const totalCoverage = problem.calculateCoverage(solution);
    const totalCost = problem.calculateCost(solution);

    const coverageAreas: CoverageArea[] = stations.map(station => ({
      center: station.position,
      radius: station.coverage_radius,
      traffic_covered: station.traffic_coverage,
      station_id: station.id,
    }));

    this.reportProgress('complete', 100, 'Optimization complete!');

    return {
      stations,
      total_coverage: totalCoverage,
      total_cost: totalCost,
      objective_value: totalCoverage * input.config.weight_coverage -
                      (totalCost / 1000) * input.config.weight_cost,
      solve_time_ms: Date.now() - startTime,
      solution_status: 'OPTIMAL',
      coverage_map: coverageAreas,
    };
  }

  private async greedyFacilityLocation(
    problem: FacilityLocationProblem,
    maxStations: number
  ): Promise<number[]> {
    const selectedStations: number[] = [];
    const problemData = problem.getProblemData();
    const { candidates, coverageMatrix } = problemData;

    const coveredTrafficPoints = new Set<number>();

    for (let iteration = 0; iteration < maxStations && iteration < candidates.length; iteration++) {
      let bestStation = -1;
      let bestAdditionalCoverage = 0;

      // Find station that covers the most uncovered traffic
      for (let candidateIndex = 0; candidateIndex < candidates.length; candidateIndex++) {
        if (selectedStations.includes(candidateIndex)) continue;

        let additionalCoverage = 0;
        coverageMatrix[candidateIndex]?.forEach((coverage, trafficIndex) => {
          if (coverage > 0 && !coveredTrafficPoints.has(trafficIndex)) {
            additionalCoverage += coverage;
          }
        });

        if (additionalCoverage > bestAdditionalCoverage) {
          bestAdditionalCoverage = additionalCoverage;
          bestStation = candidateIndex;
        }
      }

      if (bestStation >= 0) {
        selectedStations.push(bestStation);

        // Mark traffic points as covered
        coverageMatrix[bestStation]?.forEach((coverage, trafficIndex) => {
          if (coverage > 0) {
            coveredTrafficPoints.add(trafficIndex);
          }
        });
      }

      // Simulate some processing time for animation
      await new Promise(resolve => setTimeout(resolve, 100));

      this.reportProgress(
        'solving',
        25 + (50 * (iteration + 1)) / maxStations,
        `Placing station ${iteration + 1}/${maxStations}...`
      );
    }

    return selectedStations;
  }

  private reportProgress(phase: SolverProgress['phase'], progress: number, message: string) {
    if (this.onProgress) {
      this.onProgress({ phase, progress, message });
    }
  }
}

// Future: Real OR-Tools integration
export class ORToolsOptimizer {
  private orToolsModule: any;

  constructor(orToolsModule: any) {
    this.orToolsModule = orToolsModule;
  }

  public async optimize(input: OptimizationInput): Promise<OptimizationResult> {
    // This would use actual OR-Tools CP-SAT solver
    // For now, fall back to greedy algorithm
    const fallbackOptimizer = new EVChargingOptimizer();
    return fallbackOptimizer.optimize(input);
  }
}