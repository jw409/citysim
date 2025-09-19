import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSimulationContext } from '../contexts/SimulationContext';
import { Cityscape } from './Cityscape';
import { enhanceSimulationDataWithLayers } from '../utils/multiLayerDataGenerator';
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
  const [enhancedData, setEnhancedData] = useState<any>(null);

  // Generate multi-layer data when city model is available
  useEffect(() => {
    if (state.cityModel) {
      console.log('Enhancing simulation data with multi-layer infrastructure...');
      const enhanced = enhanceSimulationDataWithLayers({
        buildings: state.cityModel.buildings || [],
        roads: state.cityModel.roads || [],
        agents: state.agents || [],
        pois: state.cityModel.pois || []
      }, state.cityModel);

      setEnhancedData(enhanced);
      console.log('Enhanced data generated:', enhanced);
    }
  }, [state.cityModel, state.agents]);

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