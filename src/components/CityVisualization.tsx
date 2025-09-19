import { useState, useCallback, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { LightingEffect, AmbientLight, DirectionalLight } from '@deck.gl/core';
import { useSimulationContext } from '../contexts/SimulationContext';
import { useViewState } from '../hooks/useViewState';
import { ViewControls } from './ViewControls';
import { createBuildingLayer } from '../layers/BuildingLayer';
import { createRoadLayer } from '../layers/RoadLayer';
import { createAgentLayer } from '../layers/AgentLayer';
import { createZoneLayer } from '../layers/ZoneLayer';
import { createChargingStationLayer } from '../layers/ChargingStationLayer';
import { createPickingInfoTooltip } from '../utils/deckglHelpers';
import { getTimeBasedColors } from '../utils/colorSchemes';
import { getBoundsFromCityModel } from '../utils/coordinates';
import { OptimizationResult } from '../types/optimization';

const INITIAL_VIEW_STATE = {
  longitude: 0,
  latitude: 0,
  zoom: 14,
  pitch: 45,
  bearing: 0,
};

interface CityVisualizationProps {
  optimizationResult?: OptimizationResult | null;
}

export function CityVisualization({ optimizationResult }: CityVisualizationProps) {
  const { state } = useSimulationContext();

  // Calculate initial view state from city model
  const initialViewState = useMemo(() => {
    if (state.cityModel) {
      return getBoundsFromCityModel(state.cityModel);
    }
    return INITIAL_VIEW_STATE;
  }, [state.cityModel]);

  const { viewState, handleViewStateChange, resetView } = useViewState(initialViewState);
  const [showZones, setShowZones] = useState(false);
  const [isNight, setIsNight] = useState(false);
  const [tooltip, setTooltip] = useState<any>(null);

  // Calculate current time of day for lighting
  const timeOfDay = useMemo(() => {
    return isNight ? 22 : state.currentTime || 12;
  }, [isNight, state.currentTime]);

  // Create lighting effects
  const lightingEffect = useMemo(() => {
    const colors = getTimeBasedColors(timeOfDay);
    const sunIntensity = timeOfDay >= 6 && timeOfDay <= 18 ? 1.0 : 0.3;

    const directionalLight = new DirectionalLight({
      color: [255, 255, 255],
      intensity: sunIntensity,
      direction: [-1, -1, -2],
      _shadow: true,
    });

    return new LightingEffect({
      ambientLight: new AmbientLight({
        color: [colors.sky[0], colors.sky[1], colors.sky[2]] as [number, number, number],
        intensity: 0.4 + sunIntensity * 0.3,
      }),
      directionalLights: [directionalLight],
    });
  }, [timeOfDay]);

  // Create layers
  const layers = useMemo(() => {
    const cityData = state.cityModel || { zones: [], roads: [], pois: [], buildings: [] };
    const layerList: any[] = [
      createZoneLayer(cityData.zones || [], timeOfDay, showZones),
      createRoadLayer(cityData.roads || [], timeOfDay),
      createBuildingLayer(cityData.buildings || [], timeOfDay),
      createAgentLayer(state.agents, timeOfDay),
    ];

    // Add charging station layer if optimization result exists
    if (optimizationResult) {
      layerList.push(
        createChargingStationLayer(
          optimizationResult.stations,
          optimizationResult.coverage_map,
          true
        )
      );
    }

    return layerList;
  }, [state.agents, state.cityModel, timeOfDay, showZones, optimizationResult]);

  // Handle clicks for tool interactions
  const handleClick = useCallback((info: any) => {
    if (!info.coordinate) return;

    const [x, y] = info.coordinate;

    if (state.selectedTool) {
      console.log(`Tool ${state.selectedTool} clicked at:`, { x, y });

      // Handle different tools
      switch (state.selectedTool) {
        case 'office':
          // Add office POI
          break;
        case 'park':
          // Add park POI
          break;
        case 'bulldoze':
          // Remove nearby POI
          break;
        default:
          break;
      }
    }
  }, [state.selectedTool]);

  // Handle hover for tooltips
  const handleHover = useCallback((info: any) => {
    setTooltip(info.picked ? {
      x: info.x,
      y: info.y,
      content: createPickingInfoTooltip(info),
    } : null);
  }, []);

  const toggleZones = useCallback(() => setShowZones(prev => !prev), []);
  const toggleDayNight = useCallback(() => setIsNight(prev => !prev), []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <DeckGL
        viewState={viewState}
        onViewStateChange={handleViewStateChange}
        controller={true}
        layers={layers}
        effects={[lightingEffect]}
        onClick={handleClick}
        onHover={handleHover}
        pickingRadius={5}
        getCursor={() => state.selectedTool ? 'crosshair' : 'grab'}
        style={{ background: `rgb(${getTimeBasedColors(timeOfDay).sky.join(',')})` }}
      />

      <ViewControls
        onToggleZones={toggleZones}
        onToggleDayNight={toggleDayNight}
        onResetView={resetView}
        showZones={showZones}
        isNight={isNight}
      />

      {tooltip && (
        <div
          style={{
            position: 'absolute',
            left: tooltip.x + 10,
            top: tooltip.y - 10,
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '0.5rem',
            borderRadius: '4px',
            fontSize: '0.875rem',
            whiteSpace: 'pre-line',
            pointerEvents: 'none',
            zIndex: 1000,
          }}
        >
          {tooltip.content}
        </div>
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