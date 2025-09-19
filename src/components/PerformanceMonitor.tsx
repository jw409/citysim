import React from 'react';

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
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span style={titleStyle}>Performance Monitor</span>
        <button onClick={onClose} style={closeButtonStyle}>×</button>
      </div>
      <div style={metricsStyle}>
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
      <div style={hintStyle}>
        Press Ctrl+P to toggle this monitor
      </div>
    </div>
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

const containerStyle: React.CSSProperties = {
  position: 'fixed',
  top: '10px',
  right: '10px',
  backgroundColor: 'rgba(0, 0, 0, 0.85)',
  color: 'white',
  padding: '12px',
  borderRadius: '6px',
  fontFamily: 'Monaco, "Lucida Console", monospace',
  fontSize: '12px',
  minWidth: '200px',
  zIndex: 1000,
  border: '1px solid rgba(255, 255, 255, 0.2)',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '8px',
  paddingBottom: '4px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
};

const titleStyle: React.CSSProperties = {
  fontWeight: 'bold',
  fontSize: '11px',
  color: 'rgba(255, 255, 255, 0.9)',
};

const closeButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'rgba(255, 255, 255, 0.7)',
  fontSize: '16px',
  cursor: 'pointer',
  padding: '0',
  lineHeight: '1',
  width: '16px',
  height: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const metricsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
};

const metricRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const labelStyle: React.CSSProperties = {
  color: 'rgba(255, 255, 255, 0.8)',
  fontSize: '11px',
};

const valueStyle: React.CSSProperties = {
  fontWeight: 'bold',
  fontSize: '11px',
  textAlign: 'right',
};

const hintStyle: React.CSSProperties = {
  marginTop: '6px',
  paddingTop: '4px',
  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  fontSize: '9px',
  color: 'rgba(255, 255, 255, 0.5)',
  textAlign: 'center',
};