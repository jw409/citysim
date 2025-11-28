import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import DeckGL from '@deck.gl/react';
import { MapView } from '@deck.gl/core';
import { useSimulationContext } from '../contexts/SimulationContext';
import { useTerrainContext } from '../contexts/TerrainContext';
import { useCamera } from '../hooks/useCamera';
import { createBuildingLayer } from '../layers/BuildingLayer';
import { createAgentLayer } from '../layers/AgentLayer';
import { createRoadLayer } from '../layers/RoadLayer';
import { createTerrainLayer, createWaterLayer } from '../layers/TerrainLayer';
import { createGroundLayer } from '../layers/GroundLayer';
import {
  createAutonomousAgentLayer,
  generateAutonomousAgents,
} from '../layers/AutonomousAgentLayer';
import { createWeatherLayer, generateWeatherSystem, createWindLayer } from '../layers/WeatherLayer';
import { createEnhancedTerrainLayer } from '../layers/EnhancedTerrainLayer';

// Infrastructure layers
import { createSewerLayer } from '../layers/infrastructure/SewerLayer';
import { createUtilityTunnelLayer } from '../layers/infrastructure/UtilityTunnelLayer';
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
import { debugManager } from '../utils/debugUtils';
import { DebugOverlay } from './DebugOverlay';

interface CityscapeProps {
  optimizationResult?: OptimizationResult | null;
  showZones?: boolean;
  onToggleZones?: () => void;
  camera?: any;
}

export function Cityscape({
  optimizationResult,
  showZones = false,
  onToggleZones,
}: CityscapeProps) {
  const { state } = useSimulationContext();
  const { state: terrainState } = useTerrainContext();
  const [debugVisible, setDebugVisible] = useState(false);
  const deckRef = useRef<any>(null);

  // Track if we need to center on city model (one-time jump)
  const cityCenterSet = useRef(false);

  // Camera hook for presets and controls
  const camera = useCamera({
    longitude: -74.006,
    latitude: 40.7128,
    zoom: 14,
    pitch: 60,
    bearing: 30,
  });

  // DISABLED: Update camera to center on city when model loads (for static view)
  // useEffect(() => {
  //   if (state.cityModel) {
  //     console.log('Updating view state based on city model bounds...');
  //     const bounds = getBoundsFromCityModel(state.cityModel);
  //     camera.smoothTransitionTo(bounds, 1500);
  //   }
  // }, [state.cityModel, camera.smoothTransitionTo]);

  // DISABLED: Update camera follow targets when agents move (too distracting)
  // useEffect(() => {
  //   if (state.agents && state.agents.length > 0) {
  //     state.agents.forEach((agent: any) => {
  //       if (agent.position && agent.id) {
  //         camera.updateFollowTarget(
  //           agent.id,
  //           [agent.position.x, agent.position.y, agent.position.z || 5],
  //           'agent'
  //         );
  //       }
  //     });
  //   }
  // }, [state.agents]);

  // PERF FIX: Split layers into STATIC (expensive, rarely changes) and DYNAMIC (cheap, updates often)

  // STATIC LAYERS - Only recreate when city model or terrain changes (NOT on agent updates!)
  const staticLayers = useMemo(() => {
    const startTime = performance.now();
    performance.mark('staticLayers-start');
    console.log(
      '🔴 staticLayers useMemo EXECUTING at',
      startTime.toFixed(0),
      '- THIS SHOULD BE RARE!'
    );
    console.log('🔴 Dependencies:', {
      hasCityModel: !!state.cityModel,
      hasSimulationData: !!state.simulationData,
      terrainIsEnabled: terrainState.isEnabled,
      terrainScale: terrainState.scale,
      terrainSeed: terrainState.seed,
      terrainActiveLayer: terrainState.activeLayer,
      hasOptResult: !!optimizationResult,
    });

    const cityData = state.cityModel || { zones: [], roads: [], pois: [], buildings: [] };
    const enhancedData = state.simulationData;
    const layers: any[] = [];

    // Terrain layers (expensive to generate)
    if (state.cityModel?.bounds) {
      console.time('⏱️ createEnhancedTerrainLayer');
      const terrainLayers = createEnhancedTerrainLayer({
        bounds: state.cityModel.bounds,
        terrainState,
        cityData,
      });
      layers.push(...terrainLayers);
      console.timeEnd('⏱️ createEnhancedTerrainLayer');
    }

    // Base terrain layers
    console.time('⏱️ base terrain layers');
    layers.push(createGroundLayer());
    layers.push(createWaterLayer(cityData.river));
    layers.push(createTerrainLayer());
    console.timeEnd('⏱️ base terrain layers');

    // Static city infrastructure
    const centerLat = 40.7128;
    const centerLng = -74.006;

    // Autonomous agents (static decorative ones, not simulation agents)
    console.time('⏱️ autonomous agents');
    const autonomousAgents = generateAutonomousAgents(centerLat, centerLng, cityData);
    layers.push(...createAutonomousAgentLayer(autonomousAgents));
    console.timeEnd('⏱️ autonomous agents');

    // Weather (static)
    console.time('⏱️ weather system');
    const weatherData = generateWeatherSystem(centerLat, centerLng, 'clear');
    layers.push(createWeatherLayer(weatherData));
    layers.push(createWindLayer(centerLat, centerLng));
    console.timeEnd('⏱️ weather system');

    // Roads and buildings (static)
    layers.push(createRoadLayer(cityData.roads || [], 12));
    layers.push(createBuildingLayer(cityData.buildings || [], 12));

    // Infrastructure layers
    if (enhancedData?.infrastructure) {
      if (enhancedData.infrastructure.sewers?.length > 0) {
        layers.push(createSewerLayer(enhancedData.infrastructure.sewers));
      }
      if (enhancedData.infrastructure.utilities?.length > 0) {
        layers.push(createUtilityTunnelLayer(enhancedData.infrastructure.utilities));
      }
      if (enhancedData.infrastructure.parking?.length > 0) {
        layers.push(createUndergroundParkingLayer(enhancedData.infrastructure.parking));
      }
      if (enhancedData.infrastructure.elevatedRoads?.length > 0) {
        layers.push(createElevatedHighwayLayer(enhancedData.infrastructure.elevatedRoads));
      }
      if (enhancedData.infrastructure.skyBridges?.length > 0) {
        layers.push(createSkyBridgeLayer(enhancedData.infrastructure.skyBridges));
      }
      if (enhancedData.infrastructure.elevatedTransit?.length > 0) {
        layers.push(createElevatedTransitLayer(enhancedData.infrastructure.elevatedTransit));
      }
    }

    // Aerial traffic
    if (enhancedData?.aerialTraffic) {
      if (enhancedData.aerialTraffic.helicopters?.length > 0) {
        layers.push(createHelicopterLayer(enhancedData.aerialTraffic.helicopters));
      }
      if (enhancedData.aerialTraffic.aircraft?.length > 0) {
        layers.push(createAircraftLayer(enhancedData.aerialTraffic.aircraft));
      }
      if (enhancedData.aerialTraffic.drones?.length > 0) {
        layers.push(createDroneLayer(enhancedData.aerialTraffic.drones));
      }
    }

    // Optimization results
    if (optimizationResult && optimizationResult.stations.length > 0) {
      layers.push(
        createChargingStationLayer(
          optimizationResult.stations,
          optimizationResult.coverage_map,
          true,
          true
        )
      );
    }

    // Register with debug manager (only when static layers change)
    // PERF: Defer expensive spatial index building to not block initial render
    layers.forEach(layer => debugManager.registerLayer(layer));
    requestIdleCallback(() => debugManager.buildSpatialIndex(), { timeout: 5000 });

    performance.mark('staticLayers-end');
    performance.measure('staticLayers-total', 'staticLayers-start', 'staticLayers-end');
    const duration = performance.now() - startTime;
    console.log('🔴 staticLayers COMPLETED in', duration.toFixed(0), 'ms');
    return layers;
  }, [
    state.cityModel,
    state.simulationData,
    // PERF: Use specific terrainState properties instead of entire object
    // This prevents re-render when unrelated terrainState fields change
    terrainState.isEnabled,
    terrainState.scale,
    terrainState.seed,
    terrainState.activeLayer,
    optimizationResult,
    // NOTE: state.agents is NOT a dependency - that's the key optimization!
  ]);

  // DYNAMIC LAYERS - Only the agent layer, updates frequently but is cheap
  const agentLayer = useMemo(() => {
    console.log('🔵 agentLayer useMemo EXECUTING at', performance.now().toFixed(0));
    return createAgentLayer(state.agents, state.currentTime || 12);
  }, [state.agents, state.currentTime]);

  // Combine static + dynamic layers
  const layers = useMemo(() => {
    console.log('🟣 layers combine useMemo EXECUTING at', performance.now().toFixed(0));
    return [...staticLayers, agentLayer];
  }, [staticLayers, agentLayer]);

  // PERF: Minimal viewState handler - no state updates, no React re-renders
  const handleViewStateChange = useCallback(({ viewState: newViewState }: any) => {
    // Just update refs, no React state changes during interaction
    camera.viewState = newViewState;
  }, []);

  const handleClick = useCallback(
    (info: any) => {
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
    },
    [camera]
  );

  const toggleZones = useCallback(() => {
    if (onToggleZones) {
      onToggleZones();
    }
  }, [onToggleZones]);

  // Prevent right-click context menu on canvas
  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
  }, []);

  // PERF: Memoize DeckGL config objects to prevent unnecessary re-initialization
  const mapViews = useMemo(
    () => [
      new MapView({
        id: 'map',
        repeat: true,
        nearZMultiplier: 0.01,
        farZMultiplier: 1000,
        orthographic: false,
      }),
    ],
    []
  );

  const getTooltipCallback = useCallback(({ object, layer }: any) => {
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
  }, []);

  const getCursorCallback = useCallback(() => {
    return camera.controls.followTarget ? 'crosshair' : 'grab';
  }, [camera.controls.followTarget]);

  // Handle keyboard shortcuts for camera controls
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Allow keyboard shortcuts even when canvas has focus
      const target = event.target as HTMLElement;
      if (target && target.tagName === 'INPUT' && target.type === 'text') {
        return; // Don't handle when typing in text inputs
      }

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
          if (onToggleZones) {
            onToggleZones();
          }
          break;
        case 'escape':
          if (camera.controls.followTarget) {
            camera.stopFollowing();
          }
          break;
        case 'd':
          event.preventDefault(); // Prevent any default behavior
          setDebugVisible(!debugVisible);
          break;
      }
    };

    // Use capture phase to ensure we get the event before canvas handlers
    document.addEventListener('keydown', handleKeyPress, true);
    return () => document.removeEventListener('keydown', handleKeyPress, true);
  }, [camera, onToggleZones, debugVisible]);

  return (
    <div
      style={{ position: 'relative', width: '100%', height: '100%' }}
      onContextMenu={handleContextMenu}
    >
      <DeckGL
        ref={deckRef}
        width="100%"
        height="100%"
        // PERF FIX: Use initialViewState (uncontrolled) instead of viewState (controlled)
        // This prevents React re-renders on every mouse move during camera interaction
        initialViewState={{
          longitude: -74.006,
          latitude: 40.7128,
          zoom: 14,
          pitch: 60,
          bearing: 30,
        }}
        onViewStateChange={handleViewStateChange}
        onClick={handleClick}
        layers={layers}
        views={mapViews}
        // PERF: Optimized controller settings for smooth interaction
        controller={{
          inertia: true,
          scrollZoom: { smooth: true, speed: 0.01 },
          dragPan: true,
          dragRotate: true,
          doubleClickZoom: true,
          touchZoom: true,
          touchRotate: true,
          keyboard: true,
        }}
        // PERF: Use device pixels for sharper rendering but with performance cap
        useDevicePixels={1}
        // PERF: Disable auto-highlight to prevent expensive picking on hover
        _pickable={false}
        getCursor={getCursorCallback}
        // PERF: Disable tooltips entirely during initial test - they require picking
        // getTooltip={getTooltipCallback}
        style={{
          background: '#1a1a2e',
        }}
        // PERF: WebGL parameters for better performance
        parameters={{
          depthTest: true,
          blend: true,
        }}
      />

      {/* Status Indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          right: 10,
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '3px',
          fontSize: '12px',
        }}
      >
        {layers.length} layers active
      </div>

      {/* Debug Overlay */}
      <DebugOverlay isVisible={debugVisible} onToggle={() => setDebugVisible(!debugVisible)} />
    </div>
  );
}
