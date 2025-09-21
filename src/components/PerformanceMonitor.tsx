import React from 'react';
import { DraggablePanel } from './DraggablePanel';

interface PerformanceMetrics {
  fps: number;
  tps: number;
  memoryUsage: number;
  agentCount: number;
  simulationTime: number;
  seed: number;
}

interface PerformanceMonitorProps {
  metrics: PerformanceMetrics;
  onClose: () => void;
}

export function PerformanceMonitor({ metrics, onClose }: PerformanceMonitorProps) {
  return (
    <DraggablePanel
      title="📊 Performance Monitor"
      defaultPosition={{ x: window.innerWidth - 250, y: 80 }}
      defaultSize={{ width: 220, height: 280 }}
      isCollapsible={true}
      initiallyCollapsed={true}
      storageKey="performance-monitor"
      panelType="performance"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

        {/* Performance Metrics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={metricRowStyle}>
            <span style={labelStyle}>FPS:</span>
            <span style={getValueStyle(metrics.fps, 55, 30)}>{metrics.fps}</span>
          </div>
          <div style={metricRowStyle}>
            <span style={labelStyle}>TPS:</span>
            <span style={getValueStyle(metrics.tps, 55, 30)}>{metrics.tps}</span>
          </div>
          <div style={metricRowStyle}>
            <span style={labelStyle}>Memory:</span>
            <span style={valueStyle}>{metrics.memoryUsage.toFixed(1)} KB</span>
          </div>
          <div style={metricRowStyle}>
            <span style={labelStyle}>Agents:</span>
            <span style={valueStyle}>{metrics.agentCount}</span>
          </div>
          <div style={metricRowStyle}>
            <span style={labelStyle}>Time:</span>
            <span style={valueStyle}>{metrics.simulationTime.toFixed(1)}h</span>
          </div>
          <div style={metricRowStyle}>
            <span style={labelStyle}>Seed:</span>
            <span style={valueStyle}>{metrics.seed}</span>
          </div>
        </div>

        {/* Controls */}
        <div style={{
          borderTop: '1px solid var(--border-color)',
          paddingTop: '0.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <button
            onClick={onClose}
            className="button button-secondary"
            style={{ width: '100%', padding: '0.4rem', fontSize: '0.75rem' }}
          >
            Hide Monitor
          </button>
          <div style={{
            fontSize: '0.7rem',
            color: 'var(--text-secondary)',
            textAlign: 'center',
            fontStyle: 'italic'
          }}>
            Press Ctrl+P to toggle
          </div>
        </div>

      </div>
    </DraggablePanel>
  );
}

// Helper function to get colored value style based on thresholds
function getValueStyle(value: number, goodThreshold: number, badThreshold: number, inverse = false) {
  const base = { ...valueStyle };

  if (inverse) {
    if (value <= goodThreshold) base.color = '#4ade80'; // green
    else if (value <= badThreshold) base.color = '#fbbf24'; // yellow
    else base.color = '#f87171'; // red
  } else {
    if (value >= goodThreshold) base.color = '#4ade80'; // green
    else if (value >= badThreshold) base.color = '#fbbf24'; // yellow
    else base.color = '#f87171'; // red
  }

  return base;
}

const metricRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const labelStyle: React.CSSProperties = {
  color: 'var(--text-secondary)',
  fontSize: '0.75rem',
  fontWeight: 500,
};

const valueStyle: React.CSSProperties = {
  fontWeight: 'bold',
  fontSize: '0.75rem',
  textAlign: 'right',
  color: 'var(--text-primary)',
};