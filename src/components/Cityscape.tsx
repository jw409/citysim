import React, { useMemo, useCallback, useState } from 'react';
import DeckGL from '@deck.gl/react';
import { MapView } from '@deck.gl/core';
import { useSimulationContext } from '../contexts/SimulationContext';
import { createBuildingLayer } from '../layers/BuildingLayer';
import { createAgentLayer } from '../layers/AgentLayer';
import { createRoadLayer } from '../layers/RoadLayer';
import { createZoneLayer } from '../layers/ZoneLayer';

// TODO: Re-enable these imports when infrastructure layers are implemented
// import { createSewerLayer } from '../layers/infrastructure/SewerLayer';
// import { createUtilityTunnelLayer } from '../layers/infrastructure/UtilityTunnelLayer';
// import { createSubwayLayer } from '../layers/infrastructure/SubwayLayer';
// import { createUndergroundParkingLayer } from '../layers/infrastructure/UndergroundParkingLayer';
// import { createElevatedHighwayLayer } from '../layers/elevated/ElevatedHighwayLayer';
// import { createSkyBridgeLayer } from '../layers/elevated/SkyBridgeLayer';
// import { createElevatedTransitLayer } from '../layers/elevated/ElevatedTransitLayer';
// import { createHelicopterLayer } from '../layers/aerial/HelicopterLayer';
// import { createAircraftLayer } from '../layers/aerial/AircraftLayer';
// import { createDroneLayer } from '../layers/aerial/DroneLayer';

interface CityscapeProps {
  width?: number;
  height?: number;
}

export function Cityscape({ width = 800, height = 600 }: CityscapeProps) {
  const { state } = useSimulationContext();
  const [showZones, setShowZones] = useState(false);
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 0,
    zoom: 12,
    pitch: 45,
    bearing: 0
  });

  // Create basic layers
  const layers = useMemo(() => {
    const cityData = state.cityModel || { zones: [], roads: [], pois: [], buildings: [] };
    const activeLayers: any[] = [];

    // Basic layers
    if (showZones) {
      activeLayers.push(createZoneLayer(cityData.zones || [], state.currentTime || 12, true));
    }

    activeLayers.push(createRoadLayer(cityData.roads || [], state.currentTime || 12));
    activeLayers.push(createBuildingLayer(cityData.buildings || [], state.currentTime || 12));
    activeLayers.push(createAgentLayer(state.agents, state.currentTime || 12));

    return activeLayers;
  }, [state.cityModel, state.agents, state.currentTime, showZones]);

  const handleViewStateChange = useCallback(({ viewState: newViewState }: any) => {
    setViewState(newViewState);
  }, []);

  const handleClick = useCallback((info: any) => {
    if (info.object) {
      console.log('Clicked object:', info.object);
    }
  }, []);

  const toggleZones = useCallback(() => {
    setShowZones(prev => !prev);
  }, []);

  // Prevent right-click context menu on canvas
  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
  }, []);

  return (
    <div
      style={{ position: 'relative', width, height }}
      onContextMenu={handleContextMenu}
    >
      <DeckGL
        width={width}
        height={height}
        viewState={viewState}
        onViewStateChange={handleViewStateChange}
        onClick={handleClick}
        layers={layers}
        views={new MapView({ repeat: true })}
        controller={{
          dragRotate: true,
          dragPan: true,
          scrollZoom: true,
          touchZoom: true,
          touchRotate: true,
          keyboard: true
        }}
        getCursor={() => 'grab'}
        getTooltip={({ object, layer }) => {
          if (!object) return null;

          switch (layer?.id) {
            case 'buildings':
              return `Building: ${object.type || 'Unknown'}\nHeight: ${object.height?.toFixed(1) || 0}m`;
            case 'agents':
              return `Agent: ${object.agent_type || 'Unknown'}\nSpeed: ${object.speed?.toFixed(1) || 0} km/h`;
            case 'roads':
              return `Road: ${object.road_type || 'Unknown'}\nSpeed Limit: ${object.speed_limit || 0} km/h`;
            default:
              return `${layer?.id}: ${object.id || 'Unknown'}`;
          }
        }}
      />

      {/* Simple Controls */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px'
      }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Cityscape View</h4>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showZones}
            onChange={toggleZones}
            style={{ marginRight: '5px' }}
          />
          Show Zones
        </label>
      </div>

      {/* Status Indicator */}
      <div style={{
        position: 'absolute',
        bottom: 10,
        right: 10,
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '5px 10px',
        borderRadius: '3px',
        fontSize: '12px'
      }}>
        {layers.length} layers active
      </div>
    </div>
  );
}