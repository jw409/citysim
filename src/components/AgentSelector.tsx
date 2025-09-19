import React, { useState, useMemo } from 'react';

interface Agent {
  id: string | number;
  agent_type: string;
  position: { x: number; y: number; z?: number };
  speed?: number;
  state?: string;
  destination?: string;
}

interface AgentSelectorProps {
  agents: Agent[];
  followTarget: string | null;
  onSelectAgent: (agentId: string) => void;
  onStopFollowing: () => void;
  cameraPosition?: [number, number, number];
}

export function AgentSelector({
  agents,
  followTarget,
  onSelectAgent,
  onStopFollowing,
  cameraPosition
}: AgentSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'id' | 'type' | 'distance' | 'speed'>('distance');

  // Agent type colors
  const typeColors: Record<string, string> = {
    'Pedestrian': '#4CAF50',
    'Car': '#2196F3',
    'Bus': '#FF9800',
    'Truck': '#9C27B0',
    'Aircraft': '#F44336',
    'Helicopter': '#795548',
    'Drone': '#607D8B'
  };

  // Calculate distance from camera
  const calculateDistance = (agent: Agent): number => {
    if (!cameraPosition) return 0;
    const dx = agent.position.x - (cameraPosition[0] * 111320);
    const dy = agent.position.y - (cameraPosition[1] * 110540);
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Filter and sort agents
  const filteredAndSortedAgents = useMemo(() => {
    let filtered = agents;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(agent => agent.agent_type === filterType);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(agent =>
        agent.id.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.agent_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.destination?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort agents
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'id':
          return a.id.toString().localeCompare(b.id.toString());
        case 'type':
          return a.agent_type.localeCompare(b.agent_type);
        case 'distance':
          return calculateDistance(a) - calculateDistance(b);
        case 'speed':
          return (b.speed || 0) - (a.speed || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [agents, filterType, searchTerm, sortBy, cameraPosition]);

  // Get unique agent types
  const agentTypes = useMemo(() => {
    const types = [...new Set(agents.map(agent => agent.agent_type))];
    return types.sort();
  }, [agents]);

  // Get agent counts by type
  const agentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    agents.forEach(agent => {
      counts[agent.agent_type] = (counts[agent.agent_type] || 0) + 1;
    });
    return counts;
  }, [agents]);

  if (!isExpanded) {
    return (
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          background: 'rgba(0, 0, 0, 0.85)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
        onClick={() => setIsExpanded(true)}
      >
        <span>👥</span>
        <span>{agents.length} agents</span>
        {followTarget && (
          <span style={{ color: '#4CAF50', fontSize: '10px' }}>
            • Following {followTarget}
          </span>
        )}
        <span style={{ fontSize: '10px', color: '#ccc' }}>▼</span>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 10,
        left: 10,
        background: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        borderRadius: '8px',
        fontSize: '12px',
        width: '320px',
        maxHeight: '400px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
          👥 Agent Selector
        </h4>
        <button
          onClick={() => setIsExpanded(false)}
          style={{
            background: 'none',
            border: 'none',
            color: '#ccc',
            cursor: 'pointer',
            fontSize: '14px',
            padding: '4px',
          }}
        >
          ✕
        </button>
      </div>

      {/* Controls */}
      <div style={{ padding: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
        {/* Search */}
        <div style={{ marginBottom: '8px' }}>
          <input
            type="text"
            placeholder="Search agents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 8px',
              fontSize: '11px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '4px',
              color: 'white',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Filter and Sort */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              flex: 1,
              padding: '4px 6px',
              fontSize: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '3px',
              color: 'white',
            }}
          >
            <option value="all">All Types ({agents.length})</option>
            {agentTypes.map(type => (
              <option key={type} value={type} style={{ backgroundColor: '#333' }}>
                {type} ({agentCounts[type]})
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{
              flex: 1,
              padding: '4px 6px',
              fontSize: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '3px',
              color: 'white',
            }}
          >
            <option value="distance" style={{ backgroundColor: '#333' }}>Sort by Distance</option>
            <option value="id" style={{ backgroundColor: '#333' }}>Sort by ID</option>
            <option value="type" style={{ backgroundColor: '#333' }}>Sort by Type</option>
            <option value="speed" style={{ backgroundColor: '#333' }}>Sort by Speed</option>
          </select>
        </div>

        {/* Current Selection */}
        {followTarget && (
          <div style={{
            marginTop: '8px',
            padding: '6px 8px',
            backgroundColor: 'rgba(76, 175, 80, 0.2)',
            border: '1px solid #4CAF50',
            borderRadius: '4px',
            fontSize: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Following: {followTarget}</span>
            <button
              onClick={onStopFollowing}
              style={{
                background: 'none',
                border: 'none',
                color: '#ff5722',
                cursor: 'pointer',
                fontSize: '10px',
                padding: '2px 4px',
              }}
            >
              Stop
            </button>
          </div>
        )}
      </div>

      {/* Agent List */}
      <div
        style={{
          maxHeight: '240px',
          overflowY: 'auto',
          padding: '8px',
        }}
      >
        {filteredAndSortedAgents.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: '#666',
            padding: '20px',
            fontSize: '11px'
          }}>
            No agents found
          </div>
        ) : (
          filteredAndSortedAgents.map((agent) => {
            const distance = calculateDistance(agent);
            const isSelected = followTarget === agent.id.toString();

            return (
              <div
                key={agent.id}
                onClick={() => onSelectAgent(agent.id.toString())}
                style={{
                  padding: '8px',
                  marginBottom: '4px',
                  backgroundColor: isSelected ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                  border: isSelected ? '1px solid #4CAF50' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: '11px',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  }
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px'
                }}>
                  <span style={{ fontWeight: 'bold' }}>Agent {agent.id}</span>
                  <span
                    style={{
                      fontSize: '9px',
                      padding: '2px 6px',
                      backgroundColor: typeColors[agent.agent_type] || '#666',
                      borderRadius: '10px',
                      color: 'white'
                    }}
                  >
                    {agent.agent_type}
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  fontSize: '9px',
                  color: '#ccc'
                }}>
                  <div>
                    📍 {distance > 1000 ? `${(distance/1000).toFixed(1)}km` : `${distance.toFixed(0)}m`}
                  </div>
                  <div>
                    🏃 {agent.speed?.toFixed(1) || '0'} km/h
                  </div>
                  <div>
                    🎯 {agent.state || 'Unknown'}
                  </div>
                  <div>
                    📌 {agent.destination || 'None'}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Actions */}
      <div style={{
        padding: '8px 12px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        fontSize: '10px',
        color: '#ccc'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Showing {filteredAndSortedAgents.length} of {agents.length}</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                const randomAgent = agents[Math.floor(Math.random() * agents.length)];
                onSelectAgent(randomAgent.id.toString());
              }}
              style={{
                background: 'none',
                border: '1px solid #666',
                color: '#ccc',
                padding: '2px 6px',
                fontSize: '9px',
                borderRadius: '3px',
                cursor: 'pointer',
              }}
            >
              🎲 Random
            </button>
            <button
              onClick={() => {
                const closest = filteredAndSortedAgents.find(agent => calculateDistance(agent) > 0);
                if (closest) onSelectAgent(closest.id.toString());
              }}
              style={{
                background: 'none',
                border: '1px solid #666',
                color: '#ccc',
                padding: '2px 6px',
                fontSize: '9px',
                borderRadius: '3px',
                cursor: 'pointer',
              }}
            >
              📍 Nearest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}