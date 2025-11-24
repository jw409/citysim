import React, { useState, useEffect } from 'react';
import { debugManager } from '../utils/debugUtils';
import { useSimulationContext } from '../contexts/SimulationContext';

interface DebugOverlayProps {
  isVisible: boolean;
  onToggle: () => void;
}

export function DebugOverlay({ isVisible, onToggle }: DebugOverlayProps) {
  const { state } = useSimulationContext();
  const [debugInfo, setDebugInfo] = useState(debugManager.getDebugInfo());
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'debug' | 'performance'>('performance');

  // Update debug info periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setDebugInfo(debugManager.getDebugInfo());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = debugManager.searchObjects(query);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleExportDebugData = () => {
    const data = debugManager.exportDebugData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `urbansynth-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLogToConsole = () => {
    debugManager.logDebugSummary();
  };

  const getPerformanceColor = (value: number, max: number) => {
    const ratio = value / max;
    if (ratio < 0.5) return '#4ade80'; // green
    if (ratio < 0.8) return '#fbbf24'; // yellow
    return '#ef4444'; // red
  };

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        style={{
          position: 'fixed',
          top: 10,
          right: 10,
          zIndex: 1000,
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
        }}
      >
        🔍 Debug
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 10,
        right: 10,
        width: '400px',
        maxHeight: '80vh',
        background: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        borderRadius: '8px',
        padding: '16px',
        fontSize: '12px',
        overflow: 'auto',
        zIndex: 1000,
        fontFamily: 'monospace',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <h3 style={{ margin: 0 }}>🔍 Debug Panel</h3>
        <button
          onClick={onToggle}
          style={{
            background: 'transparent',
            color: 'white',
            border: '1px solid #666',
            padding: '4px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      </div>

      {/* Performance Section */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#fbbf24' }}>Performance</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            FPS:{' '}
            <span
              style={{ color: getPerformanceColor(60 - (debugInfo.performance?.fps || 0), 60) }}
            >
              {debugInfo.performance?.fps || 0}
            </span>
          </div>
          <div>
            Frame:{' '}
            <span
              style={{ color: getPerformanceColor(debugInfo.performance?.frameTime || 0, 16.67) }}
            >
              {(debugInfo.performance?.frameTime || 0).toFixed(1)}ms
            </span>
          </div>
          <div>Layers: {debugInfo.performance?.layerCount || 0}</div>
          <div>Objects: {debugInfo.performance?.totalObjects || 0}</div>
        </div>
      </div>

      {/* View State Section */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#60a5fa' }}>View State</h4>
        <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
          <div>Lng: {(debugInfo.viewState?.longitude || 0).toFixed(4)}</div>
          <div>Lat: {(debugInfo.viewState?.latitude || 0).toFixed(4)}</div>
          <div>Zoom: {(debugInfo.viewState?.zoom || 0).toFixed(2)}</div>
          <div>Pitch: {(debugInfo.viewState?.pitch || 0).toFixed(1)}°</div>
          <div>Bearing: {(debugInfo.viewState?.bearing || 0).toFixed(1)}°</div>
        </div>
      </div>

      {/* Layers Section */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#34d399' }}>
          Layers ({debugInfo.layers?.length || 0})
        </h4>
        <div style={{ maxHeight: '200px', overflow: 'auto' }}>
          {debugInfo.layers?.map((layer, index) => (
            <div
              key={layer.id || index}
              onClick={() => setSelectedLayer(selectedLayer === layer.id ? null : layer.id)}
              style={{
                padding: '4px',
                margin: '2px 0',
                background: selectedLayer === layer.id ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                cursor: 'pointer',
                borderRadius: '2px',
                border: layer.visible ? '1px solid #22c55e' : '1px solid #666',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{layer.id}</span>
                <span style={{ color: layer.visible ? '#22c55e' : '#666' }}>
                  {layer.objectCount}
                </span>
              </div>
              {selectedLayer === layer.id && (
                <div style={{ marginTop: '4px', fontSize: '10px', color: '#ccc' }}>
                  <div>Type: {layer.type || 'Unknown'}</div>
                  <div>Extruded: {layer.props?.extruded ? 'Yes' : 'No'}</div>
                  <div>Pickable: {layer.props?.pickable ? 'Yes' : 'No'}</div>
                  {layer.props?.elevationScale && (
                    <div>Elevation Scale: {layer.props.elevationScale}</div>
                  )}
                  {layer.performance?.updateTime && (
                    <div>Update: {layer.performance.updateTime.toFixed(2)}ms</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Object Search Section */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#f472b6' }}>Object Search</h4>
        <input
          type="text"
          placeholder="Search by ID, type, or name..."
          value={searchQuery}
          onChange={e => handleSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '4px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid #666',
            borderRadius: '4px',
            color: 'white',
            fontSize: '12px',
          }}
        />
        {searchResults.length > 0 && (
          <div style={{ marginTop: '8px', maxHeight: '100px', overflow: 'auto' }}>
            {searchResults.slice(0, 10).map((obj, index) => (
              <div key={index} style={{ padding: '2px 0', fontSize: '10px' }}>
                {obj.id || obj.name || 'Unknown'} ({obj.type || 'Unknown Type'})
              </div>
            ))}
            {searchResults.length > 10 && (
              <div style={{ fontSize: '10px', color: '#666' }}>
                ...and {searchResults.length - 10} more
              </div>
            )}
          </div>
        )}
      </div>

      {/* Spatial Index Section */}
      {debugInfo.spatialIndex && (
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#a78bfa' }}>Spatial Index</h4>
          <div style={{ fontSize: '11px' }}>
            <div>Type: {debugInfo.spatialIndex?.type || 'None'}</div>
            <div>Nodes: {debugInfo.spatialIndex?.nodeCount || 0}</div>
            <div>Max Depth: {debugInfo.spatialIndex?.maxDepth || 0}</div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={handleLogToConsole}
          style={{
            background: '#1f2937',
            color: 'white',
            border: '1px solid #666',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px',
          }}
        >
          Log to Console
        </button>
        <button
          onClick={handleExportDebugData}
          style={{
            background: '#1f2937',
            color: 'white',
            border: '1px solid #666',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px',
          }}
        >
          Export JSON
        </button>
      </div>

      {/* Instructions */}
      <div style={{ marginTop: '12px', fontSize: '10px', color: '#999', lineHeight: '1.4' }}>
        <div>
          • Use <code>urbanSynthDebug</code> in console for more tools
        </div>
        <div>• Click layers to see details</div>
        <div>• Search objects by ID, type, or name</div>
      </div>
    </div>
  );
}
