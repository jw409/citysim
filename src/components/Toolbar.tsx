import { useSimulationContext } from '../contexts/SimulationContext';
import { DraggablePanel } from './DraggablePanel';

const tools = [
  { id: 'select', label: 'Select', icon: '👆' },
  { id: 'bulldoze', label: 'Bulldoze', icon: '🚧' },
  { id: 'office', label: 'Office', icon: '🏢' },
  { id: 'park', label: 'Park', icon: '🌳' },
  { id: 'shop', label: 'Shop', icon: '🏪' },
  { id: 'road', label: 'Road', icon: '🛣️' },
];

export function Toolbar() {
  const { state, dispatch } = useSimulationContext();

  const handleToolSelect = (toolId: string) => {
    dispatch({ type: 'SET_TOOL', payload: toolId === state.selectedTool ? null : toolId });
  };

  return (
    <DraggablePanel
      title="🔧 Building Tools"
      defaultPosition={{ x: window.innerWidth - 240, y: 80 }}
      defaultSize={{ width: 220, height: 280 }}
      isCollapsible={true}
      initiallyCollapsed={false}
      storageKey="building-tools"
      panelType="toolbar"
    >
      <div className="tool-grid">
        {tools.map(tool => (
          <button
            key={tool.id}
            className={`tool-button ${state.selectedTool === tool.id ? 'active' : ''}`}
            onClick={() => handleToolSelect(tool.id)}
            disabled={!state.isInitialized}
          >
            <span className="tool-icon">{tool.icon}</span>
            <span className="tool-label">{tool.label}</span>
          </button>
        ))}
      </div>
    </DraggablePanel>
  );
}