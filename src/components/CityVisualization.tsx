import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useSimulationContext } from '../contexts/SimulationContext';
import { useTerrainContext } from '../contexts/TerrainContext';
import { useCamera } from '../hooks/useCamera';
import { Cityscape } from './Cityscape';
import { PerformanceMonitor } from './PerformanceMonitor';
import { enhanceSimulationDataWithLayers } from '../utils/multiLayerDataGenerator';
import { enhanceCityWithGeography } from '../utils/geographicCityGenerator';
import { getBoundsFromCityModel } from '../utils/coordinates';
import { OptimizationResult } from '../types/optimization';

const INITIAL_VIEW_STATE = {
  longitude: 0,
  latitude: 0,
  zoom: 15,
  pitch: 60,
  bearing: 0,
};

interface CityVisualizationProps {
  optimizationResult?: OptimizationResult | null;
  onStart: () => void;
  onPause: () => void;
  onSetSpeed: (speed: number) => void;
  isInitialized: boolean;
  showPerformance: boolean;
  onTogglePerformance: () => void;
}

export function CityVisualization({ optimizationResult, onStart, onPause, onSetSpeed, isInitialized, showPerformance, onTogglePerformance }: CityVisualizationProps) {
  const { state, dispatch } = useSimulationContext();
  const { state: terrainState } = useTerrainContext();
  const [enhancedData, setEnhancedData] = useState<any>(null);
  const [showZones, setShowZones] = useState(false);

  // Initialize camera with working 3D view
  const camera = useCamera({
    longitude: -74.0060,
    latitude: 40.7128,
    zoom: 12,
    pitch: 45,
    bearing: 0
  });

  const toggleZones = useCallback(() => {
    setShowZones(prev => !prev);
  }, []);

  // Update view state when city model becomes available (run only once)
  const [hasUpdatedCamera, setHasUpdatedCamera] = useState(false);
  useEffect(() => {
    if (state.cityModel && !hasUpdatedCamera) {
      console.log('Updating view state based on city model bounds...');
      const bounds = getBoundsFromCityModel(state.cityModel);
      // Override with working view that shows content
      const workingBounds = {
        longitude: bounds.longitude,
        latitude: bounds.latitude,
        zoom: 12,
        pitch: 45,
        bearing: 0
      };
      console.log('Setting camera to working bounds:', workingBounds);
      camera.setViewState(workingBounds);
      setHasUpdatedCamera(true);
    }
  }, [state.cityModel, hasUpdatedCamera]);

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

  // Generate multi-layer data when city model is available
  useEffect(() => {
    if (state.cityModel) {
      console.log('Enhancing simulation data with multi-layer infrastructure...');

      // First enhance with geographic features if terrain is enabled
      let cityModelToUse = state.cityModel;
      if (terrainState.isEnabled) {
        console.log('Enhancing city model with geographic features...');
        cityModelToUse = enhanceCityWithGeography(state.cityModel, terrainState);
        console.log('Geographic enhancement completed:', {
          originalZones: state.cityModel.zones?.length || 0,
          enhancedZones: cityModelToUse.zones?.length || 0,
          originalPOIs: state.cityModel.pois?.length || 0,
          enhancedPOIs: cityModelToUse.pois?.length || 0,
          geographicFeatures: cityModelToUse.geographic_metadata?.geographic_features || 0
        });
      }

      // Then enhance with multi-layer infrastructure
      const enhanced = enhanceSimulationDataWithLayers({
        buildings: cityModelToUse.buildings || [],
        roads: cityModelToUse.roads || [],
        agents: state.agents || [],
        pois: cityModelToUse.pois || []
      }, cityModelToUse);

      setEnhancedData(enhanced);
      console.log('Enhanced data generated:', enhanced);
    }
  }, [state.cityModel, state.agents, terrainState.isEnabled, terrainState.seed, terrainState.terrainProfile]);

  // Pass enhanced data to the simulation context
  useEffect(() => {
    if (enhancedData) {
      dispatch({ type: 'SET_SIMULATION_DATA', payload: enhancedData });
    }
  }, [enhancedData, dispatch]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '100vh' }}>
      <Cityscape
        optimizationResult={optimizationResult}
        showZones={showZones}
        onToggleZones={toggleZones}
        camera={camera}
      />

      {showPerformance && (
        <PerformanceMonitor
          metrics={{
            fps: 60,
            tps: state.isRunning ? 60 : 0,
            memoryUsage: state.stats.totalAgents * 0.1,
            agentCount: state.stats.totalAgents,
            simulationTime: state.currentTime,
            seed: 0,
          }}
          onClose={onTogglePerformance}
        />
      )}

      {state.selectedTool && (
        <div
          style={{
            position: 'absolute',
            bottom: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--primary-color)',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: 'var(--border-radius)',
            fontSize: '0.875rem',
            fontWeight: 500,
            zIndex: 1000,
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          🛠️ {state.selectedTool.toUpperCase()} tool selected - Click on the map to use
        </div>
      )}
    </div>
  );
}