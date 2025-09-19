import React, { useEffect } from 'react';
import { SimulationProvider } from './contexts/SimulationContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingScreen } from './components/LoadingScreen';
import { Toolbar } from './components/Toolbar';
import { ControlPanel } from './components/ControlPanel';
import { PerformanceMonitor } from './components/PerformanceMonitor';
import { CityVisualization } from './components/CityVisualization';
import { useSimulation } from './hooks/useSimulation';
import { useSimulationContext } from './contexts/SimulationContext';
import './styles/globals.css';
import './styles/components.css';

function AppContent() {
  const { state } = useSimulationContext();
  const { initialize } = useSimulation();
  const [showPerformance, setShowPerformance] = React.useState(true);

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
            <CityVisualization />
          </div>

          <aside className="sidebar">
            <Toolbar />
            <ControlPanel />

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