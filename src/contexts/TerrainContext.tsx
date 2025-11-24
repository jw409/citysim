import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export interface TerrainState {
  isEnabled: boolean;
  scale: number; // 1 = city, 100 = regional, 1000+ = planetary
  seed: number;
  timeOfDay: number; // 0-23 hours
  showAtmosphere: boolean;
  terrainProfile: string; // 'manhattan', 'san_francisco', 'denver', 'miami', 'seattle', 'chicago', 'custom'
  customParameters: {
    mountainHeight: number; // meters
    waterLevel: number; // meters (can be negative)
    hilliness: number; // 0-1 factor
    riverProbability: number; // 0-1 probability
    coastalDistance: number; // meters to coast
  };
  activeLayer: 'planetary' | 'basic' | 'none';
  autoRegenerateCity: boolean; // Whether to regenerate city when terrain changes
}

type TerrainAction =
  | { type: 'TOGGLE_TERRAIN'; payload: boolean }
  | { type: 'SET_SCALE'; payload: number }
  | { type: 'SET_SEED'; payload: number }
  | { type: 'SET_TIME_OF_DAY'; payload: number }
  | { type: 'TOGGLE_ATMOSPHERE'; payload: boolean }
  | { type: 'SET_TERRAIN_PROFILE'; payload: string }
  | { type: 'UPDATE_CUSTOM_PARAMETERS'; payload: Partial<TerrainState['customParameters']> }
  | { type: 'SET_ACTIVE_LAYER'; payload: 'planetary' | 'basic' | 'none' }
  | { type: 'TOGGLE_AUTO_REGENERATE'; payload: boolean }
  | { type: 'RESET_TO_DEFAULTS' }
  | { type: 'LOAD_SAVED_STATE'; payload: Partial<TerrainState> };

const initialState: TerrainState = {
  isEnabled: true,
  scale: 10, // Regional scale for more visible terrain
  seed: 12345,
  timeOfDay: 12,
  showAtmosphere: false,
  terrainProfile: 'manhattan',
  customParameters: {
    mountainHeight: 200, // Increased for more dramatic elevation
    waterLevel: 0,
    hilliness: 0.7, // Increased hilliness for more variation
    riverProbability: 0.3,
    coastalDistance: 5000,
  },
  activeLayer: 'basic',
  autoRegenerateCity: false,
};

function terrainReducer(state: TerrainState, action: TerrainAction): TerrainState {
  let newState: TerrainState;

  switch (action.type) {
    case 'TOGGLE_TERRAIN':
      newState = { ...state, isEnabled: action.payload };
      break;

    case 'SET_SCALE':
      newState = {
        ...state,
        scale: action.payload,
        // Automatically switch terrain layer based on scale
        activeLayer: action.payload > 50 ? 'planetary' : 'basic',
        // Enable atmosphere for large scales
        showAtmosphere: action.payload > 100 ? true : state.showAtmosphere,
      };
      break;

    case 'SET_SEED':
      newState = { ...state, seed: action.payload };
      break;

    case 'SET_TIME_OF_DAY':
      newState = { ...state, timeOfDay: action.payload };
      break;

    case 'TOGGLE_ATMOSPHERE':
      newState = { ...state, showAtmosphere: action.payload };
      break;

    case 'SET_TERRAIN_PROFILE':
      newState = { ...state, terrainProfile: action.payload };
      break;

    case 'UPDATE_CUSTOM_PARAMETERS':
      newState = {
        ...state,
        customParameters: { ...state.customParameters, ...action.payload },
      };
      break;

    case 'SET_ACTIVE_LAYER':
      newState = { ...state, activeLayer: action.payload };
      break;

    case 'TOGGLE_AUTO_REGENERATE':
      newState = { ...state, autoRegenerateCity: action.payload };
      break;

    case 'RESET_TO_DEFAULTS':
      newState = { ...initialState };
      break;

    case 'LOAD_SAVED_STATE':
      newState = { ...state, ...action.payload };
      break;

    default:
      return state;
  }

  // Save to localStorage whenever state changes
  try {
    localStorage.setItem('urbansynth-terrain-state', JSON.stringify(newState));
  } catch (e) {
    console.warn('Failed to save terrain state to localStorage:', e);
  }

  return newState;
}

interface TerrainContextType {
  state: TerrainState;
  dispatch: React.Dispatch<TerrainAction>;
}

const TerrainContext = createContext<TerrainContextType | undefined>(undefined);

export function TerrainProvider({ children }: { children: ReactNode }) {
  // Load saved state from localStorage on initialization
  const loadSavedState = (): TerrainState => {
    try {
      const saved = localStorage.getItem('urbansynth-terrain-state');
      if (saved) {
        const parsedState = JSON.parse(saved);
        // Ensure all required fields exist (for backwards compatibility)
        return {
          ...initialState,
          ...parsedState,
        };
      }
    } catch (e) {
      console.warn('Failed to load saved terrain state:', e);
    }
    return initialState;
  };

  const [state, dispatch] = useReducer(terrainReducer, loadSavedState());

  // Load saved state on mount if it exists
  React.useEffect(() => {
    const savedState = loadSavedState();
    if (savedState !== initialState) {
      dispatch({ type: 'LOAD_SAVED_STATE', payload: savedState });
    }
  }, []);

  return <TerrainContext.Provider value={{ state, dispatch }}>{children}</TerrainContext.Provider>;
}

export function useTerrainContext() {
  const context = useContext(TerrainContext);
  if (context === undefined) {
    throw new Error('useTerrainContext must be used within a TerrainProvider');
  }
  return context;
}
