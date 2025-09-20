import { useCallback, useMemo } from 'react';
import { useTerrainContext } from '../contexts/TerrainContext';
import { getTerrainProfilePresets, getTerrainProfile, getTerrainDifficulty, getDevelopmentRecommendations } from '../utils/realWorldTerrainProfiles';

export function useTerrainControls() {
  const { state, dispatch } = useTerrainContext();

  // Profile management
  const availableProfiles = useMemo(() => {
    const profiles = getTerrainProfilePresets();
    return Object.entries(profiles).map(([key, profile]) => ({
      value: key,
      label: profile.name,
      description: profile.description,
      difficulty: getTerrainDifficulty(profile),
      characteristics: profile.characteristics
    }));
  }, []);

  const currentProfile = useMemo(() => {
    return getTerrainProfile(state.terrainProfile);
  }, [state.terrainProfile]);

  const developmentRecommendations = useMemo(() => {
    return currentProfile ? getDevelopmentRecommendations(currentProfile) : null;
  }, [currentProfile]);

  // Basic terrain controls
  const toggleTerrain = useCallback((enabled: boolean) => {
    dispatch({ type: 'TOGGLE_TERRAIN', payload: enabled });
  }, [dispatch]);

  const setScale = useCallback((scale: number) => {
    dispatch({ type: 'SET_SCALE', payload: scale });
  }, [dispatch]);

  const setSeed = useCallback((seed: number) => {
    dispatch({ type: 'SET_SEED', payload: seed });
  }, [dispatch]);

  const setTimeOfDay = useCallback((time: number) => {
    dispatch({ type: 'SET_TIME_OF_DAY', payload: time });
  }, [dispatch]);

  const toggleAtmosphere = useCallback((enabled: boolean) => {
    dispatch({ type: 'TOGGLE_ATMOSPHERE', payload: enabled });
  }, [dispatch]);

  const toggleAutoRegenerate = useCallback((enabled: boolean) => {
    dispatch({ type: 'TOGGLE_AUTO_REGENERATE', payload: enabled });
  }, [dispatch]);

  // Profile and parameter management
  const setTerrainProfile = useCallback((profile: string) => {
    dispatch({ type: 'SET_TERRAIN_PROFILE', payload: profile });

    // Apply preset parameters if not custom
    if (profile !== 'custom') {
      const preset = getTerrainProfile(profile);
      if (preset) {
        dispatch({
          type: 'UPDATE_CUSTOM_PARAMETERS',
          payload: preset.parameters
        });
        dispatch({ type: 'SET_SCALE', payload: preset.recommendedScale });
      }
    }
  }, [dispatch]);

  const updateCustomParameter = useCallback((key: string, value: number) => {
    dispatch({
      type: 'UPDATE_CUSTOM_PARAMETERS',
      payload: { [key]: value }
    });
  }, [dispatch]);

  const updateMultipleParameters = useCallback((parameters: Partial<typeof state.customParameters>) => {
    dispatch({
      type: 'UPDATE_CUSTOM_PARAMETERS',
      payload: parameters
    });
  }, [dispatch]);

  // Utility functions
  const regenerateTerrain = useCallback(() => {
    // Generate new random seed
    const newSeed = Math.floor(Math.random() * 1000000);
    dispatch({ type: 'SET_SEED', payload: newSeed });
  }, [dispatch]);

  const resetToDefaults = useCallback(() => {
    dispatch({ type: 'RESET_TO_DEFAULTS' });
  }, [dispatch]);

  const setActiveLayer = useCallback((layer: 'planetary' | 'basic' | 'none') => {
    dispatch({ type: 'SET_ACTIVE_LAYER', payload: layer });
  }, [dispatch]);

  // Advanced parameter controls with validation
  const setMountainHeight = useCallback((height: number) => {
    const clampedHeight = Math.max(0, Math.min(1000, height));
    updateCustomParameter('mountainHeight', clampedHeight);
  }, [updateCustomParameter]);

  const setWaterLevel = useCallback((level: number) => {
    const clampedLevel = Math.max(-2000, Math.min(100, level));
    updateCustomParameter('waterLevel', clampedLevel);
  }, [updateCustomParameter]);

  const setHilliness = useCallback((hilliness: number) => {
    const clampedHilliness = Math.max(0, Math.min(1, hilliness));
    updateCustomParameter('hilliness', clampedHilliness);
  }, [updateCustomParameter]);

  const setRiverProbability = useCallback((probability: number) => {
    const clampedProbability = Math.max(0, Math.min(1, probability));
    updateCustomParameter('riverProbability', clampedProbability);
  }, [updateCustomParameter]);

  const setCoastalDistance = useCallback((distance: number) => {
    const clampedDistance = Math.max(100, Math.min(2000000, distance));
    updateCustomParameter('coastalDistance', clampedDistance);
  }, [updateCustomParameter]);

  // Quick preset actions
  const applyManhattanProfile = useCallback(() => setTerrainProfile('manhattan'), [setTerrainProfile]);
  const applySanFranciscoProfile = useCallback(() => setTerrainProfile('san_francisco'), [setTerrainProfile]);
  const applyDenverProfile = useCallback(() => setTerrainProfile('denver'), [setTerrainProfile]);
  const applyMiamiProfile = useCallback(() => setTerrainProfile('miami'), [setTerrainProfile]);
  const applySeattleProfile = useCallback(() => setTerrainProfile('seattle'), [setTerrainProfile]);
  const applyChicagoProfile = useCallback(() => setTerrainProfile('chicago'), [setTerrainProfile]);
  const applyLasVegasProfile = useCallback(() => setTerrainProfile('las_vegas'), [setTerrainProfile]);
  const applyNewOrleansProfile = useCallback(() => setTerrainProfile('new_orleans'), [setTerrainProfile]);

  // Computed properties
  const isCustomProfile = state.terrainProfile === 'custom';
  const canShowAtmosphere = state.scale > 50;
  const isPlanetaryScale = state.scale > 100;
  const terrainDifficulty = currentProfile ? getTerrainDifficulty(currentProfile) : 'easy';

  // Scale helpers
  const getScaleDescription = useCallback((scale: number) => {
    if (scale === 1) return 'City';
    if (scale < 10) return 'Urban Area';
    if (scale < 50) return 'Metropolitan';
    if (scale < 100) return 'Regional';
    if (scale < 500) return 'State/Province';
    if (scale < 1000) return 'Country';
    return 'Continental/Planetary';
  }, []);

  const currentScaleDescription = getScaleDescription(state.scale);

  // Time helpers
  const getTimeDescription = useCallback((time: number) => {
    if (time >= 6 && time < 12) return 'Morning';
    if (time >= 12 && time < 17) return 'Afternoon';
    if (time >= 17 && time < 20) return 'Evening';
    if (time >= 20 || time < 6) return 'Night';
    return 'Dawn/Dusk';
  }, []);

  const currentTimeDescription = getTimeDescription(state.timeOfDay);

  // Export current configuration
  const exportConfiguration = useCallback(() => {
    return {
      ...state,
      profileInfo: currentProfile,
      difficulty: terrainDifficulty,
      recommendations: developmentRecommendations,
      exportedAt: new Date().toISOString()
    };
  }, [state, currentProfile, terrainDifficulty, developmentRecommendations]);

  // Import configuration
  const importConfiguration = useCallback((config: any) => {
    try {
      // Validate and load configuration
      if (config.terrainProfile) {
        dispatch({ type: 'SET_TERRAIN_PROFILE', payload: config.terrainProfile });
      }
      if (config.customParameters) {
        dispatch({ type: 'UPDATE_CUSTOM_PARAMETERS', payload: config.customParameters });
      }
      if (config.scale) {
        dispatch({ type: 'SET_SCALE', payload: config.scale });
      }
      if (config.seed) {
        dispatch({ type: 'SET_SEED', payload: config.seed });
      }
      return true;
    } catch (error) {
      console.error('Failed to import terrain configuration:', error);
      return false;
    }
  }, [dispatch]);

  return {
    // State
    state,
    availableProfiles,
    currentProfile,
    developmentRecommendations,
    isCustomProfile,
    canShowAtmosphere,
    isPlanetaryScale,
    terrainDifficulty,
    currentScaleDescription,
    currentTimeDescription,

    // Basic controls
    toggleTerrain,
    setScale,
    setSeed,
    setTimeOfDay,
    toggleAtmosphere,
    toggleAutoRegenerate,
    setActiveLayer,

    // Profile management
    setTerrainProfile,
    updateCustomParameter,
    updateMultipleParameters,

    // Parameter controls with validation
    setMountainHeight,
    setWaterLevel,
    setHilliness,
    setRiverProbability,
    setCoastalDistance,

    // Quick actions
    regenerateTerrain,
    resetToDefaults,

    // Quick presets
    applyManhattanProfile,
    applySanFranciscoProfile,
    applyDenverProfile,
    applyMiamiProfile,
    applySeattleProfile,
    applyChicagoProfile,
    applyLasVegasProfile,
    applyNewOrleansProfile,

    // Utilities
    getScaleDescription,
    getTimeDescription,
    exportConfiguration,
    importConfiguration
  };
}