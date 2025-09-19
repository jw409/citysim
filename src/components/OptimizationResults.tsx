import React from 'react';
import { OptimizationResult } from '../types/optimization';

interface OptimizationResultsProps {
  result: OptimizationResult | null;
  onClear: () => void;
}

export function OptimizationResults({ result, onClear }: OptimizationResultsProps) {
  if (!result) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 className="toolbar-title">🎯 Optimization Results</h3>
        <button
          className="button button-secondary"
          onClick={onClear}
          style={{ fontSize: '0.75rem', padding: '0.5rem' }}
        >
          Clear
        </button>
      </div>

      <div className="stats-grid" style={{ gap: '0.5rem' }}>
        <div className="stat-card">
          <div className="stat-label">Stations Placed</div>
          <div className="stat-value">{result.stations.length}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Traffic Coverage</div>
          <div className="stat-value">{formatPercentage(result.total_coverage)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Total Cost</div>
          <div className="stat-value">{formatCurrency(result.total_cost)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Solve Time</div>
          <div className="stat-value">{(result.solve_time_ms / 1000).toFixed(1)}s</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Solution Quality</div>
          <div className="stat-value">
            {result.solution_status === 'OPTIMAL' ? '🌟 Optimal' :
             result.solution_status === 'FEASIBLE' ? '✅ Good' : '❌ Poor'}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Objective Score</div>
          <div className="stat-value">{result.objective_value.toFixed(2)}</div>
        </div>
      </div>

      <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--background-color)', borderRadius: 'var(--border-radius)' }}>
        <h4 style={{ fontSize: '0.875rem', margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>
          📍 Station Locations
        </h4>
        <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
          {result.stations.map((station, index) => (
            <div key={station.id} style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              padding: '0.25rem 0',
              borderBottom: index < result.stations.length - 1 ? '1px solid var(--border-color)' : 'none'
            }}>
              Station {index + 1}: ({station.position.x.toFixed(0)}, {station.position.y.toFixed(0)})
              - Coverage: {formatPercentage(station.traffic_coverage / 100)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}