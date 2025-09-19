import { ScenegraphLayer, SimpleMeshLayer } from '@deck.gl/mesh-layers';
import { IconLayer } from '@deck.gl/layers';
import { getTimeBasedColors } from '../utils/colorSchemes';
import { localToLatLng } from '../utils/coordinates';
import { assetManager, LOD_CONFIG } from '../utils/assetManager';

interface Agent3D {
  id: string | number;
  position: { x: number; y: number; z?: number };
  agent_type: string;
  heading?: number;
  speed?: number;
  state?: string;
}

interface Asset3DLayerProps {
  agents: Agent3D[];
  timeOfDay?: number;
  cameraPosition?: [number, number, number];
  enableLOD?: boolean;
}

// Calculate distance between two lat/lng points (approximate)
function calculateDistance(
  pos1: [number, number, number],
  pos2: [number, number, number]
): number {
  const [lon1, lat1] = pos1;
  const [lon2, lat2] = pos2;

  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

// Create primitive fallback geometry
function createPrimitiveGeometry(type: string) {
  // These are simplified geometries for fallback rendering
  const geometries: Record<string, any> = {
    box: {
      positions: new Float32Array([
        // Front face
        -1, -1,  1,  1, -1,  1,  1,  1,  1, -1,  1,  1,
        // Back face
        -1, -1, -1, -1,  1, -1,  1,  1, -1,  1, -1, -1,
        // Top face
        -1,  1, -1, -1,  1,  1,  1,  1,  1,  1,  1, -1,
        // Bottom face
        -1, -1, -1,  1, -1, -1,  1, -1,  1, -1, -1,  1,
        // Right face
         1, -1, -1,  1,  1, -1,  1,  1,  1,  1, -1,  1,
        // Left face
        -1, -1, -1, -1, -1,  1, -1,  1,  1, -1,  1, -1
      ]),
      indices: new Uint16Array([
        0,  1,  2,    0,  2,  3,    // front
        4,  5,  6,    4,  6,  7,    // back
        8,  9,  10,   8,  10, 11,   // top
        12, 13, 14,   12, 14, 15,   // bottom
        16, 17, 18,   16, 18, 19,   // right
        20, 21, 22,   20, 22, 23    // left
      ])
    },
    cylinder: {
      // Simplified cylinder (8-sided)
      positions: new Float32Array([
        // Bottom circle
        0, -1, 0,  1, -1, 0,  0.7, -1, 0.7,  0, -1, 1,  -0.7, -1, 0.7,  -1, -1, 0,  -0.7, -1, -0.7,  0, -1, -1,  0.7, -1, -0.7,
        // Top circle
        0, 1, 0,   1, 1, 0,   0.7, 1, 0.7,   0, 1, 1,   -0.7, 1, 0.7,   -1, 1, 0,   -0.7, 1, -0.7,   0, 1, -1,   0.7, 1, -0.7
      ]),
      indices: new Uint16Array([
        // Bottom cap (simplified)
        0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 5, 0, 5, 6, 0, 6, 7, 0, 7, 8, 0, 8, 1,
        // Top cap
        9, 11, 10, 9, 12, 11, 9, 13, 12, 9, 14, 13, 9, 15, 14, 9, 16, 15, 9, 17, 16, 9, 10, 17,
        // Sides (simplified)
        1, 10, 2, 2, 10, 11, 2, 11, 3, 3, 11, 12
      ])
    }
  };

  return geometries[type] || geometries.box;
}

export function createAsset3DLayer({
  agents,
  timeOfDay = 12,
  cameraPosition,
  enableLOD = true
}: Asset3DLayerProps) {
  const colors = getTimeBasedColors(timeOfDay);

  // Separate agents by LOD level
  const agentsByLOD = {
    high: [] as any[],
    medium: [] as any[],
    low: [] as any[]
  };

  const processedAgents = agents.map((agent) => {
    if (!agent.position) return null;

    const [lng, lat] = localToLatLng(agent.position.x, agent.position.y);
    const agentPos: [number, number, number] = [lng, lat, agent.position.z || 5];

    // Calculate LOD level if camera position is available
    let lodLevel: 'high' | 'medium' | 'low' = 'high';
    if (enableLOD && cameraPosition) {
      const distance = calculateDistance(cameraPosition, agentPos);
      lodLevel = assetManager.getLODLevel(distance);
    }

    const processedAgent = {
      ...agent,
      position: agentPos,
      lodLevel,
      assetKey: `${agent.agent_type.toLowerCase()}_${typeof agent.id === 'number' ? agent.id % 3 : 0}` // Simple variant selection
    };

    agentsByLOD[lodLevel].push(processedAgent);
    return processedAgent;
  }).filter(Boolean);

  const layers: any[] = [];

  // High detail agents - full 3D models
  if (agentsByLOD.high.length > 0) {
    layers.push(
      new ScenegraphLayer({
        id: 'agents-high-detail',
        data: agentsByLOD.high,
        getPosition: (d: any) => d.position,
        getOrientation: (d: any) => [0, -(d.heading || 0), 0], // Convert heading to deck.gl orientation
        getScale: (d: any) => {
          const metadata = assetManager.getAssetMetadata(d.assetKey);
          const baseScale = metadata?.scale || 1.0;
          // Scale based on agent type
          const typeScales: Record<string, number> = {
            'pedestrian': 3,
            'car': 8,
            'bus': 12,
            'truck': 10,
            'aircraft': 20,
            'helicopter': 15,
            'drone': 2
          };
          const scale = baseScale * (typeScales[d.agent_type.toLowerCase()] || 5);
          return [scale, scale, scale];
        },
        scenegraph: async (d: any) => {
          try {
            const asset = await assetManager.getAssetForAgent(d.agent_type, d.id);
            return asset.data;
          } catch (error) {
            console.warn(`Failed to load 3D asset for ${d.agent_type}:`, error);
            return null; // Will fall back to primitive
          }
        },
        pickable: true,
        autoHighlight: true,
        highlightColor: [255, 255, 0, 128],
        updateTriggers: {
          getPosition: [agents],
          getOrientation: [agents],
          scenegraph: [agents]
        },
        transitions: {
          getPosition: {
            duration: 100,
            easing: (t: number) => t,
          },
          getOrientation: {
            duration: 200,
            easing: (t: number) => t,
          }
        }
      })
    );
  }

  // Medium detail agents - simplified meshes (TEMPORARILY DISABLED)
  if (false && agentsByLOD.medium.length > 0) {
    console.log('Medium detail layer disabled for debugging');
  }

  // Low detail agents - simple icons/billboards
  if (agentsByLOD.low.length > 0) {
    layers.push(
      new IconLayer({
        id: 'agents-low-detail',
        data: agentsByLOD.low,
        getPosition: (d: any) => d.position,
        getIcon: (d: any) => getAgentIcon(d.agent_type),
        getSize: (d: any) => getAgentSize(d.agent_type),
        getColor: (d: any) => {
          const agentType = d.agent_type?.toLowerCase() || 'car';
          return colors.agents[agentType] || colors.agents.car;
        },
        getAngle: (d: any) => d.heading || 0,
        sizeUnits: 'meters',
        sizeScale: 1,
        sizeMinPixels: 4,
        sizeMaxPixels: 12,
        pickable: true,
        iconAtlas: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAAAgCAYAAADaInAlAAAABHNCSVQICAgIfAhkiAAAABl0RVh0U29mdHdhcmUAZ25vbWUtc2NyZWVuc2hvdO8Dvz4AAAGrSURBVGiB7doxEoIwEAXQBxQWttZaWNpa2lpbW1tra21tLa2ttbW0tNbW2tpaWlpbW1tLS0tLS2tpbS2tpaW1tLS2lpbW0tLS2lpbW0tLS2tpbS0tLS2tpaWltbW0tLS2lpbW0tLS2lpbW0tLS2tpbS0tLS2tpaWltbW0tLS2lpbW0tLS2lpbW0tLS2tpbS0tLS2tpaWltbW0tLS2lpbW0tLS2lpbW0tLS2tpbS0tLS2tpaWltbW0tLS2lpbW0tLS2lpbW0tLS2tpbS0tLS2tpaWltbW0tLS2lpbW0tLS2lpbW0tLS2tpbS0tLS2tpaWltbW0tLS2lpbW0tLS2lpbW0tLS2tpbS0tLS2tpaWltbW0tLS2lpbW0tLS2lpbW0tLS2tpbS0tLS2tpaWltbW0tLS2lpbW0tLS2lpbW0tLS2tpbS0tLS2tpaWltbW0tLS2lpbW0tLS2lpbW0tLS2tpbS0tLS2tpaWltbW0tLS2lpbW0tLS2lpbW0tLS2tpbS0tLS2tpaWltbW0tLS2lpbW0tLS2lpbW0tLS2tpbS0tLS2tpaWltbW0tLS2lpbW0tLS2lpbW0tLS2tpbS0tLS2tpaWltbW0tLS2lpbW0tLS2lpbW0tLS2tpbS0tLS2tpaWltbW0tLS2lpbW0tLS2lpbW0tLS2tpbS0tLS2tpaWltbW0tLS2lpbW0tLS2lpbW0tLS2tpbS0tLS2tpaWltbW0AAAAASUVORK5CYII=',
        iconMapping: getIconMapping(),
        updateTriggers: {
          getPosition: [agents],
          getColor: [timeOfDay],
          getAngle: [agents],
        }
      })
    );
  }

  console.log(`Created ${layers.length} agent layers:`, {
    high: agentsByLOD.high.length,
    medium: agentsByLOD.medium.length,
    low: agentsByLOD.low.length,
    total: processedAgents.length
  });

  return layers;
}

// Helper functions (from original AgentLayer)
function getAgentIcon(agentType: string): string {
  const icons: { [key: string]: string } = {
    Pedestrian: 'person',
    Car: 'car',
    Bus: 'bus',
    Truck: 'truck',
    Aircraft: 'plane',
    Helicopter: 'helicopter',
    Drone: 'drone'
  };
  return icons[agentType] || 'car';
}

function getAgentSize(agentType: string): number {
  const sizes: { [key: string]: number } = {
    Pedestrian: 8,
    Car: 12,
    Bus: 16,
    Truck: 14,
    Aircraft: 20,
    Helicopter: 18,
    Drone: 6
  };
  return sizes[agentType] || 12;
}

function getIconMapping(): any {
  return {
    car: { x: 0, y: 0, width: 16, height: 16, anchorY: 8, anchorX: 8 },
    bus: { x: 16, y: 0, width: 16, height: 16, anchorY: 8, anchorX: 8 },
    truck: { x: 32, y: 0, width: 16, height: 16, anchorY: 8, anchorX: 8 },
    person: { x: 48, y: 0, width: 16, height: 16, anchorY: 8, anchorX: 8 },
    plane: { x: 64, y: 0, width: 16, height: 16, anchorY: 8, anchorX: 8 },
    helicopter: { x: 80, y: 0, width: 16, height: 16, anchorY: 8, anchorX: 8 },
    drone: { x: 96, y: 0, width: 16, height: 16, anchorY: 8, anchorX: 8 }
  };
}