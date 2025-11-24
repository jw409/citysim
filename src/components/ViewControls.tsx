import React from 'react';

interface ViewControlsProps {
  onToggleZones: () => void;
  onToggleDayNight: () => void;
  onResetView: () => void;
  showZones: boolean;
  isNight: boolean;
}

export function ViewControls({
  onToggleZones,
  onToggleDayNight,
  onResetView,
  showZones,
  isNight,
}: ViewControlsProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        zIndex: 1000,
      }}
    >
      <button
        className="button button-secondary"
        onClick={onToggleZones}
        style={{ fontSize: '0.875rem' }}
      >
        {showZones ? '🔍 Hide Zones' : '🔍 Show Zones'}
      </button>

      <button
        className="button button-secondary"
        onClick={onToggleDayNight}
        style={{ fontSize: '0.875rem' }}
      >
        {isNight ? '☀️ Day Mode' : '🌙 Night Mode'}
      </button>

      <button
        className="button button-secondary"
        onClick={onResetView}
        style={{ fontSize: '0.875rem' }}
      >
        🎯 Reset View
      </button>
    </div>
  );
}
