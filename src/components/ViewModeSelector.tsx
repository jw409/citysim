import React from 'react';
import { ViewMode } from '../hooks/useCamera';

interface ViewModeSelectorProps {
  currentMode: ViewMode;
  followTarget: string | null;
  followDistance: number;
  cameraLag: number;
  onModeChange: (mode: ViewMode) => void;
  onToggleMode: () => void;
  onDistanceChange: (distance: number) => void;
  onLagChange: (lag: number) => void;
}

export function ViewModeSelector({
  currentMode,
  followTarget,
  followDistance,
  cameraLag,
  onModeChange,
  onToggleMode,
  onDistanceChange,
  onLagChange,
}: ViewModeSelectorProps) {
  const modes = [
    { value: 'free', label: '🎮 Free Camera', description: 'Manual control' },
    { value: 'third-person', label: '🎬 Third Person', description: 'Follow behind agent' },
    { value: 'first-person', label: '👁️ First Person', description: 'Agent\'s perspective' },
  ] as const;

  const isFollowing = !!followTarget;

  return (
    <div
      style={{
        position: 'absolute',
        top: 10,
        right: 250, // Position to the left of planetary controls
        background: 'rgba(0, 0, 0, 0.85)',
        color: 'white',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '12px',
        minWidth: '220px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 'bold' }}>
        📹 View Mode
      </h4>

      {/* Mode Selection */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ marginBottom: '8px', fontSize: '11px', color: '#ccc' }}>
          Camera Mode:
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {modes.map((mode) => (
            <button
              key={mode.value}
              onClick={() => onModeChange(mode.value)}
              disabled={mode.value !== 'free' && !isFollowing}
              style={{
                padding: '6px 8px',
                fontSize: '11px',
                backgroundColor: currentMode === mode.value ? '#4CAF50' :
                  (mode.value !== 'free' && !isFollowing) ? '#333' : '#555',
                color: (mode.value !== 'free' && !isFollowing) ? '#666' : 'white',
                border: currentMode === mode.value ? '1px solid #4CAF50' : '1px solid #777',
                borderRadius: '4px',
                cursor: (mode.value !== 'free' && !isFollowing) ? 'not-allowed' : 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              <span>{mode.label}</span>
              {currentMode === mode.value && <span>✓</span>}
            </button>
          ))}
        </div>

        {!isFollowing && (
          <div style={{
            fontSize: '10px',
            color: '#ff9800',
            marginTop: '6px',
            padding: '4px',
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
            borderRadius: '3px'
          }}>
            ⚠️ Click an agent to enable follow modes
          </div>
        )}
      </div>

      {/* Quick Toggle */}
      {isFollowing && (
        <div style={{ marginBottom: '12px' }}>
          <button
            onClick={onToggleMode}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '11px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: '1px solid #2196F3',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            🔄 Toggle View (V)
          </button>
        </div>
      )}

      {/* Third-Person Controls */}
      {isFollowing && currentMode === 'third-person' && (
        <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px' }}>
          <div style={{ marginBottom: '6px', fontSize: '11px', fontWeight: 'bold' }}>
            Third-Person Settings:
          </div>

          {/* Follow Distance */}
          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontSize: '10px', color: '#ccc', display: 'block', marginBottom: '4px' }}>
              Distance: {followDistance.toFixed(1)}m
            </label>
            <input
              type="range"
              min="5"
              max="100"
              step="2.5"
              value={followDistance}
              onChange={(e) => onDistanceChange(parseFloat(e.target.value))}
              style={{
                width: '100%',
                height: '4px',
                backgroundColor: '#333',
                outline: 'none',
                borderRadius: '2px',
                cursor: 'pointer',
              }}
            />
          </div>

          {/* Camera Lag */}
          <div>
            <label style={{ fontSize: '10px', color: '#ccc', display: 'block', marginBottom: '4px' }}>
              Smoothness: {(cameraLag * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0.01"
              max="0.5"
              step="0.01"
              value={cameraLag}
              onChange={(e) => onLagChange(parseFloat(e.target.value))}
              style={{
                width: '100%',
                height: '4px',
                backgroundColor: '#333',
                outline: 'none',
                borderRadius: '2px',
                cursor: 'pointer',
              }}
            />
          </div>
        </div>
      )}

      {/* Current Status */}
      <div style={{
        fontSize: '10px',
        color: '#ccc',
        marginTop: '8px',
        borderTop: '1px solid #444',
        paddingTop: '8px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Status:</span>
          <span style={{
            color: isFollowing ? '#4CAF50' : '#999',
            fontWeight: 'bold'
          }}>
            {isFollowing ? `Following ${followTarget}` : 'Free camera'}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
          <span>Mode:</span>
          <span style={{ color: '#2196F3', fontWeight: 'bold' }}>
            {modes.find(m => m.value === currentMode)?.label.split(' ')[1] || currentMode}
          </span>
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div style={{
        fontSize: '9px',
        color: '#666',
        marginTop: '8px',
        borderTop: '1px solid #333',
        paddingTop: '6px'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Shortcuts:</div>
        <div>V: Toggle view mode</div>
        <div>F: First person</div>
        <div>T: Third person</div>
        <div>Mouse wheel: Adjust distance</div>
        <div>ESC: Stop following</div>
      </div>
    </div>
  );
}