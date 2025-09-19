import React from 'react';
import { useSimulationContext } from '../contexts/SimulationContext';
import { generateMovingTestAgents } from '../utils/testAgents';

export function TestAgentButton() {
  const { state, dispatch } = useSimulationContext();

  const generateTestAgents = () => {
    const testAgents = generateMovingTestAgents(15);
    const currentAgents = state.agents || [];
    const allAgents = [...currentAgents, ...testAgents];

    dispatch({ type: 'SET_AGENTS', payload: allAgents });

    // Also start the simulation if not running
    if (!state.isRunning) {
      dispatch({ type: 'SET_RUNNING', payload: true });
    }

    console.log(`Added ${testAgents.length} test agents. Total: ${allAgents.length} agents`);
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 10,
        left: 250,
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px',
        zIndex: 1000,
      }}
    >
      <button
        onClick={generateTestAgents}
        style={{
          padding: '8px 12px',
          fontSize: '12px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold',
        }}
      >
        🚗 Add Test Agents ({state.agents?.length || 0} current)
      </button>
      <div style={{ fontSize: '10px', color: '#ccc', marginTop: '5px' }}>
        Click to add moving agents for testing first/third person views
      </div>
    </div>
  );
}