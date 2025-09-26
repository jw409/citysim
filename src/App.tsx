import { useEffect, useState, useCallback } from 'react';
import { SimulationProvider } from './contexts/SimulationContext';
import { TerrainProvider } from './contexts/TerrainContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingScreen } from './components/LoadingScreen';
import { DebugOverlay } from './components/DebugOverlay';
import { ControlPanel } from './components/ControlPanel';
import { CityVisualization } from './components/CityVisualization';
import { useSimulation } from './hooks/useSimulation';
import { useSimulationContext } from './contexts/SimulationContext';
import { usePerformanceAdaptation } from './hooks/usePerformanceAdaptation';
import { EVChargingOptimizer } from './solver/evOptimization';
import { processTrafficData } from './utils/trafficAnalysis';
import { OptimizationResult, OptimizationConfig, SolverProgress } from './types/optimization';
import './styles/globals.css';
import './styles/components.css';

function AppContent() {
  const { state, dispatch } = useSimulationContext();
  const { initialize, start, pause, setSpeed } = useSimulation();
  const [showDebug, setShowDebug] = useState(true);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);

  // Performance adaptation system
  const {
    performanceState,
    isInitialized: perfInitialized,
    updateAgentCount,
    currentLevel
  } = usePerformanceAdaptation({
    onProfileChange: (profile) => {
      console.log(`🎯 Performance adapted to ${currentLevel} profile:`, profile);
      dispatch({ type: 'UPDATE_PERFORMANCE_PROFILE', payload: profile });
    },
    onMetricsUpdate: (metrics) => {
      if (state.performance) {
        dispatch({
          type: 'SET_PERFORMANCE_STATE',
          payload: { ...state.performance, metrics }
        });
      }
    }
  });
  // Optimization state - temporarily unused but kept for future implementation
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isOptimizing, setIsOptimizing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [optimizationProgress, setOptimizationProgress] = useState<SolverProgress>();

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Initialize performance state when performance system is ready
  useEffect(() => {
    if (perfInitialized && performanceState && !state.performance) {
      dispatch({ type: 'SET_PERFORMANCE_STATE', payload: performanceState });
    }
  }, [perfInitialized, performanceState, state.performance, dispatch]);

  // Sync agent count with performance system
  useEffect(() => {
    if (perfInitialized && state.agents.length > 0) {
      updateAgentCount(state.agents.length);
    }
  }, [state.agents.length, updateAgentCount, perfInitialized]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
        event.preventDefault();
        setShowDebug(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Add optimization handler - temporarily unused but kept for future implementation
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleOptimize = useCallback(async (config: OptimizationConfig) => {
    if (!state.cityModel || state.agents.length === 0) return;

    setIsOptimizing(true);
    setOptimizationProgress({ phase: 'preparing', progress: 0, message: 'Starting optimization...' });

    try {
      const trafficPoints = processTrafficData(
        {
          congestion_points: [],
          road_densities: {},
          poi_popularity: {},
          flow_matrix: []
        }, // Simplified traffic data
        state.cityModel.roads || [],
        state.agents
      );

      const optimizationInput = {
        traffic_data: trafficPoints,
        roads: state.cityModel.roads || [],
        pois: [],
        existing_stations: [],
        config,
      };

      const optimizer = new EVChargingOptimizer(setOptimizationProgress);
      const result = await optimizer.optimize(optimizationInput);

      setOptimizationResult(result);
    } catch (error) {
      console.error('Optimization failed:', error);
      dispatch({ type: 'SET_ERROR', payload: `Optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setIsOptimizing(false);
    }
  }, [state.cityModel, state.agents, dispatch]);

  return (
    <>
      <LoadingScreen
        isVisible={state.isLoading}
        message="Loading city simulation"
      />

      <div className="app">
        <main className="app-main">
          <div className="visualization-container" data-testid={state.isInitialized ? "city-loaded" : "city-loading"}>
            <CityVisualization
              optimizationResult={optimizationResult}
              onStart={start}
              onPause={pause}
              onSetSpeed={setSpeed}
              isInitialized={state.isInitialized}
              showPerformance={false}
              onTogglePerformance={() => {}}
            />

            {/* Simple time controls only */}
            <ControlPanel />

            {/* Debug panel with performance monitor integrated - visible by default */}
            <DebugOverlay
              isVisible={showDebug}
              onToggle={() => setShowDebug(prev => !prev)}
            />

          </div>
        </main>
      </div>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <TerrainProvider>
        <SimulationProvider>
          <AppContent />
        </SimulationProvider>
      </TerrainProvider>
    </ErrorBoundary>
  );
}

export default App;