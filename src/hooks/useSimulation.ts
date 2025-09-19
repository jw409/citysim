import { useEffect, useCallback, useRef } from 'react';
import { useSimulationContext } from '../contexts/SimulationContext';
import { loadWasmModule, initializeSimulation, loadCityModel } from '../utils/wasmLoader';
import { generateMovingTestAgents } from '../utils/testAgents';

export function useSimulation() {
  const { state, dispatch } = useSimulationContext();
  const animationFrameRef = useRef<number>();
  const wasmModuleRef = useRef<any>(null);

  // Initialize simulation
  const initialize = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Load city model
      console.log('🚨 DEBUG: Loading city model...');
      const cityModel = await loadCityModel();
      console.log('🚨 DEBUG: City model loaded:', cityModel);
      dispatch({ type: 'SET_CITY_MODEL', payload: cityModel });

      // Try to load and initialize WASM module
      try {
        console.log('Attempting to load WASM module...');
        const wasmModule = await loadWasmModule();
        await initializeSimulation(cityModel);
        wasmModuleRef.current = wasmModule;
        console.log('WASM module loaded successfully');

        // Generate fallback agents if WASM doesn't provide them
        generateFallbackAgents(cityModel);
      } catch (wasmError) {
        console.warn('WASM module failed to load, using fallback mode:', wasmError);
        dispatch({
          type: 'SET_ERROR',
          payload: `WASM unavailable: ${wasmError instanceof Error ? wasmError.message : 'Unknown error'}`,
        });

        // Generate fallback agents for visualization
        generateFallbackAgents(cityModel);
      }

      dispatch({ type: 'SET_INITIALIZED', payload: true });
      dispatch({ type: 'SET_LOADING', payload: false });

      // Simulation starts paused - user can click PLAY to start
      console.log('Simulation initialized and ready - click PLAY to start');
    } catch (error) {
      console.error('Critical initialization error:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Unknown error',
      });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [dispatch]);

  // DISABLED: Client-side building generation (should use server-generated city data)
  const generateTestBuildings_DISABLED = useCallback(() => {
    const testBuildings = [];

    // Define city districts with much higher density like real cities
    const districts = [
      { centerX: 0, centerY: 0, radius: 600, density: 0.95, heightMult: 2.5, name: 'downtown' },
      { centerX: -800, centerY: -400, radius: 400, density: 0.85, heightMult: 1.4, name: 'midtown' },
      { centerX: 700, centerY: 600, radius: 450, density: 0.80, heightMult: 1.0, name: 'residential' },
      { centerX: -600, centerY: 700, radius: 350, density: 0.75, heightMult: 0.8, name: 'suburban' },
      { centerX: 900, centerY: -700, radius: 300, density: 0.85, heightMult: 1.6, name: 'business' },
      { centerX: -900, centerY: 200, radius: 250, density: 0.70, heightMult: 0.9, name: 'mixed' },
      { centerX: 200, centerY: -900, radius: 280, density: 0.75, heightMult: 1.1, name: 'commercial' },
    ];

    // City blocks with proper street layout
    const blockSize = 100; // 100m city blocks
    const streetWidth = 20; // 20m streets (including sidewalks)
    const blocksX = 40; // 40x40 city blocks
    const blocksY = 40;

    for (let blockX = 0; blockX < blocksX; blockX++) {
      for (let blockY = 0; blockY < blocksY; blockY++) {
        // Calculate block center position
        const blockCenterX = (blockX - blocksX/2) * (blockSize + streetWidth);
        const blockCenterY = (blockY - blocksY/2) * (blockSize + streetWidth);

        // Generate 1-4 buildings per block depending on density
        const buildingsPerBlock = 1 + ((blockX * 7 + blockY * 11) % 4);

        for (let b = 0; b < buildingsPerBlock; b++) {
          const x = blockCenterX + ((b % 2) - 0.5) * (blockSize * 0.4);
          const y = blockCenterY + (Math.floor(b / 2) - 0.5) * (blockSize * 0.4);

          // Check if this building should exist based on districts
          let buildingExists = false;
          let heightMultiplier = 0.6;
          let buildingType = 0;

          // Base urban density everywhere (like real cities)
          const baseSeed = (blockX * 73 + blockY * 37 + b * 13) % 100;
          if (baseSeed < 70) { // 70% base density
            buildingExists = true;
          }

          // Enhance density and characteristics in specific districts
          for (const district of districts) {
            const distToDistrict = Math.sqrt(
              (x - district.centerX) * (x - district.centerX) +
              (y - district.centerY) * (y - district.centerY)
            );

            if (distToDistrict < district.radius) {
              // Use deterministic random for consistent results
              const seed = (blockX * 73 + blockY * 37 + b * 13) % 100;
              if (seed < district.density * 100) {
                buildingExists = true;
                heightMultiplier = Math.max(heightMultiplier, district.heightMult);
                buildingType = district.name === 'downtown' ? 2 :
                             district.name === 'business' ? 1 :
                             district.name === 'midtown' ? 1 : 0;
              }
            }
          }

          if (buildingExists) {
            // Calculate realistic height based on district and position
            const baseHeight = 12 + (heightMultiplier * 40);
            const variation = ((blockX * 7 + blockY * 11 + b * 5) % 50) - 25; // ±25m variation
            const height = Math.max(8, baseHeight + variation);

            // Buildings sized to fit within city blocks
            const sizeSeed = (blockX * 5 + blockY * 7 + b * 3) % 20;
            const buildingWidth = 20 + sizeSeed; // 20-40m width
            const aspectSeed = (blockX + blockY * 3 + b) % 8;
            const aspectRatio = 0.6 + aspectSeed * 0.1; // 0.6-1.3 aspect ratio
            const buildingDepth = buildingWidth * aspectRatio;

            // No offset - buildings align to block grid
            testBuildings.push({
              id: `building_${blockX}_${blockY}_${b}`,
              footprint: [
                { x: x - buildingWidth/2, y: y - buildingDepth/2 },
                { x: x + buildingWidth/2, y: y - buildingDepth/2 },
                { x: x + buildingWidth/2, y: y + buildingDepth/2 },
                { x: x - buildingWidth/2, y: y + buildingDepth/2 },
              ],
              height: height,
              stories: Math.ceil(height / 3.5),
              building_type: buildingType,
              type: buildingType,
            });
          }
        }
      }
    }

    console.log(`Generated ${testBuildings.length} buildings in ${blocksX}x${blocksY} city blocks`);
    return testBuildings;
  }, []);

  // Generate fallback buildings and agents for testing when WASM is unavailable
  const generateFallbackAgents = useCallback(
    (cityModel: any) => {
      console.log('🚨 DEBUG: generateFallbackAgents called with cityModel:', !!cityModel);
      // Use the real city data, not random test buildings
      const buildings = cityModel?.buildings || [];

      console.log('🚨 DEBUG: Setting persistent test buildings:', buildings.length);

      // Update city model with persistent buildings
      const updatedCityModel = { ...cityModel, buildings };
      dispatch({ type: 'SET_CITY_MODEL', payload: updatedCityModel });

      const agents: any[] = [];
      const pois = updatedCityModel.pois || [];
      const buildingsForAgents = updatedCityModel.buildings || [];

      console.log('Generating fallback agents...', {
        pois: pois.length,
        buildings: buildingsForAgents.length,
      });

      // Generate agents from POIs
      pois.forEach((poi: any, index: number) => {
        if (poi.type === 0 && agents.length < 20) {
          // HOME POIs, limit to 20 agents
          const numAgents = Math.min(3, Math.floor((poi.capacity || 50) / 20));

          for (let i = 0; i < numAgents; i++) {
            const agentId = agents.length;
            // Use deterministic positioning based on agent ID
            const offsetSeed = (agentId * 17 + index * 5) % 100;
            const offsetX = (offsetSeed % 50) - 25;
            const offsetY = ((offsetSeed * 3) % 50) - 25;

            const agent = {
              id: agentId,
              position: {
                x: poi.position.x + offsetX,
                y: poi.position.y + offsetY,
                z: 5,
              },
              agent_type: agentId % 3 === 0 ? 'Car' : 'Pedestrian',
              speed: 5 + (agentId % 15),
              state: 'Traveling',
              destination: `poi_${agentId % pois.length}`,
              path: [],
              path_progress: 0,
              initialPosition: {
                x: poi.position.x + offsetX,
                y: poi.position.y + offsetY,
                z: 5,
              },
            };
            agents.push(agent);
          }
        }
      });

      // If no POIs, generate agents from buildings
      if (agents.length === 0 && buildingsForAgents.length > 0) {
        buildingsForAgents.slice(0, 10).forEach((building: any, index: number) => {
          if (building.footprint && building.footprint.length > 0) {
            const centerX =
              building.footprint.reduce((sum: number, p: any) => sum + p.x, 0) /
              building.footprint.length;
            const centerY =
              building.footprint.reduce((sum: number, p: any) => sum + p.y, 0) /
              building.footprint.length;

            const agentId = agents.length;
            const agent = {
              id: agentId,
              position: { x: centerX, y: centerY, z: 5 },
              agent_type: agentId % 3 === 0 ? 'Car' : 'Pedestrian',
              speed: 5 + (agentId % 15),
              state: 'Traveling',
              destination: `building_${agentId % buildings.length}`,
              path: [],
              path_progress: 0,
              initialPosition: { x: centerX, y: centerY, z: 5 },
            };
            agents.push(agent);
          }
        });
      }

      // Add test agents for immediate first/third person view testing
      const testAgents = generateMovingTestAgents(12);
      agents.push(...testAgents);

      console.log(`🚨 DEBUG: Generated ${agents.length} fallback agents (including ${testAgents.length} test agents)`);
      console.log('🚨 DEBUG: Agents array:', agents);
      dispatch({ type: 'SET_AGENTS', payload: agents });

      // DEBUG: Force immediate stats update
      console.log('🚨 DEBUG: Forcing stats update');
      dispatch({
        type: 'UPDATE_STATS',
        payload: {
          totalAgents: agents.length,
          activeAgents: agents.length,
          averageSpeed: 10,
        },
      });

      // Start basic agent animation if we have agents
      if (agents.length > 0) {
        startFallbackAnimation();
      }
    },
    [dispatch]
  );

  // Store initial agent state to prevent re-creating animation
  const initialAgentsRef = useRef<any[]>([]);

  // Basic animation for fallback agents - create realistic movement patterns
  const startFallbackAnimation = useCallback(() => {
    // Store the initial positions once
    initialAgentsRef.current = state.agents.map(agent => ({
      ...agent,
      initialPosition: agent.initialPosition || agent.position,
      animationStartTime: Date.now(),
      targetPosition: null,
      movementPath: [],
    }));

    console.log(`${initialAgentsRef.current.length} agents created with movement animation`);
  }, [state.agents]);

  // Start simulation
  const start = useCallback(() => {
    if (!state.isInitialized) return;

    if (wasmModuleRef.current) {
      wasmModuleRef.current.start();
    }
    dispatch({ type: 'SET_RUNNING', payload: true });
    console.log('Simulation started');
  }, [state.isInitialized, dispatch]);

  // Pause simulation
  const pause = useCallback(() => {
    // Cancel animation frame to stop the time loop
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }

    // Also pause WASM if available
    if (wasmModuleRef.current) {
      wasmModuleRef.current.pause();
    }

    dispatch({ type: 'SET_RUNNING', payload: false });
    console.log('Simulation paused');
  }, [dispatch]);

  // Set simulation speed
  const setSpeed = useCallback(
    (speed: number) => {
      // Update speed in state (works even without WASM)
      dispatch({ type: 'SET_SPEED', payload: speed });

      // Also update WASM speed if available
      if (wasmModuleRef.current) {
        wasmModuleRef.current.setSpeed(speed);
      }

      console.log(`Simulation speed set to ${speed}x`);
    },
    [dispatch]
  );

  // Update simulation (called every frame)
  const updateSimulation = useCallback(() => {
    if (!state.isRunning) return;

    try {
      if (wasmModuleRef.current) {
        // WASM mode - use real simulation
        wasmModuleRef.current.tick();

        const agents = wasmModuleRef.current.getAgentStates();
        dispatch({ type: 'SET_AGENTS', payload: agents });

        const currentTime = wasmModuleRef.current.getSimulationTime();
        const day = Math.floor(currentTime / 24);
        const timeOfDay = currentTime % 24;
        dispatch({ type: 'SET_TIME', payload: { time: timeOfDay, day } });

        if (Math.random() < 0.1) {
          const trafficData = wasmModuleRef.current.getTrafficData();
          dispatch({ type: 'SET_TRAFFIC_DATA', payload: trafficData });
        }

        dispatch({
          type: 'UPDATE_STATS',
          payload: {
            totalAgents: agents.length,
            activeAgents: agents.filter((a: any) => a.state === 'Traveling').length,
            averageSpeed:
              agents.reduce((sum: number, a: any) => sum + (a.speed || 0), 0) /
              Math.max(agents.length, 1),
          },
        });
      } else {
        // Fallback mode - animate agents with realistic movement patterns
        const now = Date.now();
        const newTime = (state.currentTime + 0.05 * state.speed) % 24;
        const newDay = state.day + (newTime < state.currentTime ? 1 : 0);

        dispatch({ type: 'SET_TIME', payload: { time: newTime, day: newDay } });

        // Animate agents if we have initial positions
        if (initialAgentsRef.current.length > 0) {
          const animatedAgents = initialAgentsRef.current.map((agent, index) => {
            const timeSinceStart = (now - agent.animationStartTime) / 1000; // seconds
            const agentSeed = index * 17 + 3; // Deterministic per agent

            // Create smooth, repeating movement patterns
            const radiusScale = 50 + (agentSeed % 100); // 50-150 unit radius
            const speedScale = 0.3 + (agentSeed % 20) / 100; // Speed variation
            const phaseOffset = (agentSeed % 360) * (Math.PI / 180); // Different starting phases

            // Use sine/cosine for smooth circular movement
            const angle = (timeSinceStart * speedScale + phaseOffset) % (Math.PI * 2);
            const offsetX = Math.cos(angle) * radiusScale;
            const offsetY = Math.sin(angle) * radiusScale;

            const newPosition = {
              x: agent.initialPosition.x + offsetX,
              y: agent.initialPosition.y + offsetY,
              z: agent.initialPosition.z + Math.sin(angle * 2) * 2, // Slight vertical movement
            };

            // Calculate movement direction for heading (in degrees)
            const velocityX = -Math.sin(angle) * radiusScale * speedScale;
            const velocityY = Math.cos(angle) * radiusScale * speedScale;
            const heading = Math.atan2(velocityY, velocityX) * (180 / Math.PI);

            // Calculate speed for stats
            const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);

            return {
              ...agent,
              position: newPosition,
              speed: speed,
              state: 'Traveling',
              heading: heading, // Add heading for camera following
            };
          });

          dispatch({ type: 'SET_AGENTS', payload: animatedAgents });

          // Calculate realistic stats
          const totalSpeed = animatedAgents.reduce((sum, agent) => sum + agent.speed, 0);
          const averageSpeed = totalSpeed / Math.max(animatedAgents.length, 1);

          dispatch({
            type: 'UPDATE_STATS',
            payload: {
              totalAgents: animatedAgents.length,
              activeAgents: animatedAgents.length,
              averageSpeed: averageSpeed,
            },
          });
        }
      }
    } catch (error) {
      console.error('Simulation update error:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, [state.isRunning, state.currentTime, state.day, state.speed, state.agents.length, dispatch]);

  // Handle world updates (adding/removing POIs)
  const updateWorld = useCallback(
    (event: any) => {
      if (!wasmModuleRef.current) return;

      try {
        wasmModuleRef.current.updateWorld(event);
      } catch (error) {
        console.error('World update error:', error);
        dispatch({
          type: 'SET_ERROR',
          payload: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
    [dispatch]
  );

  // Animation loop
  useEffect(() => {
    function animate() {
      updateSimulation();
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    if (state.isRunning) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state.isRunning, updateSimulation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wasmModuleRef.current) {
        try {
          wasmModuleRef.current.destroy();
        } catch (error) {
          console.error('WASM cleanup error:', error);
        }
      }
    };
  }, []);

  return {
    initialize,
    start,
    pause,
    setSpeed,
    updateWorld,
    isInitialized: state.isInitialized,
    isLoading: state.isLoading,
    error: state.error,
  };
}
