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

    this.reportProgress(
      'preparing',
      20,
      `Found ${problemData.candidates.length} candidate locations`
    );

    // Check if we have valid data
    if (problemData.candidates.length === 0) {
      throw new Error(
        'No suitable candidate locations found. Make sure the simulation is running with agents.'
      );
    }

    this.reportProgress('solving', 25, 'Running greedy optimization algorithm...');

    // Use greedy algorithm to select optimal stations
    const solution = await this.greedyFacilityLocation(problem, input.config.max_stations);

    this.reportProgress('processing', 75, 'Processing optimization results...');

    // Format results for visualization
    const stations = formatSolutionForVisualization(problemData, solution);
    const totalCoverage = problem.calculateCoverage(solution);
    const totalCost = problem.calculateCost(solution);
    const objectiveValue = problem.calculateObjectiveValue(solution);

    // Create coverage areas for visualization
    const coverageAreas: CoverageArea[] = stations.map(station => ({
      center: station.position,
      radius: station.coverage_radius,
      traffic_covered: station.traffic_coverage,
      station_id: station.id,
    }));

    this.reportProgress(
      'complete',
      100,
      `Optimization complete! Placed ${stations.length} stations`
    );

    return {
      stations,
      total_coverage: totalCoverage,
      total_cost: totalCost,
      objective_value: objectiveValue,
      solve_time_ms: Date.now() - startTime,
      solution_status: solution.length > 0 ? 'OPTIMAL' : 'INFEASIBLE',
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
      let bestObjectiveImprovement = -Infinity;

      // Find station that provides the best objective improvement
      for (let candidateIndex = 0; candidateIndex < candidates.length; candidateIndex++) {
        if (selectedStations.includes(candidateIndex)) continue;

        // Calculate additional coverage this station would provide
        let additionalCoverage = 0;
        const newCoveredPoints = new Set<number>();

        coverageMatrix[candidateIndex]?.forEach((coverage, trafficIndex) => {
          if (coverage > 0 && !coveredTrafficPoints.has(trafficIndex)) {
            additionalCoverage += coverage;
            newCoveredPoints.add(trafficIndex);
          }
        });

        // Calculate objective improvement (coverage benefit vs cost)
        const testSelection = [...selectedStations, candidateIndex];
        const newObjectiveValue = problem.calculateObjectiveValue(testSelection);
        const currentObjectiveValue =
          selectedStations.length > 0 ? problem.calculateObjectiveValue(selectedStations) : 0;
        const objectiveImprovement = newObjectiveValue - currentObjectiveValue;

        // Select based on objective improvement, with coverage as tiebreaker
        if (
          objectiveImprovement > bestObjectiveImprovement ||
          (Math.abs(objectiveImprovement - bestObjectiveImprovement) < 0.001 &&
            additionalCoverage > bestAdditionalCoverage)
        ) {
          bestObjectiveImprovement = objectiveImprovement;
          bestAdditionalCoverage = additionalCoverage;
          bestStation = candidateIndex;
        }
      }

      // If we found a beneficial station, add it
      if (bestStation >= 0 && bestObjectiveImprovement > 0) {
        selectedStations.push(bestStation);

        // Mark traffic points as covered
        coverageMatrix[bestStation]?.forEach((coverage, trafficIndex) => {
          if (coverage > 0) {
            coveredTrafficPoints.add(trafficIndex);
          }
        });

        // Report progress
        const progress = 25 + (50 * (iteration + 1)) / maxStations;
        this.reportProgress(
          'solving',
          progress,
          `Placed station ${iteration + 1}/${maxStations} at optimal location`
        );

        // Simulate some processing time for visual feedback
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        // No more beneficial stations found
        break;
      }
    }

    return selectedStations;
  }

  private reportProgress(phase: SolverProgress['phase'], progress: number, message: string) {
    if (this.onProgress) {
      this.onProgress({ phase, progress, message });
    }
  }
}

// Future: Real OR-Tools integration placeholder
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
