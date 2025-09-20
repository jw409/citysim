import React, { useMemo, useCallback, useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { OrbitView } from '@deck.gl/core';
import { useSimulationContext } from '../contexts/SimulationContext';
import { useTerrainContext } from '../contexts/TerrainContext';
import { useCamera } from '../hooks/useCamera';
import { createBuildingLayer } from '../layers/BuildingLayer';
import { createAgentLayer } from '../layers/AgentLayer';
import { createRoadLayer } from '../layers/RoadLayer';
import { createZoneLayer } from '../layers/ZoneLayer';
import { getBoundsFromCityModel } from '../utils/coordinates';
import { PolygonLayer } from '@deck.gl/layers';
import { createEnhancedTerrainLayer } from '../layers/EnhancedTerrainLayer';

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
// Optimization layers
import { createChargingStationLayer } from '../layers/ChargingStationLayer';
import { OptimizationResult } from '../types/optimization';

interface CityscapeProps {
  width?: number;
  height?: number;
  optimizationResult?: OptimizationResult | null;
}


export function Cityscape({ width = 800, height = 600, optimizationResult }: CityscapeProps) {
  const { state } = useSimulationContext();
  const { state: terrainState } = useTerrainContext();
  const [showZones, setShowZones] = useState(false);

  // Initialize camera with proper 3D perspective
  const camera = useCamera({
    longitude: -74.0060,
    latitude: 40.7128,
    zoom: 14,      // Closer zoom for building detail
    pitch: 60,     // More angle for 3D effect
    bearing: -30   // Slight rotation for depth
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

    // Layer ordering for professional 3D visualization:
    // 1. Terrain (base) 2. River 3. Roads 4. Zones 5. Buildings 6. Agents

    // Add enhanced terrain layers as base
    if (state.cityModel?.bounds) {
      const terrainLayers = createEnhancedTerrainLayer({
        bounds: state.cityModel.bounds,
        terrainState,
        cityData
      });
      activeLayers.push(...terrainLayers);

      console.log('Enhanced terrain layers created:', {
        layerCount: terrainLayers.length,
        terrainEnabled: terrainState.isEnabled,
        activeTerrainLayer: terrainState.activeLayer,
        terrainProfile: terrainState.terrainProfile
      });
    }

    // Roads layer (above terrain, below buildings)
    activeLayers.push(createRoadLayer(cityData.roads || [], state.currentTime || 12));

    // Zones layer (optional, for debugging)
    if (showZones) {
      activeLayers.push(createZoneLayer(cityData.zones || [], state.currentTime || 12, true));
    }

    console.log('Creating building layer with buildings:', cityData.buildings?.length, cityData.buildings?.slice(0, 2));
    const buildingLayer = createBuildingLayer(cityData.buildings || [], state.currentTime || 12);
    console.log('Building layer created:', buildingLayer);
    activeLayers.push(buildingLayer);

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

    // Optimization results layer (charging stations)
    if (optimizationResult && optimizationResult.stations.length > 0) {
      activeLayers.push(
        createChargingStationLayer(
          optimizationResult.stations,
          optimizationResult.coverage_map,
          true, // showCoverage
          true  // showLabels
        )
      );
    }

    console.log(`Rendering ${activeLayers.length} layers (${activeLayers.map(l => l.id).join(', ')})`);

    return activeLayers;
  }, [state.cityModel, state.agents, state.currentTime, state.simulationData, showZones, terrainState, optimizationResult]);

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

  // Handle keyboard shortcuts for camera controls
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.target !== document.body) return; // Only handle when not in an input

      switch (event.key.toLowerCase()) {
        case '1':
          camera.presets.overview();
          break;
        case '2':
          camera.presets.street();
          break;
        case '3':
          camera.presets.aerial();
          break;
        case '4':
          camera.presets.isometric();
          break;
        case 'z':
          setShowZones(prev => !prev);
          break;
        case 'escape':
          if (camera.controls.followTarget) {
            camera.stopFollowing();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [camera, setShowZones]);

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
        views={new OrbitView({
          orbitAxis: 'Z',
          fov: 50,
          minZoom: 3,    // Allow much wider zoom for large city
          maxZoom: 20,
          minPitch: 0,
          maxPitch: 85
        })}
        controller={{
          dragRotate: true,
          dragPan: true,
          scrollZoom: true,
          touchZoom: true,
          touchRotate: true,
          keyboard: true,
          inertia: true,
          scrollZoomSpeed: 0.5,
          dragRotateSpeed: 0.01
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
          <div style={{ marginBottom: '3px', fontWeight: 'bold', color: '#fff' }}>Mouse Controls:</div>
          <div>🖱️ Left click + drag: Pan</div>
          <div>🖱️ Right click + drag: Rotate</div>
          <div>🖱️ Scroll: Zoom</div>
          <div>🖱️ Click agent: Follow</div>
          <div style={{ marginTop: '5px', marginBottom: '3px', fontWeight: 'bold', color: '#fff' }}>Keyboard Shortcuts:</div>
          <div>1,2,3,4: Camera presets</div>
          <div>Z: Toggle zones</div>
          <div>ESC: Stop following</div>
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