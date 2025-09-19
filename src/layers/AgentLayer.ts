import { ScatterplotLayer } from '@deck.gl/layers';
import { getTimeBasedColors } from '../utils/colorSchemes';

export function createAgentLayer(agents: any[], timeOfDay: number = 12) {
  const colors = getTimeBasedColors(timeOfDay);

  return new ScatterplotLayer({
    id: 'agents',
    data: agents,
    getPosition: (d: any) => [d.position?.x || 0, d.position?.y || 0, 5],
    getRadius: (d: any) => getAgentSize(d.agent_type),
    getFillColor: (d: any) => {
      const agentType = d.agent_type?.toLowerCase() || 'car';
      return colors.agents[agentType] || colors.agents.car;
    },
    getLineColor: [0, 0, 0, 100],
    getLineWidth: 1,
    radiusUnits: 'meters',
    radiusScale: 1,
    radiusMinPixels: 2,
    radiusMaxPixels: 10,
    stroked: true,
    filled: true,
    pickable: true,
    updateTriggers: {
      getPosition: [agents],
      getFillColor: [timeOfDay],
    },
    transitions: {
      getPosition: {
        duration: 100,
        easing: (t: number) => t, // Linear interpolation for smooth movement
      },
      getFillColor: 1000,
    },
  });
}

function getAgentSize(agentType: string): number {
  const sizes = {
    'Pedestrian': 1.5,
    'Car': 3,
    'Bus': 6,
    'Truck': 5,
  };
  return sizes[agentType] || 3;
}