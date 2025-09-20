import React, { useEffect, useState, useCallback } from 'react';
import { SimulationProvider } from './contexts/SimulationContext';
import { TerrainProvider } from './contexts/TerrainContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingScreen } from './components/LoadingScreen';
import { StatusBar } from './components/StatusBar';
import { Toolbar } from './components/Toolbar';
import { ControlPanel } from './components/ControlPanel';
import { CityVisualization } from './components/CityVisualization';
import { OptimizationPanel } from './components/OptimizationPanel';
import { OptimizationResults } from './components/OptimizationResults';
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
  const [showPerformance, setShowPerformance] = useState(true);
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
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState<SolverProgress>();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
        event.preventDefault();
        setShowPerformance(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Add optimization handler
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

      <StatusBar />

      <div className="app" style={{ paddingTop: '60px' }}>
        <header className="app-header" style={{ height: '50px', padding: '0.5rem 1.5rem' }}>
          <h1 className="app-title" style={{ fontSize: '1.25rem' }}>UrbanSynth</h1>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            City Simulation Platform
          </div>
        </header>

        <main className="app-main">
          <div className="visualization-container">
            <CityVisualization
              optimizationResult={optimizationResult}
              onStart={start}
              onPause={pause}
              onSetSpeed={setSpeed}
              isInitialized={state.isInitialized}
              showPerformance={showPerformance}
              onTogglePerformance={() => setShowPerformance(prev => !prev)}
            />
          </div>

          <aside className="sidebar">
            <Toolbar />
            <ControlPanel />
            <OptimizationPanel
              onOptimize={handleOptimize}
              isOptimizing={isOptimizing}
              progress={optimizationProgress}
            />
            <OptimizationResults
              result={optimizationResult}
              onClear={() => setOptimizationResult(null)}
            />

            <div className="stats-panel">
              <h3 className="toolbar-title">Statistics</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-label">Total Agents</div>
                  <div className="stat-value">{state.stats.totalAgents}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Active</div>
                  <div className="stat-value">{state.stats.activeAgents}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Avg Speed</div>
                  <div className="stat-value">{state.stats.averageSpeed.toFixed(1)}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Congestion</div>
                  <div className="stat-value">{(state.stats.congestionLevel * 100).toFixed(0)}%</div>
                </div>
              </div>
            </div>
          </aside>
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