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

  const getSolutionStatusIcon = (status: string) => {
    switch (status) {
      case 'OPTIMAL':
        return '🌟';
      case 'FEASIBLE':
        return '✅';
      case 'INFEASIBLE':
        return '❌';
      default:
        return '⚠️';
    }
  };

  return (
    <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
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
            {getSolutionStatusIcon(result.solution_status)} {result.solution_status}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Objective Score</div>
          <div className="stat-value">{result.objective_value.toFixed(2)}</div>
        </div>
      </div>

      <div
        style={{
          marginTop: '1rem',
          padding: '0.75rem',
          background: 'var(--background-color)',
          borderRadius: 'var(--border-radius)',
        }}
      >
        <h4 style={{ fontSize: '0.875rem', margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>
          📍 Station Locations
        </h4>
        <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
          {result.stations.map((station, index) => (
            <div
              key={station.id}
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                padding: '0.25rem 0',
                borderBottom:
                  index < result.stations.length - 1 ? '1px solid var(--border-color)' : 'none',
              }}
            >
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>
                  <strong>{station.id.replace('station_', 'Station ')}</strong>
                </span>
                <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                  ({station.position.x.toFixed(0)}, {station.position.y.toFixed(0)})
                </span>
              </div>
              <div style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: '0.125rem' }}>
                Coverage: {(station.coverage_radius / 1000).toFixed(1)}km • Capacity:{' '}
                {station.capacity} ports • Traffic: {station.traffic_coverage.toFixed(1)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {result.coverage_map.length > 0 && (
        <div
          style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: 'var(--background-color)',
            borderRadius: 'var(--border-radius)',
          }}
        >
          <h4 style={{ fontSize: '0.875rem', margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>
            🗺️ Coverage Summary
          </h4>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <div
              style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}
            >
              <span>Total Coverage Areas:</span>
              <strong>{result.coverage_map.length}</strong>
            </div>
            <div
              style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}
            >
              <span>Average Coverage Radius:</span>
              <strong>
                {(
                  result.coverage_map.reduce((sum, area) => sum + area.radius, 0) /
                  result.coverage_map.length /
                  1000
                ).toFixed(1)}
                km
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Total Traffic Covered:</span>
              <strong>
                {result.coverage_map
                  .reduce((sum, area) => sum + area.traffic_covered, 0)
                  .toFixed(1)}
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
