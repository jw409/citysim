import { IconLayer } from '@deck.gl/layers';
import { getTimeBasedColors } from '../utils/colorSchemes';
import { localToLatLng } from '../utils/coordinates';

export function createAgentLayer(agents: any[], timeOfDay: number = 12) {
  const colors = getTimeBasedColors(timeOfDay);

  console.log('🎯 Creating agent layer with:', {
    agentCount: agents.length,
    firstAgent: agents[0],
    colors: colors.agents,
  });

  return new IconLayer({
    id: 'agents',
    data: agents,
    getPosition: (d: any) => {
      if (!d.position) {
        console.log('⚠️ Agent missing position:', d);
        return [0, 0, 5];
      }
      const [lng, lat] = localToLatLng(d.position.x, d.position.y);
      const position = [lng, lat, 5];
      if (d.id === 0) {
        // Log first agent for debugging
        console.log('🎯 Agent 0 position:', {
          original: d.position,
          converted: position,
          localCoords: [d.position.x, d.position.y],
          worldCoords: [lng, lat],
        });
      }
      return position;
    },
    getIcon: (d: any) => getAgentIcon(d.agent_type),
    getSize: (d: any) => getAgentSize(d.agent_type),
    getColor: (d: any) => {
      const agentType = d.agent_type?.toLowerCase() || 'car';
      return colors.agents[agentType] || colors.agents.car;
    },
    getAngle: (d: any) => d.heading || 0,
    sizeUnits: 'meters',
    sizeScale: 1,
    sizeMinPixels: 8,
    sizeMaxPixels: 24,
    pickable: true,
    iconAtlas: '/agent-icons.png', // We'll create a simple icon atlas
    iconMapping: getIconMapping(),
    updateTriggers: {
      getPosition: [agents],
      getColor: [timeOfDay],
      getAngle: [agents],
    },
    transitions: {
      getPosition: {
        duration: 100,
        easing: (t: number) => t,
      },
      getColor: 1000,
    },
  });
}

function getAgentIcon(agentType: string): string {
  const icons: { [key: string]: string } = {
    Pedestrian: 'person',
    Car: 'car',
    Bus: 'bus',
    Truck: 'truck',
  };
  return icons[agentType] || 'car';
}

function getAgentSize(agentType: string): number {
  const sizes: { [key: string]: number } = {
    Pedestrian: 8,
    Car: 12,
    Bus: 16,
    Truck: 14,
  };
  return sizes[agentType] || 12;
}

function getIconMapping(): any {
  return {
    car: {
      x: 0,
      y: 0,
      width: 16,
      height: 16,
      anchorY: 8,
      anchorX: 8,
    },
    bus: {
      x: 16,
      y: 0,
      width: 16,
      height: 16,
      anchorY: 8,
      anchorX: 8,
    },
    truck: {
      x: 32,
      y: 0,
      width: 16,
      height: 16,
      anchorY: 8,
      anchorX: 8,
    },
    person: {
      x: 48,
      y: 0,
      width: 16,
      height: 16,
      anchorY: 8,
      anchorX: 8,
    },
  };
}
