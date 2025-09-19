import { useEffect, useCallback, useRef } from 'react';
import { useSimulationContext } from '../contexts/SimulationContext';
import { loadWasmModule, initializeSimulation, loadCityModel } from '../utils/wasmLoader';

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
      console.log('Loading city model...');
      const cityModel = await loadCityModel();
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
        dispatch({ type: 'SET_ERROR', payload: `WASM unavailable: ${wasmError instanceof Error ? wasmError.message : 'Unknown error'}` });

        // Generate fallback agents for visualization
        generateFallbackAgents(cityModel);
      }

      dispatch({ type: 'SET_INITIALIZED', payload: true });
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      console.error('Critical initialization error:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [dispatch]);

  // Generate persistent test buildings
  const generateTestBuildings = useCallback(() => {
    const testBuildings = [];
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const x = (i - 4) * 200;
        const y = (j - 4) * 200;
        const height = 50 + (i * 8 + j) * 5; // Deterministic heights instead of random

        testBuildings.push({
          id: `building_${i}_${j}`,
          footprint: [
            [x - 30, y - 30],
            [x + 30, y - 30],
            [x + 30, y + 30],
            [x - 30, y + 30]
          ],
          height: height,
          stories: Math.ceil(height / 3.5),
          building_type: Math.floor((i + j) % 5),
          type: Math.floor((i + j) % 5)
        });
      }
    }
    return testBuildings;
  }, []);

  // Generate fallback buildings and agents for testing when WASM is unavailable
  const generateFallbackAgents = useCallback((cityModel: any) => {
    // Always ensure we have buildings
    const buildings = generateTestBuildings();

    console.log('Setting persistent test buildings:', buildings.length);

    // Update city model with persistent buildings
    const updatedCityModel = { ...cityModel, buildings };
    dispatch({ type: 'SET_CITY_MODEL', payload: updatedCityModel });

    const agents: any[] = [];
    const pois = updatedCityModel.pois || [];
    const buildingsForAgents = updatedCityModel.buildings || [];

    console.log('Generating fallback agents...', { pois: pois.length, buildings: buildingsForAgents.length });

    // Generate agents from POIs
    pois.forEach((poi: any, index: number) => {
      if (poi.type === 0 && agents.length < 20) { // HOME POIs, limit to 20 agents
        const numAgents = Math.min(3, Math.floor((poi.capacity || 50) / 20));

        for (let i = 0; i < numAgents; i++) {
          const agentId = agents.length;
          // Use deterministic positioning based on agent ID
          const offsetSeed = (agentId * 17 + index * 5) % 100;
          const offsetX = ((offsetSeed % 50) - 25);
          const offsetY = (((offsetSeed * 3) % 50) - 25);

          const agent = {
            id: agentId,
            position: {
              x: poi.position.x + offsetX,
              y: poi.position.y + offsetY,
              z: 5
            },
            agent_type: (agentId % 3) === 0 ? 'Car' : 'Pedestrian',
            speed: 5 + (agentId % 15),
            state: 'Traveling',
            destination: `poi_${agentId % pois.length}`,
            path: [],
            path_progress: 0,
            initialPosition: {
              x: poi.position.x + offsetX,
              y: poi.position.y + offsetY,
              z: 5
            }
          };
          agents.push(agent);
        }
      }
    });

    // If no POIs, generate agents from buildings
    if (agents.length === 0 && buildingsForAgents.length > 0) {
      buildingsForAgents.slice(0, 10).forEach((building: any, index: number) => {
        if (building.footprint && building.footprint.length > 0) {
          const centerX = building.footprint.reduce((sum: number, p: any) => sum + p.x, 0) / building.footprint.length;
          const centerY = building.footprint.reduce((sum: number, p: any) => sum + p.y, 0) / building.footprint.length;

          const agentId = agents.length;
          const agent = {
            id: agentId,
            position: { x: centerX, y: centerY, z: 5 },
            agent_type: (agentId % 3) === 0 ? 'Car' : 'Pedestrian',
            speed: 5 + (agentId % 15),
            state: 'Traveling',
            destination: `building_${agentId % buildings.length}`,
            path: [],
            path_progress: 0,
            initialPosition: { x: centerX, y: centerY, z: 5 }
          };
          agents.push(agent);
        }
      });
    }

    console.log(`Generated ${agents.length} fallback agents`);
    dispatch({ type: 'SET_AGENTS', payload: agents });

    // Start basic agent animation if we have agents
    if (agents.length > 0) {
      startFallbackAnimation();
    }
  }, [dispatch]);

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
      movementPath: []
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
  const setSpeed = useCallback((speed: number) => {
    // Update speed in state (works even without WASM)
    dispatch({ type: 'SET_SPEED', payload: speed });

    // Also update WASM speed if available
    if (wasmModuleRef.current) {
      wasmModuleRef.current.setSpeed(speed);
    }

    console.log(`Simulation speed set to ${speed}x`);
  }, [dispatch]);

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
            averageSpeed: agents.reduce((sum: number, a: any) => sum + (a.speed || 0), 0) / Math.max(agents.length, 1),
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
            const speedScale = 0.3 + ((agentSeed % 20) / 100); // Speed variation
            const phaseOffset = (agentSeed % 360) * (Math.PI / 180); // Different starting phases

            // Use sine/cosine for smooth circular movement
            const angle = (timeSinceStart * speedScale + phaseOffset) % (Math.PI * 2);
            const offsetX = Math.cos(angle) * radiusScale;
            const offsetY = Math.sin(angle) * radiusScale;

            const newPosition = {
              x: agent.initialPosition.x + offsetX,
              y: agent.initialPosition.y + offsetY,
              z: agent.initialPosition.z + Math.sin(angle * 2) * 2 // Slight vertical movement
            };

            // Calculate speed for stats
            const speed = Math.sqrt(offsetX * offsetX + offsetY * offsetY) * speedScale;

            return {
              ...agent,
              position: newPosition,
              speed: speed,
              state: 'Traveling'
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
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
    }
  }, [state.isRunning, state.currentTime, state.day, state.speed, state.agents.length, dispatch]);

  // Handle world updates (adding/removing POIs)
  const updateWorld = useCallback((event: any) => {
    if (!wasmModuleRef.current) return;

    try {
      wasmModuleRef.current.updateWorld(event);
    } catch (error) {
      console.error('World update error:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
    }
  }, [dispatch]);

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