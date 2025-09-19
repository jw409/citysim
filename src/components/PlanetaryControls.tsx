import React from 'react';

interface PlanetaryControlsProps {
  scale: number;
  timeOfDay: number;
  showAtmosphere: boolean;
  showClouds: boolean;
  showMoon: boolean;
  showSun: boolean;
  weatherIntensity: number;
  animateTime: boolean;
  onScaleChange: (scale: number) => void;
  onTimeChange: (time: number) => void;
  onAtmosphereToggle: (show: boolean) => void;
  onCloudsToggle: (show: boolean) => void;
  onMoonToggle: (show: boolean) => void;
  onSunToggle: (show: boolean) => void;
  onWeatherChange: (intensity: number) => void;
  onAnimateToggle: (animate: boolean) => void;
}

const scalePresets = [
  { label: 'City', value: 1, description: 'Local city view' },
  { label: 'Metro', value: 10, description: 'Metropolitan area' },
  { label: 'Region', value: 50, description: 'Regional view' },
  { label: 'Country', value: 200, description: 'Country scale' },
  { label: 'Continental', value: 1000, description: 'Continental view' },
  { label: 'Global', value: 5000, description: 'Planetary scale' },
  { label: 'Space', value: 10000, description: 'From space' },
];

const timePresets = [
  { label: 'Dawn', value: 5.5, description: '5:30 AM' },
  { label: 'Sunrise', value: 6.5, description: '6:30 AM' },
  { label: 'Morning', value: 9, description: '9:00 AM' },
  { label: 'Noon', value: 12, description: '12:00 PM' },
  { label: 'Afternoon', value: 15, description: '3:00 PM' },
  { label: 'Sunset', value: 17.5, description: '5:30 PM' },
  { label: 'Dusk', value: 18.5, description: '6:30 PM' },
  { label: 'Night', value: 22, description: '10:00 PM' },
  { label: 'Midnight', value: 0, description: '12:00 AM' },
];

function formatTime(time: number): string {
  const hours = Math.floor(time);
  const minutes = Math.floor((time - hours) * 60);
  const period = hours < 12 ? 'AM' : 'PM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

function getScaleDescription(scale: number): string {
  if (scale < 2) return 'City blocks and buildings';
  if (scale < 20) return 'City districts and suburbs';
  if (scale < 100) return 'Metropolitan area with countryside';
  if (scale < 500) return 'Regional view with multiple cities';
  if (scale < 2000) return 'Country or large state view';
  if (scale < 8000) return 'Continental view with weather patterns';
  return 'Planetary view from space';
}

export function PlanetaryControls({
  scale,
  timeOfDay,
  showAtmosphere,
  showClouds,
  showMoon,
  showSun,
  weatherIntensity,
  animateTime,
  onScaleChange,
  onTimeChange,
  onAtmosphereToggle,
  onCloudsToggle,
  onMoonToggle,
  onSunToggle,
  onWeatherChange,
  onAnimateToggle,
}: PlanetaryControlsProps) {
  const [isMinimized, setIsMinimized] = React.useState(false);

  return (
    <div
      style={{
        position: 'absolute',
        top: 10,
        right: 320, // Move it away from existing controls
        background: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        fontSize: '12px',
        minWidth: '280px',
        maxWidth: '300px',
        maxHeight: '85vh',
        overflowY: 'auto',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '0 0 15px 0',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          paddingBottom: '8px',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: '14px',
            color: '#fff',
          }}
        >
          🌍 Planetary Controls
        </h3>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          style={{
            background: 'none',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: 'white',
            borderRadius: '4px',
            padding: '2px 6px',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          {isMinimized ? '▼' : '▲'}
        </button>
      </div>

      {!isMinimized && (
        <>
          {/* Scale Controls */}
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                marginBottom: '8px',
                fontWeight: 'bold',
                color: '#4CAF50',
                fontSize: '13px',
              }}
            >
              Scale: {scale}x
            </div>
            <div
              style={{
                fontSize: '11px',
                color: '#ccc',
                marginBottom: '10px',
                fontStyle: 'italic',
              }}
            >
              {getScaleDescription(scale)}
            </div>

            <input
              type="range"
              min="1"
              max="10000"
              step="1"
              value={scale}
              onChange={e => onScaleChange(Number(e.target.value))}
              style={{
                width: '100%',
                marginBottom: '10px',
                accentColor: '#4CAF50',
              }}
            />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '4px',
                marginBottom: '5px',
              }}
            >
              {scalePresets.slice(0, 6).map(preset => (
                <button
                  key={preset.value}
                  onClick={() => onScaleChange(preset.value)}
                  style={{
                    padding: '4px 6px',
                    fontSize: '10px',
                    background: scale === preset.value ? '#4CAF50' : 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                  title={preset.description}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => onScaleChange(10000)}
              style={{
                padding: '4px 8px',
                fontSize: '10px',
                background: scale === 10000 ? '#4CAF50' : 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '4px',
                cursor: 'pointer',
                width: '100%',
              }}
              title="View from space"
            >
              🚀 Space View
            </button>
          </div>

          {/* Time of Day Controls */}
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <div
                style={{
                  fontWeight: 'bold',
                  color: '#FF9800',
                  fontSize: '13px',
                }}
              >
                Time: {formatTime(timeOfDay)}
              </div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  fontSize: '11px',
                }}
              >
                <input
                  type="checkbox"
                  checked={animateTime}
                  onChange={e => onAnimateToggle(e.target.checked)}
                  style={{ marginRight: '4px' }}
                />
                Animate
              </label>
            </div>

            <input
              type="range"
              min="0"
              max="24"
              step="0.1"
              value={timeOfDay}
              onChange={e => onTimeChange(Number(e.target.value))}
              style={{
                width: '100%',
                marginBottom: '8px',
                accentColor: '#FF9800',
              }}
              disabled={animateTime}
            />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '3px',
              }}
            >
              {timePresets.map(preset => (
                <button
                  key={preset.value}
                  onClick={() => onTimeChange(preset.value)}
                  style={{
                    padding: '3px 4px',
                    fontSize: '9px',
                    background:
                      Math.abs(timeOfDay - preset.value) < 0.5
                        ? '#FF9800'
                        : 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '3px',
                    cursor: 'pointer',
                  }}
                  title={preset.description}
                  disabled={animateTime}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Celestial Bodies */}
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                fontWeight: 'bold',
                color: '#2196F3',
                marginBottom: '8px',
                fontSize: '13px',
              }}
            >
              ☀️🌙 Celestial Bodies
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  fontSize: '11px',
                }}
              >
                <input
                  type="checkbox"
                  checked={showSun}
                  onChange={e => onSunToggle(e.target.checked)}
                  style={{ marginRight: '6px' }}
                />
                ☀️ Show Sun (with positioning)
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  fontSize: '11px',
                }}
              >
                <input
                  type="checkbox"
                  checked={showMoon}
                  onChange={e => onMoonToggle(e.target.checked)}
                  style={{ marginRight: '6px' }}
                />
                🌙 Show Moon (with phases)
              </label>
            </div>
          </div>

          {/* Atmospheric Effects */}
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                fontWeight: 'bold',
                color: '#9C27B0',
                marginBottom: '8px',
                fontSize: '13px',
              }}
            >
              🌫️ Atmospheric Effects
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  fontSize: '11px',
                }}
              >
                <input
                  type="checkbox"
                  checked={showAtmosphere}
                  onChange={e => onAtmosphereToggle(e.target.checked)}
                  style={{ marginRight: '6px' }}
                />
                🌅 Atmospheric Scattering & Dawn/Dusk
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  fontSize: '11px',
                }}
              >
                <input
                  type="checkbox"
                  checked={showClouds}
                  onChange={e => onCloudsToggle(e.target.checked)}
                  style={{ marginRight: '6px' }}
                />
                ☁️ Cloud Cover
              </label>

              <div style={{ marginTop: '8px' }}>
                <div
                  style={{
                    fontSize: '11px',
                    marginBottom: '4px',
                    color: showClouds ? '#ccc' : '#666',
                  }}
                >
                  Weather Intensity: {Math.round(weatherIntensity * 100)}%
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={weatherIntensity}
                  onChange={e => onWeatherChange(Number(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: '#9C27B0',
                    opacity: showClouds ? 1 : 0.5,
                  }}
                  disabled={!showClouds}
                />
              </div>
            </div>
          </div>

          {/* Performance Info */}
          <div
            style={{
              fontSize: '10px',
              color: '#666',
              marginTop: '15px',
              paddingTop: '10px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div style={{ marginBottom: '4px' }}>
              <strong>Performance Tips:</strong>
            </div>
            <div style={{ lineHeight: '1.4' }}>
              • High scales reduce detail for performance
              <br />
              • Atmospheric effects add visual impact
              <br />
              • Time animation shows lighting changes
              <br />• Global scale shows Earth curvature
            </div>
          </div>
        </>
      )}
    </div>
  );
}
