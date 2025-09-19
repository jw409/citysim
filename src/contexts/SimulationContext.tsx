import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Agent, TrafficData, CityModel } from '../types/simulation';
import { PerformanceState, PerformanceProfile } from '../types/performance';

export interface SimulationState {
  isInitialized: boolean;
  isRunning: boolean;
  isLoading: boolean;
  error: string | null;
  agents: Agent[];
  trafficData: TrafficData | null;
  cityModel: CityModel | null;
  simulationData: any | null;
  currentTime: number;
  day: number;
  speed: number;
  selectedTool: string | null;
  stats: {
    totalAgents: number;
    activeAgents: number;
    averageSpeed: number;
    congestionLevel: number;
  };
  performance: PerformanceState | null;
}

type SimulationAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'SET_RUNNING'; payload: boolean }
  | { type: 'SET_AGENTS'; payload: Agent[] }
  | { type: 'SET_TRAFFIC_DATA'; payload: TrafficData }
  | { type: 'SET_CITY_MODEL'; payload: CityModel }
  | { type: 'SET_SIMULATION_DATA'; payload: any }
  | { type: 'SET_TIME'; payload: { time: number; day: number } }
  | { type: 'SET_SPEED'; payload: number }
  | { type: 'SET_TOOL'; payload: string | null }
  | { type: 'UPDATE_STATS'; payload: Partial<SimulationState['stats']> }
  | { type: 'SET_PERFORMANCE_STATE'; payload: PerformanceState }
  | { type: 'UPDATE_PERFORMANCE_PROFILE'; payload: PerformanceProfile };

const initialState: SimulationState = {
  isInitialized: false,
  isRunning: false,
  isLoading: true,
  error: null,
  agents: [],
  trafficData: null,
  cityModel: null,
  simulationData: null,
  currentTime: 8.0, // Start at 8 AM
  day: 0,
  speed: 1.0,
  selectedTool: null,
  stats: {
    totalAgents: 0,
    activeAgents: 0,
    averageSpeed: 0,
    congestionLevel: 0,
  },
  performance: null,
};

function simulationReducer(state: SimulationState, action: SimulationAction): SimulationState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };
    case 'SET_RUNNING':
      return { ...state, isRunning: action.payload };
    case 'SET_AGENTS':
      return { ...state, agents: action.payload };
    case 'SET_TRAFFIC_DATA':
      return { ...state, trafficData: action.payload };
    case 'SET_CITY_MODEL':
      return { ...state, cityModel: action.payload };
    case 'SET_SIMULATION_DATA':
      return { ...state, simulationData: action.payload };
    case 'SET_TIME':
      return { ...state, currentTime: action.payload.time, day: action.payload.day };
    case 'SET_SPEED':
      return { ...state, speed: action.payload };
    case 'SET_TOOL':
      return { ...state, selectedTool: action.payload };
    case 'UPDATE_STATS':
      return { ...state, stats: { ...state.stats, ...action.payload } };
    case 'SET_PERFORMANCE_STATE':
      return { ...state, performance: action.payload };
    case 'UPDATE_PERFORMANCE_PROFILE':
      return {
        ...state,
        performance: state.performance
          ? {
              ...state.performance,
              current_profile: action.payload,
            }
          : null,
      };
    default:
      return state;
  }
}

interface SimulationContextType {
  state: SimulationState;
  dispatch: React.Dispatch<SimulationAction>;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(simulationReducer, initialState);

  return (
    <SimulationContext.Provider value={{ state, dispatch }}>{children}</SimulationContext.Provider>
  );
}

export function useSimulationContext() {
  const context = useContext(SimulationContext);
  if (context === undefined) {
    throw new Error('useSimulationContext must be used within a SimulationProvider');
  }
  return context;
}
