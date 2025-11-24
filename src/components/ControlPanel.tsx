import { useSimulationContext } from '../contexts/SimulationContext';
import { useSimulation } from '../hooks/useSimulation';
import { DraggablePanel } from './DraggablePanel';

export function ControlPanel() {
  const { state } = useSimulationContext();
  const { start, pause, setSpeed } = useSimulation();

  const formatTime = (time: number) => {
    const hours = Math.floor(time);
    const minutes = Math.floor((time - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  console.log('ControlPanel render:', {
    isInitialized: state.isInitialized,
    isRunning: state.isRunning,
    isLoading: state.isLoading,
    currentTime: state.currentTime,
    speed: state.speed,
  });

  return (
    <DraggablePanel
      title="⏱️ Time Controls"
      defaultPosition={{ x: 20, y: 120 }}
      defaultSize={{ width: 280, height: 200 }}
      isCollapsible={true}
      initiallyCollapsed={false}
      storageKey="time-controls"
      panelType="controls"
    >
      <div className="control-group">
        <label className="control-label">
          Simulation Status: {state.isInitialized ? '✅ Ready' : '⏳ Loading'}
        </label>
        <div className="control-buttons">
          <button
            className="button button-primary"
            onClick={state.isRunning ? pause : start}
            style={{ minWidth: '100px' }}
          >
            {state.isRunning ? '⏸️ Pause' : '▶️ Play'}
          </button>
        </div>
      </div>

      <div className="control-group">
        <label className="control-label">Speed: {state.speed.toFixed(1)}x</label>
        <input
          type="range"
          min="0.1"
          max="5"
          step="0.1"
          value={state.speed}
          onChange={e => setSpeed(parseFloat(e.target.value))}
          className="speed-slider"
          style={{ width: '100%' }}
        />
      </div>

      <div className="control-group">
        <label className="control-label">Time</label>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{formatTime(state.currentTime)}</span>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Day {state.day + 1}
          </span>
        </div>
      </div>
    </DraggablePanel>
  );
}
