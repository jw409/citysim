import React, { useMemo, useCallback, useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { MapView } from '@deck.gl/core';
import { useSimulationContext } from '../contexts/SimulationContext';
import { useCamera } from '../hooks/useCamera';
import { createBuildingLayer } from '../layers/BuildingLayer';
import { createAgentLayer } from '../layers/AgentLayer';
import { createRoadLayer } from '../layers/RoadLayer';
import { createZoneLayer } from '../layers/ZoneLayer';
import { getBoundsFromCityModel } from '../utils/coordinates';
import { PolygonLayer } from '@deck.gl/layers';

// Infrastructure layers
import { createSewerLayer } from '../layers/infrastructure/SewerLayer';
import { createUtilityTunnelLayer } from '../layers/infrastructure/UtilityTunnelLayer';
import { createSubwayLayer } from '../layers/infrastructure/SubwayLayer';
import { createUndergroundParkingLayer } from '../layers/infrastructure/UndergroundParkingLayer';
// Elevated layers
import { createElevatedHighwayLayer } from '../layers/elevated/ElevatedHighwayLayer';
import { createSkyBridgeLayer } from '../layers/elevated/SkyBridgeLayer';
import { createElevatedTransitLayer } from '../layers/elevated/ElevatedTransitLayer';
// Aerial layers
import { createHelicopterLayer } from '../layers/aerial/HelicopterLayer';
import { createAircraftLayer } from '../layers/aerial/AircraftLayer';
import { createDroneLayer } from '../layers/aerial/DroneLayer';

interface CityscapeProps {
  width?: number;
  height?: number;
}

// Create a ground layer to provide contrast and context
function createGroundLayer(bounds: any) {
  const { min_x, min_y, max_x, max_y } = bounds;
  const padding = Math.max(max_x - min_x, max_y - min_y) * 0.2;

  // Create ground polygon
  const groundPolygon = [
    [min_x - padding, min_y - padding],
    [max_x + padding, min_y - padding],
    [max_x + padding, max_y + padding],
    [min_x - padding, max_y + padding]
  ];

  return new PolygonLayer({
    id: 'ground',
    data: [{ polygon: groundPolygon }],
    getPolygon: (d: any) => d.polygon.map((p: any) => [-74.0060 + (p[0] / 85000), 40.7128 + (p[1] / 111000)]),
    getFillColor: [45, 45, 45, 255], // Dark gray ground
    getLineColor: [70, 70, 70, 255],
    getLineWidth: 2,
    filled: true,
    stroked: true,
    extruded: false,
    pickable: false,
    getElevation: -1, // Below everything else
  });
}

export function Cityscape({ width = 800, height = 600 }: CityscapeProps) {
  const { state } = useSimulationContext();
  const [showZones, setShowZones] = useState(false);

  // Initialize camera with default view
  const camera = useCamera({
    longitude: -74.0060,
    latitude: 40.7128,
    zoom: 12,
    pitch: 45,
    bearing: 0
  });

  // Update view state when city model is available
  useEffect(() => {
    if (state.cityModel) {
      console.log('Updating view state based on city model bounds...');
      const bounds = getBoundsFromCityModel(state.cityModel);
      camera.smoothTransitionTo(bounds, 1500);
    }
  }, [state.cityModel]);

  // Update camera follow targets when agents move
  useEffect(() => {
    if (state.agents && state.agents.length > 0) {
      state.agents.forEach((agent: any) => {
        if (agent.position && agent.id) {
          camera.updateFollowTarget(
            agent.id,
            [agent.position.x, agent.position.y, agent.position.z || 5],
            'agent'
          );
        }
      });
    }
  }, [state.agents]);

  // Create layers with enhanced simulation data
  const layers = useMemo(() => {
    const cityData = state.cityModel || { zones: [], roads: [], pois: [], buildings: [] };
    const enhancedData = state.simulationData;
    const activeLayers: any[] = [];

    console.log('Creating layers with city data:', {
      zones: cityData.zones?.length || 0,
      roads: cityData.roads?.length || 0,
      buildings: cityData.buildings?.length || 0,
      agents: state.agents?.length || 0,
      hasEnhancedData: !!enhancedData
    });

    // Add ground/terrain layer first (bottom layer)
    if (state.cityModel?.bounds) {
      activeLayers.push(createGroundLayer(state.cityModel.bounds));
    }

    // Basic layers
    if (showZones) {
      activeLayers.push(createZoneLayer(cityData.zones || [], state.currentTime || 12, true));
    }

    activeLayers.push(createRoadLayer(cityData.roads || [], state.currentTime || 12));
    activeLayers.push(createBuildingLayer(cityData.buildings || [], state.currentTime || 12));
    activeLayers.push(createAgentLayer(state.agents, state.currentTime || 12));

    // Advanced layers (only if enhanced data is available)
    if (enhancedData?.infrastructure) {
      // Infrastructure layers (underground)
      if (enhancedData.infrastructure.sewers?.length > 0) {
        activeLayers.push(createSewerLayer(enhancedData.infrastructure.sewers));
      }
      if (enhancedData.infrastructure.utilities?.length > 0) {
        activeLayers.push(createUtilityTunnelLayer(enhancedData.infrastructure.utilities));
      }
      if (enhancedData.infrastructure.subway?.length > 0) {
        activeLayers.push(createSubwayLayer(enhancedData.infrastructure.subway));
      }
      if (enhancedData.infrastructure.parking?.length > 0) {
        activeLayers.push(createUndergroundParkingLayer(enhancedData.infrastructure.parking));
      }

      // Elevated layers
      if (enhancedData.infrastructure.elevatedRoads?.length > 0) {
        activeLayers.push(createElevatedHighwayLayer(enhancedData.infrastructure.elevatedRoads));
      }
      if (enhancedData.infrastructure.skyBridges?.length > 0) {
        activeLayers.push(createSkyBridgeLayer(enhancedData.infrastructure.skyBridges));
      }
      if (enhancedData.infrastructure.elevatedTransit?.length > 0) {
        activeLayers.push(createElevatedTransitLayer(enhancedData.infrastructure.elevatedTransit));
      }
    }

    // Aerial traffic layers
    if (enhancedData?.aerialTraffic) {
      if (enhancedData.aerialTraffic.helicopters?.length > 0) {
        activeLayers.push(createHelicopterLayer(enhancedData.aerialTraffic.helicopters));
      }
      if (enhancedData.aerialTraffic.aircraft?.length > 0) {
        activeLayers.push(createAircraftLayer(enhancedData.aerialTraffic.aircraft));
      }
      if (enhancedData.aerialTraffic.drones?.length > 0) {
        activeLayers.push(createDroneLayer(enhancedData.aerialTraffic.drones));
      }
    }

    console.log(`Rendering ${activeLayers.length} layers (${activeLayers.map(l => l.id).join(', ')})`);

    return activeLayers;
  }, [state.cityModel, state.agents, state.currentTime, state.simulationData, showZones]);

  const handleViewStateChange = useCallback(({ viewState: newViewState }: any) => {
    camera.setViewState(newViewState);
  }, [camera.setViewState]);

  const handleClick = useCallback((info: any) => {
    if (info.object) {
      console.log('Clicked object:', info.object);

      // If clicking on an agent, start following it
      if (info.layer?.id === 'agents' && info.object.id) {
        if (camera.controls.followTarget === info.object.id) {
          camera.stopFollowing();
        } else {
          camera.startFollowing(info.object.id);
        }
      }
    }
  }, [camera]);

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
        viewState={camera.viewState}
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
        getCursor={() => camera.controls.followTarget ? 'crosshair' : 'grab'}
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
        style={{
          background: '#1a1a2e'
        }}
      />

      {/* Camera and View Controls */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px',
        minWidth: '200px'
      }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Camera Controls</h4>

        {/* View Controls */}
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '5px' }}>
            <input
              type="checkbox"
              checked={showZones}
              onChange={toggleZones}
              style={{ marginRight: '5px' }}
            />
            Show Zones
          </label>
        </div>

        {/* Camera Presets */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>View Presets:</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
            <button onClick={camera.presets.overview} style={{ padding: '3px 6px', fontSize: '11px' }}>
              Overview
            </button>
            <button onClick={camera.presets.street} style={{ padding: '3px 6px', fontSize: '11px' }}>
              Street
            </button>
            <button onClick={camera.presets.aerial} style={{ padding: '3px 6px', fontSize: '11px' }}>
              Aerial
            </button>
            <button onClick={camera.presets.isometric} style={{ padding: '3px 6px', fontSize: '11px' }}>
              Isometric
            </button>
          </div>
        </div>

        {/* Follow Mode */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>Follow Mode:</div>
          {camera.controls.followTarget ? (
            <div style={{ fontSize: '11px' }}>
              <div style={{ color: '#4CAF50' }}>Following: {camera.controls.followTarget}</div>
              <button
                onClick={camera.stopFollowing}
                style={{ padding: '3px 6px', fontSize: '11px', marginTop: '3px' }}
              >
                Stop Following
              </button>
            </div>
          ) : (
            <div style={{ fontSize: '11px', color: '#999' }}>
              Click an agent to follow
            </div>
          )}
        </div>

        {/* Controls Help */}
        <div style={{ fontSize: '10px', color: '#ccc', marginTop: '10px', borderTop: '1px solid #444', paddingTop: '5px' }}>
          <div>🖱️ Left click + drag: Pan</div>
          <div>🖱️ Right click + drag: Rotate</div>
          <div>🖱️ Scroll: Zoom</div>
          <div>🖱️ Click agent: Follow</div>
        </div>
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