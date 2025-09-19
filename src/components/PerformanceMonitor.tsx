import React, { useState, useEffect, useRef } from 'react';
import { useSimulationContext } from '../contexts/SimulationContext';

interface PerformanceMetrics {
  fps: number;
  tps: number;
  memoryUsage: number;
  agentCount: number;
  frameTime: number;
}

interface PerformanceMonitorProps {
  visible: boolean;
  onToggle: () => void;
}

export function PerformanceMonitor({ visible, onToggle }: PerformanceMonitorProps) {
  const { state } = useSimulationContext();
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    tps: 0,
    memoryUsage: 0,
    agentCount: 0,
    frameTime: 0,
  });

  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(Date.now());
  const lastFrameTimeRef = useRef(Date.now());
  const tickCountRef = useRef(0);
  const lastTpsUpdateRef = useRef(Date.now());

  // FPS monitoring
  useEffect(() => {
    let animationFrameId: number;

    function updateFps() {
      const now = Date.now();
      frameCountRef.current++;

      // Calculate frame time
      const frameTime = now - lastFrameTimeRef.current;
      lastFrameTimeRef.current = now;

      // Update FPS every second
      if (now - lastFpsUpdateRef.current >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / (now - lastFpsUpdateRef.current));

        setMetrics(prev => ({
          ...prev,
          fps,
          frameTime: Math.round(frameTime * 100) / 100,
          agentCount: state.agents.length,
        }));

        frameCountRef.current = 0;
        lastFpsUpdateRef.current = now;
      }

      animationFrameId = requestAnimationFrame(updateFps);
    }

    if (visible) {
      animationFrameId = requestAnimationFrame(updateFps);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [visible, state.agents.length]);

  // TPS monitoring (simulation ticks per second)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!visible) return;

      const now = Date.now();

      // Estimate TPS based on simulation state changes
      // This is a simplified approach - in a real implementation,
      // we'd hook into the WASM tick counter
      if (state.isRunning) {
        tickCountRef.current++;

        if (now - lastTpsUpdateRef.current >= 1000) {
          const tps = Math.round((tickCountRef.current * 1000) / (now - lastTpsUpdateRef.current));

          setMetrics(prev => ({
            ...prev,
            tps,
          }));

          tickCountRef.current = 0;
          lastTpsUpdateRef.current = now;
        }
      }

      // Update memory usage (approximation)
      if (performance.memory) {
        const memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
        setMetrics(prev => ({
          ...prev,
          memoryUsage,
        }));
      }
    }, 100); // Update every 100ms

    return () => clearInterval(interval);
  }, [visible, state.isRunning]);

  // Keyboard shortcut to toggle
  useEffect(() => {
    function handleKeyPress(event: KeyboardEvent) {
      if (event.key === 'F3' || (event.ctrlKey && event.key === 'i')) {
        event.preventDefault();
        onToggle();
      }
    }

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onToggle]);

  if (!visible) {
    return (
      <div style={hiddenToggleStyle} onClick={onToggle} title="Press F3 to show performance monitor">
        📊
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span style={titleStyle}>Performance</span>
        <button style={closeButtonStyle} onClick={onToggle} title="Press F3 to hide">
          ×
        </button>
      </div>

      <div style={metricsStyle}>
        <div style={metricRowStyle}>
          <span style={labelStyle}>FPS:</span>
          <span style={getValueStyle(metrics.fps, 60, 30)}>
            {metrics.fps}
          </span>
        </div>

        <div style={metricRowStyle}>
          <span style={labelStyle}>Frame:</span>
          <span style={getValueStyle(metrics.frameTime, 16.67, 33.33, true)}>
            {metrics.frameTime}ms
          </span>
        </div>

        <div style={metricRowStyle}>
          <span style={labelStyle}>TPS:</span>
          <span style={getValueStyle(metrics.tps, 60, 30)}>
            {state.isRunning ? metrics.tps : 0}
          </span>
        </div>

        <div style={metricRowStyle}>
          <span style={labelStyle}>Agents:</span>
          <span style={valueStyle}>
            {metrics.agentCount.toLocaleString()}
          </span>
        </div>

        {metrics.memoryUsage > 0 && (
          <div style={metricRowStyle}>
            <span style={labelStyle}>Memory:</span>
            <span style={getValueStyle(metrics.memoryUsage, 100, 200, true)}>
              {metrics.memoryUsage}MB
            </span>
          </div>
        )}

        <div style={metricRowStyle}>
          <span style={labelStyle}>Speed:</span>
          <span style={valueStyle}>
            {state.speed.toFixed(1)}x
          </span>
        </div>
      </div>

      <div style={hintStyle}>
        Press F3 to toggle
      </div>
    </div>
  );
}

// Helper function to get colored value style based on thresholds
function getValueStyle(value: number, goodThreshold: number, badThreshold: number, inverse = false) {
  let color = '#10b981'; // green

  if (inverse) {
    // For metrics where lower is better (frame time, memory)
    if (value > badThreshold) {
      color = '#ef4444'; // red
    } else if (value > goodThreshold) {
      color = '#f59e0b'; // yellow
    }
  } else {
    // For metrics where higher is better (FPS, TPS)
    if (value < badThreshold) {
      color = '#ef4444'; // red
    } else if (value < goodThreshold) {
      color = '#f59e0b'; // yellow
    }
  }

  return {
    ...valueStyle,
    color,
  };
}

// Styles
const containerStyle: React.CSSProperties = {
  position: 'fixed',
  top: '10px',
  right: '10px',
  backgroundColor: 'rgba(0, 0, 0, 0.85)',
  color: 'white',
  padding: '8px',
  borderRadius: '6px',
  fontFamily: 'monospace',
  fontSize: '12px',
  zIndex: 9999,
  minWidth: '140px',
  backdropFilter: 'blur(4px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
};

const hiddenToggleStyle: React.CSSProperties = {
  position: 'fixed',
  top: '10px',
  right: '10px',
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  color: 'white',
  padding: '4px 6px',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px',
  zIndex: 9999,
  backdropFilter: 'blur(4px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '6px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
  paddingBottom: '4px',
};

const titleStyle: React.CSSProperties = {
  fontWeight: 'bold',
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const closeButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'rgba(255, 255, 255, 0.7)',
  cursor: 'pointer',
  fontSize: '14px',
  lineHeight: '1',
  padding: '0',
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