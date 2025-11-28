import { IconLayer } from '@deck.gl/layers';
import { getTimeBasedColors } from '../utils/colorSchemes';
import { localToLatLng } from '../utils/coordinates';
import { AGENT_ICON_URL, AGENT_ICON_MAPPING } from '../utils/assetConstants';

export function createAgentLayer(
  agents: any[] | { buffer: Float32Array; length: number },
  timeOfDay: number = 12
) {
  const colors = getTimeBasedColors(timeOfDay);

  // Binary Mode
  if (agents && 'buffer' in agents && (agents as any).buffer instanceof Float32Array) {
    const binaryData = agents as { buffer: Float32Array; length: number };

    return new IconLayer({
      id: 'agents',
      data: {
        length: binaryData.length,
        attributes: {
          instancePositions: {
            value: binaryData.buffer,
            size: 3, // x, y, z
          },
        },
      },
      getIcon: (d: any) => 'marker', // Default icon
      getSize: 20,
      getColor: [255, 255, 0], // Default color for now
      sizeUnits: 'meters',
      sizeScale: 1,
      sizeMinPixels: 8,
      sizeMaxPixels: 24,
      pickable: true,
      iconAtlas: AGENT_ICON_URL,
      iconMapping: AGENT_ICON_MAPPING,
      updateTriggers: {
        instancePositions: [binaryData.buffer], // Trigger update when buffer changes
      },
      transitions: {
        // Transitions might be tricky with binary updates every frame, disable for now to test raw perf
        // getPosition: 100
      },
    });
  }

  // Legacy Object Mode (Fallback)
  return new IconLayer({
    id: 'agents',
    data: agents as any[],
    getPosition: (d: any) => {
      if (!d.position) {
        return [0, 0, 5];
      }
      // Optimization: Inline conversion or ensure data is pre-converted if possible.
      // For now, just removing the log is the critical fix.
      const [lng, lat] = localToLatLng(d.position.x, d.position.y);
      return [lng, lat, 5];
    },
    getIcon: (d: any) => 'marker',
    getSize: (d: any) => 20,
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
    iconAtlas: AGENT_ICON_URL,
    iconMapping: AGENT_ICON_MAPPING,
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
