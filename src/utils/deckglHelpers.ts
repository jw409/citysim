import { WebMercatorViewport } from '@deck.gl/core';

export function calculateViewBounds(cityBounds: any) {
  const { min_x, min_y, max_x, max_y } = cityBounds;
  const centerX = (min_x + max_x) / 2;
  const centerY = (min_y + max_y) / 2;
  const width = max_x - min_x;
  const height = max_y - min_y;

  return {
    longitude: centerX / 111320, // Rough conversion to degrees
    latitude: centerY / 110540,
    zoom: Math.log2((360 / Math.max(width, height)) * 111320) - 1,
  };
}

export function smoothViewTransition(
  currentView: any,
  targetView: any,
  duration: number = 1000
): Promise<void> {
  return new Promise(resolve => {
    const startTime = Date.now();
    const initialView = { ...currentView };

    function animate() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const eased = 1 - Math.pow(1 - progress, 3);

      const interpolatedView = {
        longitude: initialView.longitude + (targetView.longitude - initialView.longitude) * eased,
        latitude: initialView.latitude + (targetView.latitude - initialView.latitude) * eased,
        zoom: initialView.zoom + (targetView.zoom - initialView.zoom) * eased,
        pitch: initialView.pitch + (targetView.pitch - initialView.pitch) * eased,
        bearing: initialView.bearing + (targetView.bearing - initialView.bearing) * eased,
      };

      // Update view state (this would need to be passed as a callback)

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        resolve();
      }
    }

    animate();
  });
}

export function getOptimalZoom(bounds: any, viewportSize: { width: number; height: number }) {
  const { min_x, min_y, max_x, max_y } = bounds;
  const boundingBoxWidth = max_x - min_x;
  const boundingBoxHeight = max_y - min_y;

  // Convert to rough degree approximation
  const degreesWidth = boundingBoxWidth / 111320;
  const degreesHeight = boundingBoxHeight / 110540;

  const zoomX = Math.log2(360 / degreesWidth);
  const zoomY = Math.log2(180 / degreesHeight);

  return Math.min(zoomX, zoomY) - 1; // Add some padding
}

function getRoadTypeName(roadType: number): string {
  const types = ['Local Street', 'Main Road', 'Highway', 'Boulevard', 'Avenue'];
  return types[roadType] || 'Local Street';
}

export function createPickingInfoTooltip(info: any): string | null {
  if (!info.object) return null;

  const { object, layer } = info;

  switch (layer.id) {
    case 'buildings':
      return `Building: ${object.type || 'Unknown'}\nHeight: ${object.height?.toFixed(1) || 0}m`;

    case 'agents':
      return `Agent: ${object.agent_type || 'Unknown'}\nSpeed: ${object.speed?.toFixed(1) || 0} km/h`;

    case 'roads':
      const roadTypeName = getRoadTypeName(object.road_type || object.type || 0);
      const roadName = object.name || object.road_name || 'Unnamed Road';
      return `${roadName}\nType: ${roadTypeName}\nSpeed Limit: ${object.speed_limit || object.speedLimit || 50} km/h`;

    case 'pois':
      return `POI: ${object.properties?.name || 'Unknown'}\nCapacity: ${object.capacity || 0}`;

    default:
      return null;
  }
}
