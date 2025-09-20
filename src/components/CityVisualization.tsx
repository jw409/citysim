import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSimulationContext } from '../contexts/SimulationContext';
import { useTerrainContext } from '../contexts/TerrainContext';
import { Cityscape } from './Cityscape';
import { enhanceSimulationDataWithLayers } from '../utils/multiLayerDataGenerator';
import { enhanceCityWithGeography } from '../utils/geographicCityGenerator';
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
}

export function CityVisualization({ optimizationResult }: CityVisualizationProps) {
  const { state, dispatch } = useSimulationContext();
  const { state: terrainState } = useTerrainContext();
  const [enhancedData, setEnhancedData] = useState<any>(null);

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
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Cityscape
        width={window.innerWidth}
        height={window.innerHeight}
        optimizationResult={optimizationResult}
      />

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