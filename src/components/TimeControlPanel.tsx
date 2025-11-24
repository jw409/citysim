import React from 'react';
import { DraggablePanel } from './DraggablePanel';
import { useSimulationContext } from '../contexts/SimulationContext';

interface TimeControlPanelProps {
  onStart: () => void;
  onPause: () => void;
  onSetSpeed: (speed: number) => void;
  isInitialized: boolean;
}

export function TimeControlPanel({
  onStart,
  onPause,
  onSetSpeed,
  isInitialized,
}: TimeControlPanelProps) {
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

  return (
    <DraggablePanel
      title="⏱️ Time Controls"
      defaultPosition={{ x: 280, y: window.innerHeight - 200 }}
      defaultSize={{ width: 280, height: 220 }}
      isCollapsible={true}
      initiallyCollapsed={true}
      storageKey="time-controls"
      panelType="time"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Status Display */}
        <div className="control-group">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.5rem',
              background: isInitialized
                ? state.isRunning
                  ? 'var(--success-color)'
                  : 'var(--warning-color)'
                : 'var(--border-color)',
              borderRadius: '4px',
              color: 'white',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            <span>
              {!isInitialized ? '⏳ Loading...' : state.isRunning ? '▶️ Running' : '⏸️ Paused'}
            </span>
            <span style={{ fontSize: '0.7rem' }}>{state.speed.toFixed(1)}x speed</span>
          </div>
        </div>

        {/* Play/Pause Control */}
        <div className="control-group">
          <button
            onClick={state.isRunning ? onPause : onStart}
            disabled={!isInitialized}
            className="button button-primary"
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '1rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              background: state.isRunning ? 'var(--warning-color)' : 'var(--success-color)',
              opacity: !isInitialized ? 0.5 : 1,
              cursor: !isInitialized ? 'not-allowed' : 'pointer',
            }}
          >
            {state.isRunning ? <>⏸️ PAUSE SIMULATION</> : <>▶️ START SIMULATION</>}
          </button>
        </div>

        {/* Speed Control */}
        <div className="control-group">
          <label className="control-label">Simulation Speed: {state.speed.toFixed(1)}x</label>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={state.speed}
            onChange={e => onSetSpeed(parseFloat(e.target.value))}
            className="speed-slider"
            style={{ width: '100%' }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.7rem',
              color: 'var(--text-secondary)',
              marginTop: '0.25rem',
            }}
          >
            <span>0.1x (Slow)</span>
            <span>1x (Normal)</span>
            <span>5x (Fast)</span>
          </div>
        </div>

        {/* Time Display */}
        <div className="control-group">
          <label className="control-label">Current Time</label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem',
              background: 'var(--background-color)',
              borderRadius: '4px',
              border: '1px solid var(--border-color)',
              fontSize: '1rem',
              fontWeight: 600,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '1.25rem', color: 'var(--primary-color)' }}>
                {formatTime(state.currentTime)}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                {getTimeDescription(state.currentTime)}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                Day {state.day + 1}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                {state.day === 0 ? 'First day' : `${state.day + 1} days`}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Speed Presets */}
        <div className="control-group">
          <label className="control-label" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>
            Quick Speed
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.25rem' }}>
            {[0.5, 1, 2, 5].map(speed => (
              <button
                key={speed}
                onClick={() => onSetSpeed(speed)}
                className="button button-secondary"
                style={{
                  padding: '0.25rem',
                  fontSize: '0.7rem',
                  background: state.speed === speed ? 'var(--primary-color)' : undefined,
                  color: state.speed === speed ? 'white' : undefined,
                }}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </DraggablePanel>
  );
}
