import React, { useState, useCallback } from 'react';
import { useSimulationContext } from '../contexts/SimulationContext';
import { OptimizationConfig, SolverProgress } from '../types/optimization';

interface OptimizationPanelProps {
  onOptimize: (config: OptimizationConfig) => void;
  isOptimizing: boolean;
  progress?: SolverProgress;
}

export function OptimizationPanel({ onOptimize, isOptimizing, progress }: OptimizationPanelProps) {
  const { state } = useSimulationContext();
  const [config, setConfig] = useState<OptimizationConfig>({
    max_stations: 5,
    max_budget: 500000,
    coverage_radius: 1000,
    min_traffic_threshold: 2,
    cost_per_station: 100000,
    weight_coverage: 1.0,
    weight_cost: 0.3,
  });

  const handleOptimize = useCallback(() => {
    if (!state.isInitialized || isOptimizing) return;
    onOptimize(config);
  }, [config, onOptimize, state.isInitialized, isOptimizing]);

  const updateConfig = (key: keyof OptimizationConfig, value: number) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
      <h3 className="toolbar-title">⚡ EV Network Optimization</h3>

      {!isOptimizing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="control-group">
            <label className="control-label">
              Max Stations: {config.max_stations}
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={config.max_stations}
              onChange={(e) => updateConfig('max_stations', parseInt(e.target.value))}
              className="speed-slider"
            />
          </div>

          <div className="control-group">
            <label className="control-label">
              Coverage Radius: {(config.coverage_radius / 1000).toFixed(1)}km
            </label>
            <input
              type="range"
              min="500"
              max="2000"
              step="100"
              value={config.coverage_radius}
              onChange={(e) => updateConfig('coverage_radius', parseInt(e.target.value))}
              className="speed-slider"
            />
          </div>

          <div className="control-group">
            <label className="control-label">
              Budget: ${(config.max_budget / 1000).toFixed(0)}k
            </label>
            <input
              type="range"
              min="100000"
              max="1000000"
              step="50000"
              value={config.max_budget}
              onChange={(e) => updateConfig('max_budget', parseInt(e.target.value))}
              className="speed-slider"
            />
          </div>

          <div className="control-group">
            <label className="control-label">
              Coverage Weight: {config.weight_coverage.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.1"
              max="2.0"
              step="0.1"
              value={config.weight_coverage}
              onChange={(e) => updateConfig('weight_coverage', parseFloat(e.target.value))}
              className="speed-slider"
            />
          </div>

          <div className="control-group">
            <label className="control-label">
              Cost Weight: {config.weight_cost.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.1"
              value={config.weight_cost}
              onChange={(e) => updateConfig('weight_cost', parseFloat(e.target.value))}
              className="speed-slider"
            />
          </div>

          <button
            className="button button-primary"
            onClick={handleOptimize}
            disabled={!state.isInitialized || state.agents.length === 0}
            style={{
              fontSize: '1rem',
              padding: '0.75rem 1rem',
              background: 'linear-gradient(45deg, #FF6B35, #F7931E)',
              border: 'none',
              borderRadius: 'var(--border-radius)',
              color: 'white',
              fontWeight: 600,
            }}
          >
            🚀 Optimize Network
          </button>

          {state.agents.length === 0 && (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Start the simulation to generate traffic data for optimization
            </p>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 1rem' }}></div>
          <h4 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>
            {progress?.phase === 'preparing' && '🔍 Analyzing Traffic'}
            {progress?.phase === 'solving' && '🧮 Optimizing Locations'}
            {progress?.phase === 'processing' && '📊 Processing Results'}
            {progress?.phase === 'complete' && '✅ Complete!'}
          </h4>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
            {progress?.message}
          </p>
          <div className="loading-progress" style={{ marginTop: '1rem' }}>
            <div
              className="loading-progress-bar"
              style={{ width: `${progress?.progress || 0}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}