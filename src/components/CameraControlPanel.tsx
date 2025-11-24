import React, { useState } from 'react';
import { DraggablePanel } from './DraggablePanel';
import { useCamera } from '../hooks/useCamera';

interface CameraControlPanelProps {
  camera: ReturnType<typeof useCamera>;
  showZones: boolean;
  onToggleZones: () => void;
}

export function CameraControlPanel({ camera, showZones, onToggleZones }: CameraControlPanelProps) {
  return (
    <DraggablePanel
      title="📷 Camera Controls"
      defaultPosition={{ x: 20, y: window.innerHeight - 200 }}
      defaultSize={{ width: 240, height: 380 }}
      isCollapsible={true}
      initiallyCollapsed={true}
      storageKey="camera-controls"
      panelType="camera"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* View Controls */}
        <div className="control-group">
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 600 }}>
            View Options
          </h4>
          <label
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            <input
              type="checkbox"
              checked={showZones}
              onChange={onToggleZones}
              style={{ marginRight: '0.5rem' }}
            />
            Show Zones
          </label>
        </div>

        {/* Camera Presets */}
        <div className="control-group">
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 600 }}>
            View Presets
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button
              onClick={camera.presets.overview}
              className="button button-secondary"
              style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }}
            >
              🌍 Overview
            </button>
            <button
              onClick={camera.presets.street}
              className="button button-secondary"
              style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }}
            >
              🚶 Street
            </button>
            <button
              onClick={camera.presets.aerial}
              className="button button-secondary"
              style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }}
            >
              🚁 Aerial
            </button>
            <button
              onClick={camera.presets.isometric}
              className="button button-secondary"
              style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }}
            >
              📐 Isometric
            </button>
          </div>
        </div>

        {/* Follow Mode */}
        <div className="control-group">
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 600 }}>
            Follow Mode
          </h4>
          {camera.controls.followTarget ? (
            <div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--success-color)',
                  marginBottom: '0.5rem',
                  padding: '0.25rem',
                  background: 'var(--background-color)',
                  borderRadius: '4px',
                  border: '1px solid var(--success-color)',
                }}
              >
                📍 Following: {camera.controls.followTarget}
              </div>
              <button
                onClick={camera.stopFollowing}
                className="button button-secondary"
                style={{ width: '100%', padding: '0.4rem', fontSize: '0.75rem' }}
              >
                Stop Following
              </button>
            </div>
          ) : (
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                fontStyle: 'italic',
                padding: '0.5rem',
                background: 'var(--background-color)',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
              }}
            >
              Click an agent to follow
            </div>
          )}
        </div>

        {/* Camera Status */}
        <div className="control-group">
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 600 }}>
            Current View
          </h4>
          <div
            style={{
              fontSize: '0.7rem',
              color: 'var(--text-secondary)',
              background: 'var(--background-color)',
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid var(--border-color)',
            }}
          >
            <div>
              <strong>Zoom:</strong> {camera.viewState?.zoom?.toFixed?.(1) ?? '12.0'}
            </div>
            <div>
              <strong>Pitch:</strong> {camera.viewState?.pitch?.toFixed?.(0) ?? '45'}°
            </div>
            <div>
              <strong>Bearing:</strong> {camera.viewState?.bearing?.toFixed?.(0) ?? '0'}°
            </div>
            <div>
              <strong>Position:</strong> [{camera.viewState?.longitude?.toFixed?.(3) ?? '-74.006'},{' '}
              {camera.viewState?.latitude?.toFixed?.(3) ?? '40.713'}]
            </div>
          </div>
        </div>

        {/* Controls Help */}
        <div className="control-group">
          <details style={{ fontSize: '0.7rem' }}>
            <summary
              style={{
                cursor: 'pointer',
                fontWeight: 600,
                marginBottom: '0.5rem',
                color: 'var(--text-primary)',
              }}
            >
              🎮 Controls Help
            </summary>
            <div
              style={{
                color: 'var(--text-secondary)',
                lineHeight: 1.4,
                padding: '0.5rem',
                background: 'var(--background-color)',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
              }}
            >
              <div>
                <strong>Mouse:</strong>
              </div>
              <div>• Left drag: Pan</div>
              <div>• Right drag: Rotate</div>
              <div>• Scroll: Zoom</div>
              <div>• Click agent: Follow</div>
              <div style={{ marginTop: '0.5rem' }}>
                <strong>Keyboard:</strong>
              </div>
              <div>• 1,2,3,4: Presets</div>
              <div>• Z: Toggle zones</div>
              <div>• F: Toggle 3D/2D mode</div>
              <div>• ESC: Stop following</div>
            </div>
          </details>
        </div>
      </div>
    </DraggablePanel>
  );
}
