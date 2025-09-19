import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Agent, TrafficData } from '../types/simulation';

export interface SimulationState {
  isInitialized: boolean;
  isRunning: boolean;
  isLoading: boolean;
  error: string | null;
  agents: Agent[];
  trafficData: TrafficData | null;
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
}

type SimulationAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'SET_RUNNING'; payload: boolean }
  | { type: 'SET_AGENTS'; payload: Agent[] }
  | { type: 'SET_TRAFFIC_DATA'; payload: TrafficData }
  | { type: 'SET_TIME'; payload: { time: number; day: number } }
  | { type: 'SET_SPEED'; payload: number }
  | { type: 'SET_TOOL'; payload: string | null }
  | { type: 'UPDATE_STATS'; payload: Partial<SimulationState['stats']> };

const initialState: SimulationState = {
  isInitialized: false,
  isRunning: false,
  isLoading: true,
  error: null,
  agents: [],
  trafficData: null,
  currentTime: 0,
  day: 0,
  speed: 1.0,
  selectedTool: null,
  stats: {
    totalAgents: 0,
    activeAgents: 0,
    averageSpeed: 0,
    congestionLevel: 0,
  },
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
    case 'SET_TIME':
      return { ...state, currentTime: action.payload.time, day: action.payload.day };
    case 'SET_SPEED':
      return { ...state, speed: action.payload };
    case 'SET_TOOL':
      return { ...state, selectedTool: action.payload };
    case 'UPDATE_STATS':
      return { ...state, stats: { ...state.stats, ...action.payload } };
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
    <SimulationContext.Provider value={{ state, dispatch }}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulationContext() {
  const context = useContext(SimulationContext);
  if (context === undefined) {
    throw new Error('useSimulationContext must be used within a SimulationProvider');
  }
  return context;
}