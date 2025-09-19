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
      const cityModel = await loadCityModel();

      // Load and initialize WASM module
      const wasmModule = await loadWasmModule();
      await initializeSimulation(cityModel);

      wasmModuleRef.current = wasmModule;
      dispatch({ type: 'SET_INITIALIZED', payload: true });
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
    }
  }, [dispatch]);

  // Start simulation
  const start = useCallback(() => {
    if (!state.isInitialized || !wasmModuleRef.current) return;

    wasmModuleRef.current.start();
    dispatch({ type: 'SET_RUNNING', payload: true });
  }, [state.isInitialized, dispatch]);

  // Pause simulation
  const pause = useCallback(() => {
    if (!wasmModuleRef.current) return;

    wasmModuleRef.current.pause();
    dispatch({ type: 'SET_RUNNING', payload: false });
  }, [dispatch]);

  // Set simulation speed
  const setSpeed = useCallback((speed: number) => {
    if (!wasmModuleRef.current) return;

    wasmModuleRef.current.setSpeed(speed);
    dispatch({ type: 'SET_SPEED', payload: speed });
  }, [dispatch]);

  // Update simulation (called every frame)
  const updateSimulation = useCallback(() => {
    if (!state.isRunning || !wasmModuleRef.current) return;

    try {
      // Tick the simulation
      wasmModuleRef.current.tick();

      // Get updated agent states
      const agents = wasmModuleRef.current.getAgentStates();
      dispatch({ type: 'SET_AGENTS', payload: agents });

      // Get traffic data (less frequently)
      if (Math.random() < 0.1) { // 10% of frames
        const trafficData = wasmModuleRef.current.getTrafficData();
        dispatch({ type: 'SET_TRAFFIC_DATA', payload: trafficData });
      }

      // Update stats
      dispatch({
        type: 'UPDATE_STATS',
        payload: {
          totalAgents: agents.length,
          activeAgents: agents.filter((a: any) => a.state === 'Traveling').length,
          averageSpeed: agents.reduce((sum: number, a: any) => sum + (a.speed || 0), 0) / Math.max(agents.length, 1),
        },
      });
    } catch (error) {
      console.error('Simulation update error:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
    }
  }, [state.isRunning, dispatch]);

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