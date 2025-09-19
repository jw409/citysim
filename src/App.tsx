import React, { useEffect, useState, useCallback } from 'react';
import { SimulationProvider } from './contexts/SimulationContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingScreen } from './components/LoadingScreen';
import { Toolbar } from './components/Toolbar';
import { ControlPanel } from './components/ControlPanel';
import { PerformanceMonitor } from './components/PerformanceMonitor';
import { CityVisualization } from './components/CityVisualization';
import { OptimizationPanel } from './components/OptimizationPanel';
import { OptimizationResults } from './components/OptimizationResults';
import { useSimulation } from './hooks/useSimulation';
import { useSimulationContext } from './contexts/SimulationContext';
import { EVChargingOptimizer } from './solver/evOptimization';
import { processTrafficData } from './utils/trafficAnalysis';
import { OptimizationResult, OptimizationConfig, SolverProgress } from './types/optimization';
import './styles/globals.css';
import './styles/components.css';

function AppContent() {
  const { state, dispatch } = useSimulationContext();
  const { initialize } = useSimulation();
  const [showPerformance, setShowPerformance] = useState(true);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState<SolverProgress>();

  useEffect(() => {
    initialize();
  }, [initialize]);

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

      <div className="app">
        <header className="app-header">
          <h1 className="app-title">UrbanSynth</h1>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {state.stats.totalAgents} agents
            </span>
            {state.error && (
              <span style={{ color: 'var(--error-color)', fontSize: '0.875rem' }}>
                Error: {state.error}
              </span>
            )}
          </div>
        </header>

        <main className="app-main">
          <div className="visualization-container">
            <CityVisualization optimizationResult={optimizationResult} />
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

      {showPerformance && (
        <PerformanceMonitor
          metrics={{
            fps: 60,
            tps: state.isRunning ? 60 : 0,
            memoryUsage: state.stats.totalAgents * 0.1,
            agentCount: state.stats.totalAgents,
            simulationTime: state.currentTime,
            seed: 0,
          }}
          onClose={() => setShowPerformance(false)}
        />
      )}
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <SimulationProvider>
        <AppContent />
      </SimulationProvider>
    </ErrorBoundary>
  );
}

export default App;