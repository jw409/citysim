import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import DeckGL from '@deck.gl/react';
import { MapView, COORDINATE_SYSTEM } from '@deck.gl/core';
import { useSimulationContext } from '../contexts/SimulationContext';
import { useCamera } from '../hooks/useCamera';
import { createBuildingLayer } from '../layers/BuildingLayer';
import { createAsset3DLayer } from '../layers/Asset3DLayer';
import { createRoadLayer } from '../layers/RoadLayer';
import { createZoneLayer } from '../layers/ZoneLayer';
import { ColumnLayer } from '@deck.gl/layers';
import { LightingEffect, AmbientLight, DirectionalLight } from '@deck.gl/core';
import { convertPointsToLatLng } from '../utils/coordinates';
// import { getBoundsFromCityModel } from '../utils/coordinates';
import { generateTerrainLayers } from '../utils/terrainGenerator';
import { loadPlanetaryTerrain, getCachedPlanetaryTerrain } from '../utils/terrainLoader';
// import { PlanetaryTerrain } from './PlanetaryTerrain';
// import { CelestialBodies } from './CelestialBodies';
// import { AtmosphericEffects } from './AtmosphericEffects';
import { PlanetaryControls } from './PlanetaryControls';
import { ViewModeSelector } from './ViewModeSelector';
import { AgentSelector } from './AgentSelector';
import { TestAgentButton } from './TestAgentButton';

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
  onCameraUpdate?: (camera: { longitude: number; latitude: number; zoom: number; pitch: number; bearing: number }) => void;
}

export function Cityscape({ width = 800, height = 600, optimizationResult, onCameraUpdate }: CityscapeProps) {
  const { state } = useSimulationContext();
  const [showZones, setShowZones] = useState(false);

  // Planetary view state
  const [planetaryScale, setPlanetaryScale] = useState(1);
  const [showAtmosphere, setShowAtmosphere] = useState(true);
  const [showClouds, setShowClouds] = useState(true);
  const [showMoon, setShowMoon] = useState(true);
  const [showSun, setShowSun] = useState(true);
  const [weatherIntensity, setWeatherIntensity] = useState(0.3);
  const [animateTime, setAnimateTime] = useState(false);
  const animationRef = useRef<number>();

  // Load planetary terrain data on component mount
  useEffect(() => {
    loadPlanetaryTerrain();
  }, []);

  // Initialize camera with 3D view
  const camera = useCamera({
    longitude: -74.006,
    latitude: 40.7128,
    zoom: 15,
    pitch: 45, // Always use 3D angled view
    bearing: 0,
  });

  // FORCE CAMERA RESET - Add immediate reset to NYC center with 3D view
  useEffect(() => {
    console.log('🎥 FORCING CAMERA RESET TO NYC CENTER WITH 3D VIEW');
    camera.setViewState({
      longitude: -74.006,
      latitude: 40.7128,
      zoom: 15,
      pitch: 45, // 3D angled view
      bearing: 0
    });
    console.log('📹 Camera state after reset:', camera.viewState);
  }, []); // Run once on mount

  // Send camera updates to parent for debugging - THROTTLED to prevent infinite loops
  useEffect(() => {
    if (onCameraUpdate) {
      // Throttle updates to prevent rapid fire updates causing crashes
      const timeoutId = setTimeout(() => {
        onCameraUpdate(camera.viewState);
      }, 100); // 100ms throttle

      return () => clearTimeout(timeoutId);
    }
  }, [camera.viewState.longitude, camera.viewState.latitude, camera.viewState.zoom]); // Only update on key changes

  // Update view state when city model is available - TEMPORARILY DISABLED
  useEffect(() => {
    if (state.cityModel) {
      console.log('🚫 CITY MODEL BOUNDS TRANSITION DISABLED FOR DEBUGGING');
      console.log('City model bounds:', state.cityModel.bounds);
      // const bounds = getBoundsFromCityModel(state.cityModel);
      // camera.smoothTransitionTo(bounds, 1500);
    }
  }, [state.cityModel]); // camera functions are stable, no need to include

  // Update camera follow targets when agents move
  useEffect(() => {
    if (state.agents && state.agents.length > 0) {
      state.agents.forEach((agent: any) => {
        if (agent.position && agent.id) {
          // Calculate heading from agent's movement direction
          const heading = agent.heading ||
            (agent.path && agent.path.length > 1 ?
              Math.atan2(
                agent.path[1].y - agent.path[0].y,
                agent.path[1].x - agent.path[0].x
              ) * (180 / Math.PI) : 0);

          camera.updateFollowTarget(
            agent.id,
            [agent.position.x, agent.position.y, agent.position.z || 5],
            'agent',
            heading,
            agent.agent_type
          );
        }
      });
    }
  }, [state.agents]); // camera functions are stable, no need to include

  // Time animation effect
  useEffect(() => {
    if (animateTime) {
      const animate = () => {
        const newTime = ((state.currentTime || 0) + 0.1) % 24;
        // Note: This would need to be connected to the simulation context
        // For now, we'll just use the current time from state
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animateTime, state.currentTime]);

  // Maintain 3D view for all scales
  useEffect(() => {
    if (planetaryScale > 100) {
      // For planetary scales, adjust zoom but keep 3D pitch
      camera.setViewState({
        ...camera.viewState,
        zoom: Math.max(8, camera.viewState.zoom - Math.log10(planetaryScale)),
        pitch: 45, // Always maintain 3D view
      });
    }
  }, [planetaryScale]);

  // Create lighting effects for 3D rendering
  const lightingEffect = useMemo(() => {
    const ambientLight = new AmbientLight({
      color: [255, 255, 255],
      intensity: 0.3
    });

    const directionalLight = new DirectionalLight({
      color: [255, 255, 255],
      intensity: 1.0,
      direction: [-1, -1, -2],
      _shadow: true
    });

    return new LightingEffect({ ambientLight, directionalLight });
  }, []);

  // Calculate sun position for lighting effects
  const sunPosition = useMemo(() => {
    if (!state.cityModel?.bounds) return { x: 0, y: 0, z: 1000 };

    const { min_x, min_y, max_x, max_y } = state.cityModel.bounds;
    const centerX = (min_x + max_x) / 2;
    const centerY = (min_y + max_y) / 2;
    const viewRadius = Math.max(max_x - min_x, max_y - min_y) * 2;

    const currentTime = state.currentTime || 12;
    const sunAngle = ((currentTime - 6) / 12) * Math.PI; // Daytime arc
    const sunElevation = Math.max(0, Math.sin(sunAngle)) * viewRadius * 0.8;
    const sunAzimuth = ((currentTime - 6) / 12) * Math.PI - Math.PI / 2;

    return {
      x: centerX + Math.cos(sunAzimuth) * viewRadius,
      y: centerY + Math.sin(sunAzimuth) * viewRadius * 0.3,
      z: sunElevation + viewRadius * 0.2,
    };
  }, [state.cityModel?.bounds, state.currentTime]);

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
      hasEnhancedData: !!enhancedData,
      planetaryScale,
      showAtmosphere,
      hasCityModel: !!state.cityModel,
      cityBounds: state.cityModel?.bounds,
      hasPlanetaryTerrain: !!state.cityModel?.planetaryTerrain,
      planetaryTerrainScales: state.cityModel?.planetaryTerrain?.length || 0,
    });

    if (state.cityModel?.bounds) {
      const { min_x, min_y, max_x, max_y } = state.cityModel.bounds;
      const terrainSeed = Math.abs(min_x + min_y + max_x + max_y) % 100000;
      const currentTime = state.currentTime || 12;

      // Layer ordering for planetary visualization:
      // 1. Celestial bodies (background) 2. Atmospheric effects 3. Planetary terrain 4. City elements

      // TEMPORARILY DISABLE TERRAIN LAYERS TO SEE BUILDINGS
      console.log('🚫 TERRAIN LAYERS DISABLED FOR BUILDING DEBUG');
      // const cachedTerrain = getCachedPlanetaryTerrain();
      // const terrainLayers = generateTerrainLayers(
      //   state.cityModel.bounds,
      //   currentTime,
      //   terrainSeed,
      //   planetaryScale,
      //   cachedTerrain?.scales
      // );
      // activeLayers.push(...terrainLayers);

      // console.log(`Added ${terrainLayers.length} terrain layers for scale ${planetaryScale}`);
    }

    console.log('🏗️ BUILDING LAYER RESTORATION - Now that DeckGL works, restore city data');

    // Now that basic rendering works, let's add the real city layers

    // Always show city elements for debugging 3D buildings
    if (true) {
      // Roads layer (above terrain, below buildings)
      activeLayers.push(createRoadLayer(cityData.roads || [], state.currentTime || 12));

      // Zones layer (optional, for debugging)
      if (showZones) {
        activeLayers.push(createZoneLayer(cityData.zones || [], state.currentTime || 12, true));
      }

      // 🏢 BUILDINGS - Key 3D city elements
      console.log('🏢 Building data check:', {
        buildingCount: cityData.buildings?.length || 0,
        sampleBuilding: cityData.buildings?.[0],
        hasFootprint: cityData.buildings?.[0]?.footprint?.length > 0
      });

      if (cityData.buildings && cityData.buildings.length > 0) {
        const buildingLayer = createBuildingLayer(cityData.buildings, state.currentTime || 12);
        activeLayers.push(buildingLayer);
        console.log('✅ Buildings added to render stack:', cityData.buildings.length);
        console.log('🔍 Building layer details:', {
          id: buildingLayer.id,
          extruded: buildingLayer.props.extruded,
          elevationScale: buildingLayer.props.elevationScale,
          sampleData: cityData.buildings.slice(0, 2)
        });
      } else {
        console.log('⚠️ No building data available - buildings should be generated by simulation');
      }

      // Create 3D agent layers with LOD support
      const agentLayers = createAsset3DLayer({
        agents: (state.agents || []).map(agent => ({
          ...agent,
          id: agent.id.toString() // Convert number ID to string for compatibility
        })),
        timeOfDay: state.currentTime || 12,
        cameraPosition: [camera.viewState.longitude, camera.viewState.latitude, 0],
        enableLOD: true
      });
      activeLayers.push(...agentLayers);
    } else {
      console.log(`Skipping detailed city layers for planetary scale ${planetaryScale}`);
    }

    // Advanced layers (only if enhanced data is available and scale is appropriate)
    if (enhancedData?.infrastructure && planetaryScale <= 20) {
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

    // Aerial traffic layers (show at all scales for realism)
    if (enhancedData?.aerialTraffic && planetaryScale <= 100) {
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
          true // showLabels
        )
      );
    }

    console.log(
      `Rendering ${activeLayers.length} layers (${activeLayers.map(l => l.id).join(', ')})`
    );

    return activeLayers;
  }, [
    state.cityModel,
    state.agents,
    state.currentTime,
    state.simulationData,
    showZones,
    planetaryScale,
    showAtmosphere,
    showClouds,
    showMoon,
    showSun,
    weatherIntensity,
  ]);

  const handleViewStateChange = useCallback(({ viewState: newViewState }: any) => {
    console.log('🎥 View state changing:', newViewState);
    camera.setViewState(newViewState);
  }, []); // camera.setViewState is stable

  const handleClick = useCallback(
    (info: any) => {
      if (info.object) {
        console.log('Clicked object:', info.object);

        // If clicking on an agent, start following it
        const isAgentLayer = info.layer?.id?.includes('agents') || info.layer?.id === 'agents';
        if (isAgentLayer && info.object.id) {
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
        case 'v':
          camera.toggleViewMode();
          break;
        case 'f':
          if (camera.controls.followTarget) {
            camera.setViewMode('first-person');
          }
          break;
        case 't':
          if (camera.controls.followTarget) {
            camera.setViewMode('third-person');
          }
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

  // 🚨 FINAL DECK.GL DEBUG CHECK
  console.log('🎯 FINAL DECKGL RENDER - About to render with:');
  console.log('   📐 Dimensions:', width, 'x', height);
  console.log('   🎥 ViewState:', camera.viewState);
  console.log('   📋 Layers:', layers.length, layers.map(l => l.id));

  return (
    <div style={{ position: 'relative', width, height }} onContextMenu={handleContextMenu}>
      <DeckGL
        width={width}
        height={height}
        viewState={camera.viewState as any}
        onViewStateChange={handleViewStateChange}
        onClick={handleClick}
        layers={layers}
        views={[
          new MapView({
            id: 'map',
            controller: true
          })
        ]}
        controller={true}
        getCursor={() => (camera.controls.followTarget ? 'crosshair' : 'grab')}
        effects={[lightingEffect]}
        glOptions={{
          stencil: true
        }}
        getTooltip={({ object, layer }) => {
          if (!object) return null;

          switch (layer?.id) {
            case 'buildings':
              const buildingType = object.type === 0 ? 'Residential' :
                                 object.type === 1 ? 'Commercial' :
                                 object.type === 2 ? 'Industrial' :
                                 object.type === 3 ? 'Office' : 'Mixed Use';

              return {
                html: `<div style="background: rgba(0,0,0,0.8); color: white; padding: 8px; border-radius: 4px; font-size: 12px;">
                  <div style="font-weight: bold; color: #4CAF50;">${object.address || 'Unknown Address'}</div>
                  <div style="color: #FFC107;">${buildingType} Building</div>
                  <div>Height: ${object.height?.toFixed(1) || 0}m (${Math.ceil((object.height || 0) / 3.5)} floors)</div>
                  <div>Capacity: ${object.capacity || 0} ${object.type === 0 ? 'residents' : object.type === 3 ? 'workers' : 'people'}</div>
                  <div>Occupancy: ${object.occupancy || 0}/${object.capacity || 0} (${Math.round(((object.occupancy || 0) / (object.capacity || 1)) * 100)}%)</div>
                </div>`,
                style: { pointerEvents: 'none' }
              };

            case 'agents':
              return {
                html: `<div style="background: rgba(0,0,0,0.8); color: white; padding: 8px; border-radius: 4px; font-size: 12px;">
                  <div style="font-weight: bold; color: #2196F3;">${object.agent_type || 'Unknown'} Agent</div>
                  <div>Speed: ${object.speed?.toFixed(1) || 0} km/h</div>
                  <div>Status: ${object.state || 'Unknown'}</div>
                  <div>ID: ${object.id}</div>
                </div>`,
                style: { pointerEvents: 'none' }
              };

            case 'roads':
              return {
                html: `<div style="background: rgba(0,0,0,0.8); color: white; padding: 8px; border-radius: 4px; font-size: 12px;">
                  <div style="font-weight: bold; color: #FF9800;">${object.name || 'Unknown Street'}</div>
                  <div>Speed Limit: ${object.speed_limit || 40} km/h</div>
                  <div>Current Speed: ${object.current_speed || 0} km/h</div>
                  <div style="color: ${object.traffic_level === 'Light' ? '#4CAF50' :
                                      object.traffic_level === 'Moderate' ? '#FFC107' :
                                      object.traffic_level === 'Heavy' ? '#FF5722' : '#F44336'};">
                    Traffic: ${object.traffic_level || 'Unknown'}
                  </div>
                  <div>Width: ${object.width || 0}m</div>
                </div>`,
                style: { pointerEvents: 'none' }
              };

            default:
              return `${layer?.id}: ${object.id || 'Unknown'}`;
          }
        }}
        style={{
          background: '#2c2c2c', // Dark ground color instead of terrain
        }}
        onWebGLInitialized={(gl) => {
          console.log('🎮 WebGL Context Initialized:', gl);
          console.log('🎮 WebGL Version:', gl.getParameter(gl.VERSION));
          console.log('🎮 WebGL Vendor:', gl.getParameter(gl.VENDOR));
          console.log('🎮 WebGL Renderer:', gl.getParameter(gl.RENDERER));
        }}
        onError={(error) => {
          console.error('🚨 DeckGL Error:', error);
        }}
        onLoad={() => {
          console.log('✅ DeckGL Loaded Successfully');
        }}
      />

      {/* Camera and View Controls */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '12px',
          minWidth: '200px',
        }}
      >
        <h4 style={{ margin: '0 0 10px 0' }}>Camera Controls</h4>

        {/* View Controls */}
        <div style={{ marginBottom: '10px' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              marginBottom: '5px',
            }}
          >
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
            <button
              onClick={camera.presets.overview}
              style={{ padding: '3px 6px', fontSize: '11px' }}
            >
              Overview
            </button>
            <button
              onClick={camera.presets.street}
              style={{ padding: '3px 6px', fontSize: '11px' }}
            >
              Street
            </button>
            <button
              onClick={camera.presets.aerial}
              style={{ padding: '3px 6px', fontSize: '11px' }}
            >
              Aerial
            </button>
            <button
              onClick={camera.presets.isometric}
              style={{ padding: '3px 6px', fontSize: '11px' }}
            >
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
            <div style={{ fontSize: '11px', color: '#999' }}>Click an agent to follow</div>
          )}
        </div>

        {/* Controls Help */}
        <div
          style={{
            fontSize: '10px',
            color: '#ccc',
            marginTop: '10px',
            borderTop: '1px solid #444',
            paddingTop: '5px',
          }}
        >
          <div style={{ marginBottom: '3px', fontWeight: 'bold', color: '#fff' }}>
            Mouse Controls:
          </div>
          <div>🖱️ Left click + drag: Pan</div>
          <div>🖱️ Right click + drag: Rotate</div>
          <div>🖱️ Scroll: Zoom</div>
          <div>🖱️ Click agent: Follow</div>
          <div style={{ marginTop: '5px', marginBottom: '3px', fontWeight: 'bold', color: '#fff' }}>
            Keyboard Shortcuts:
          </div>
          <div>1,2,3,4: Camera presets</div>
          <div>V: Toggle view mode</div>
          <div>F: First person</div>
          <div>T: Third person</div>
          <div>Z: Toggle zones</div>
          <div>ESC: Stop following</div>
        </div>
      </div>

      {/* Planetary Controls */}
      <PlanetaryControls
        scale={planetaryScale}
        timeOfDay={state.currentTime || 12}
        showAtmosphere={showAtmosphere}
        showClouds={showClouds}
        showMoon={showMoon}
        showSun={showSun}
        weatherIntensity={weatherIntensity}
        animateTime={animateTime}
        onScaleChange={setPlanetaryScale}
        onTimeChange={time => {
          // This would need to be connected to your simulation context
          // For now, we'll just log it
          console.log('Time changed to:', time);
        }}
        onAtmosphereToggle={setShowAtmosphere}
        onCloudsToggle={setShowClouds}
        onMoonToggle={setShowMoon}
        onSunToggle={setShowSun}
        onWeatherChange={setWeatherIntensity}
        onAnimateToggle={setAnimateTime}
      />

      {/* Test Agent Button */}
      <TestAgentButton />

      {/* View Mode Selector */}
      <ViewModeSelector
        currentMode={camera.controls.viewMode}
        followTarget={camera.controls.followTarget}
        followDistance={camera.controls.followDistance}
        cameraLag={camera.controls.cameraLag}
        onModeChange={camera.setViewMode}
        onToggleMode={camera.toggleViewMode}
        onDistanceChange={camera.setFollowDistance}
        onLagChange={camera.setCameraLag}
      />

      {/* Agent Selector */}
      <AgentSelector
        agents={state.agents || []}
        followTarget={camera.controls.followTarget}
        onSelectAgent={camera.startFollowing}
        onStopFollowing={camera.stopFollowing}
        cameraPosition={[camera.viewState.longitude, camera.viewState.latitude, 0]}
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
        {layers.length} layers active • Scale: {planetaryScale}x
      </div>
    </div>
  );
}
