import React from 'react';
import { OptimizationResult } from '../types/optimization';

interface OptimizationResultsProps {
  result: OptimizationResult | null;
  onClear: () => void;
}

export function OptimizationResults({ result, onClear }: OptimizationResultsProps) {
  if (!result) {
    return null;
  }

  return (
    <div className="panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="toolbar-title">📊 Optimization Results</h3>
        <button
          className="button button-secondary"
          onClick={onClear}
          style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
        >
          Clear
        </button>
      </div>

      <div style={{ padding: '1rem' }}>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Stations</div>
            <div className="stat-value">{result.stations.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Coverage</div>
            <div className="stat-value">{result.coverage_percentage.toFixed(1)}%</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Cost</div>
            <div className="stat-value">${(result.total_cost / 1000).toFixed(0)}k</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Objective</div>
            <div className="stat-value">{result.objective_value.toFixed(2)}</div>
          </div>
        </div>

        <div style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
          <strong>Station Locations:</strong>
          <div style={{ maxHeight: '150px', overflowY: 'auto', marginTop: '0.5rem' }}>
            {result.stations.map((station, index) => (
              <div key={station.id} style={{
                padding: '0.25rem',
                background: index % 2 === 0 ? 'rgba(0,0,0,0.05)' : 'transparent'
              }}>
                Station {index + 1}: ({station.longitude.toFixed(4)}, {station.latitude.toFixed(4)})
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}