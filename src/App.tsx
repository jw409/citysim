import { useEffect, useState } from 'react';
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
import { OptimizationResult } from './types/optimization';
import './styles/globals.css';
import './styles/components.css';

function AppContent() {
  const { state, dispatch } = useSimulationContext();
  const { initialize, start, pause, setSpeed } = useSimulation();
  const [showDebug, setShowDebug] = useState(true);
  const [optimizationResult] = useState<OptimizationResult | null>(null);

  // Performance adaptation system
  const {
    performanceState,
    isInitialized: perfInitialized,
    updateAgentCount,
    currentLevel,
  } = usePerformanceAdaptation({
    onProfileChange: profile => {
      console.log(`🎯 Performance adapted to ${currentLevel} profile:`, profile);
      dispatch({ type: 'UPDATE_PERFORMANCE_PROFILE', payload: profile });
    },
    onMetricsUpdate: metrics => {
      if (state.performance) {
        dispatch({
          type: 'SET_PERFORMANCE_STATE',
          payload: { ...state.performance, metrics },
        });
      }
    },
  });
  // Optimization state removed - will be re-added when optimization UI is implemented

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

  // Optimization handler removed - will be re-added when optimization UI is implemented

  return (
    <>
      <LoadingScreen isVisible={state.isLoading} message="Loading city simulation" />

      <div className="app">
        <main className="app-main">
          <div
            className="visualization-container"
            data-testid={state.isInitialized ? 'city-loaded' : 'city-loading'}
          >
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
            <DebugOverlay isVisible={showDebug} onToggle={() => setShowDebug(prev => !prev)} />
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
