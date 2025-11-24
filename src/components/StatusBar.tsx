import React from 'react';
import { useSimulationContext } from '../contexts/SimulationContext';
import { Z_INDEX } from '../utils/zIndexManager';

export function StatusBar() {
  const { state } = useSimulationContext();

  // Format time display
  const formatTime = (time: number) => {
    const hours = Math.floor(time).toString().padStart(2, '0');
    const minutes = Math.floor((time - Math.floor(time)) * 60)
      .toString()
      .padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Get time of day description
  const getTimeDescription = (time: number) => {
    if (time >= 6 && time < 12) return 'Morning';
    if (time >= 12 && time < 18) return 'Afternoon';
    if (time >= 18 && time < 22) return 'Evening';
    return 'Night';
  };

  // Calculate FPS (simplified - in real app this would come from performance monitoring)
  const getFPS = () => {
    return state.isRunning ? 60 : 0;
  };

  return (
    <div style={containerStyle}>
      {/* Left section - Simulation status */}
      <div style={sectionStyle}>
        <div style={statusStyle}>
          <span style={labelStyle}>Status:</span>
          <span style={getStatusValueStyle(state.isInitialized, state.isRunning)}>
            {!state.isInitialized ? '⏳ Loading' : state.isRunning ? '▶️ Running' : '⏸️ Paused'}
          </span>
        </div>

        <div style={statusStyle}>
          <span style={labelStyle}>Speed:</span>
          <span style={valueStyle}>{state.speed.toFixed(1)}x</span>
        </div>
      </div>

      {/* Center section - Time and day */}
      <div style={{ ...sectionStyle, flex: 1, justifyContent: 'center' }}>
        <div style={{ ...statusStyle, marginRight: '1rem' }}>
          <span style={labelStyle}>Time:</span>
          <span style={valueStyle}>
            {formatTime(state.currentTime)} ({getTimeDescription(state.currentTime)})
          </span>
        </div>

        <div style={statusStyle}>
          <span style={labelStyle}>Day:</span>
          <span style={valueStyle}>{state.day + 1}</span>
        </div>
      </div>

      {/* Right section - Performance and agents */}
      <div style={sectionStyle}>
        <div style={statusStyle}>
          <span style={labelStyle}>Agents:</span>
          <span style={valueStyle}>
            {state.stats.activeAgents}/{state.stats.totalAgents}
          </span>
        </div>

        <div style={statusStyle}>
          <span style={labelStyle}>FPS:</span>
          <span style={getValueStyle(getFPS(), 55, 30)}>{getFPS()}</span>
        </div>

        <div style={statusStyle}>
          <span style={labelStyle}>Avg Speed:</span>
          <span style={valueStyle}>{state.stats.averageSpeed.toFixed(1)} km/h</span>
        </div>

        <div style={statusStyle}>
          <span style={labelStyle}>Congestion:</span>
          <span style={getCongestionStyle(state.stats.congestionLevel)}>
            {(state.stats.congestionLevel * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Error indicator */}
      {state.error && (
        <div style={errorStyle}>
          <span>⚠️ {state.error}</span>
        </div>
      )}
    </div>
  );
}

// Helper function for status color
function getStatusValueStyle(isInitialized: boolean, isRunning: boolean) {
  const base = { ...valueStyle };

  if (!isInitialized) {
    base.color = '#fbbf24'; // yellow for loading
  } else if (isRunning) {
    base.color = '#4ade80'; // green for running
  } else {
    base.color = '#6b7280'; // gray for paused
  }

  return base;
}

// Helper function for FPS color
function getValueStyle(value: number, goodThreshold: number, badThreshold: number) {
  const base = { ...valueStyle };

  if (value >= goodThreshold)
    base.color = '#4ade80'; // green
  else if (value >= badThreshold)
    base.color = '#fbbf24'; // yellow
  else base.color = '#f87171'; // red

  return base;
}

// Helper function for congestion color
function getCongestionStyle(congestion: number) {
  const base = { ...valueStyle };

  if (congestion < 0.3)
    base.color = '#4ade80'; // green
  else if (congestion < 0.7)
    base.color = '#fbbf24'; // yellow
  else base.color = '#f87171'; // red

  return base;
}

// Styles
const containerStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  height: '60px',
  background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(30, 30, 50, 0.95) 100%)',
  backdropFilter: 'blur(10px)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  display: 'flex',
  alignItems: 'center',
  padding: '0 1rem',
  zIndex: Z_INDEX.STATUS_BAR,
  fontFamily: 'Monaco, "Lucida Console", monospace',
  fontSize: '12px',
  color: 'white',
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
};

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
};

const statusStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.25rem',
};

const labelStyle: React.CSSProperties = {
  color: 'rgba(255, 255, 255, 0.7)',
  fontSize: '11px',
  fontWeight: 'normal',
};

const valueStyle: React.CSSProperties = {
  color: 'rgba(255, 255, 255, 0.95)',
  fontSize: '11px',
  fontWeight: 'bold',
};

const errorStyle: React.CSSProperties = {
  position: 'absolute',
  right: '1rem',
  background: 'rgba(239, 68, 68, 0.9)',
  color: 'white',
  padding: '0.25rem 0.5rem',
  borderRadius: '4px',
  fontSize: '10px',
  maxWidth: '300px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};
