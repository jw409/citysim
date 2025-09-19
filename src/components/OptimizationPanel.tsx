import React, { useState } from 'react';
import { OptimizationConfig, SolverProgress } from '../types/optimization';

interface OptimizationPanelProps {
  onOptimize: (config: OptimizationConfig) => void;
  isOptimizing: boolean;
  progress?: SolverProgress;
}

export function OptimizationPanel({ onOptimize, isOptimizing, progress }: OptimizationPanelProps) {
  const [maxStations, setMaxStations] = useState(5);
  const [coverageRadius, setCoverageRadius] = useState(1000);
  const [budget, setBudget] = useState(500000);

  const handleOptimize = () => {
    onOptimize({
      maxStations,
      coverageRadius,
      budget
    });
  };

  return (
    <div className="panel">
      <h3 className="toolbar-title">⚡ EV Network Optimization</h3>

      <div style={{ padding: '1rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            Max Stations: {maxStations}
          </label>
          <input
            type="range"
            min="1"
            max="20"
            value={maxStations}
            onChange={(e) => setMaxStations(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            Coverage Radius: {(coverageRadius / 1000).toFixed(1)}km
          </label>
          <input
            type="range"
            min="500"
            max="5000"
            step="100"
            value={coverageRadius}
            onChange={(e) => setCoverageRadius(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            Budget: ${(budget / 1000).toFixed(0)}k
          </label>
          <input
            type="range"
            min="100000"
            max="2000000"
            step="50000"
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <button
          className="button button-primary"
          onClick={handleOptimize}
          disabled={isOptimizing}
          style={{ width: '100%', marginTop: '1rem' }}
        >
          {isOptimizing ? 'Optimizing...' : '🚀 Optimize Network'}
        </button>

        {progress && (
          <div style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
            <div>{progress.message}</div>
            <div style={{
              width: '100%',
              height: '4px',
              background: '#eee',
              borderRadius: '2px',
              marginTop: '0.5rem'
            }}>
              <div style={{
                width: `${progress.progress}%`,
                height: '100%',
                background: 'var(--primary-color)',
                borderRadius: '2px',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}