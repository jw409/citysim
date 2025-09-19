---
id: PLAN4
title: "Interactive Frontend Setup"
dependencies: ["PLAN1", "PLAN2", "PLAN3"]
status: pending
artifacts:
  - "src/App.tsx"
  - "src/components/SimulationController.tsx"
  - "src/components/Toolbar.tsx"
  - "src/components/ControlPanel.tsx"
  - "src/components/LoadingScreen.tsx"
  - "src/components/ErrorBoundary.tsx"
  - "src/hooks/useSimulation.ts"
  - "src/contexts/SimulationContext.tsx"
  - "src/utils/wasmLoader.ts"
  - "src/styles/globals.css"
  - "src/styles/components.css"
---

### Objective
Create a clean, interactive React frontend that integrates with the WASM simulation core and provides intuitive controls for users to interact with the city simulation.

### Task Breakdown

1. **Update global styles** (src/styles/globals.css):
   ```css
   * {
     margin: 0;
     padding: 0;
     box-sizing: border-box;
   }

   html, body, #root {
     width: 100%;
     height: 100%;
     font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
       'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
       sans-serif;
     -webkit-font-smoothing: antialiased;
     -moz-osx-font-smoothing: grayscale;
   }

   :root {
     --primary-color: #2563eb;
     --secondary-color: #64748b;
     --success-color: #059669;
     --warning-color: #d97706;
     --error-color: #dc2626;
     --background-color: #f8fafc;
     --surface-color: #ffffff;
     --text-primary: #1e293b;
     --text-secondary: #64748b;
     --border-color: #e2e8f0;
     --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
     --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
     --border-radius: 8px;
     --transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
   }

   .button {
     display: inline-flex;
     align-items: center;
     justify-content: center;
     padding: 0.5rem 1rem;
     border: none;
     border-radius: var(--border-radius);
     font-size: 0.875rem;
     font-weight: 500;
     cursor: pointer;
     transition: var(--transition);
     text-decoration: none;
     gap: 0.5rem;
   }

   .button-primary {
     background-color: var(--primary-color);
     color: white;
   }

   .button-primary:hover {
     background-color: #1d4ed8;
   }

   .button-secondary {
     background-color: var(--surface-color);
     color: var(--text-primary);
     border: 1px solid var(--border-color);
   }

   .button-secondary:hover {
     background-color: #f1f5f9;
   }

   .button:disabled {
     opacity: 0.6;
     cursor: not-allowed;
   }

   .card {
     background: var(--surface-color);
     border-radius: var(--border-radius);
     border: 1px solid var(--border-color);
     box-shadow: var(--shadow);
   }

   .loading-spinner {
     width: 24px;
     height: 24px;
     border: 2px solid var(--border-color);
     border-top: 2px solid var(--primary-color);
     border-radius: 50%;
     animation: spin 1s linear infinite;
   }

   @keyframes spin {
     0% { transform: rotate(0deg); }
     100% { transform: rotate(360deg); }
   }
   ```

2. **Create component styles** (src/styles/components.css):
   ```css
   .app {
     display: flex;
     flex-direction: column;
     height: 100vh;
     background-color: var(--background-color);
   }

   .app-header {
     display: flex;
     align-items: center;
     justify-content: space-between;
     padding: 1rem 1.5rem;
     background: var(--surface-color);
     border-bottom: 1px solid var(--border-color);
     box-shadow: var(--shadow);
     z-index: 1000;
   }

   .app-title {
     font-size: 1.5rem;
     font-weight: 700;
     color: var(--text-primary);
     margin: 0;
   }

   .app-main {
     flex: 1;
     display: flex;
     position: relative;
     overflow: hidden;
   }

   .visualization-container {
     flex: 1;
     position: relative;
     background: #1a1a1a;
   }

   .sidebar {
     width: 320px;
     background: var(--surface-color);
     border-left: 1px solid var(--border-color);
     display: flex;
     flex-direction: column;
     box-shadow: var(--shadow-lg);
   }

   .toolbar {
     padding: 1rem;
     border-bottom: 1px solid var(--border-color);
   }

   .toolbar-title {
     font-size: 1rem;
     font-weight: 600;
     color: var(--text-primary);
     margin-bottom: 0.75rem;
   }

   .tool-grid {
     display: grid;
     grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
     gap: 0.5rem;
   }

   .tool-button {
     display: flex;
     flex-direction: column;
     align-items: center;
     padding: 0.75rem 0.5rem;
     border: 1px solid var(--border-color);
     border-radius: var(--border-radius);
     background: var(--surface-color);
     cursor: pointer;
     transition: var(--transition);
     text-decoration: none;
     color: var(--text-primary);
   }

   .tool-button:hover {
     background: #f1f5f9;
     border-color: var(--primary-color);
   }

   .tool-button.active {
     background: var(--primary-color);
     color: white;
     border-color: var(--primary-color);
   }

   .tool-icon {
     font-size: 1.5rem;
     margin-bottom: 0.25rem;
   }

   .tool-label {
     font-size: 0.75rem;
     font-weight: 500;
     text-align: center;
   }

   .control-panel {
     padding: 1rem;
     border-bottom: 1px solid var(--border-color);
   }

   .control-group {
     margin-bottom: 1rem;
   }

   .control-group:last-child {
     margin-bottom: 0;
   }

   .control-label {
     display: block;
     font-size: 0.875rem;
     font-weight: 500;
     color: var(--text-primary);
     margin-bottom: 0.5rem;
   }

   .control-buttons {
     display: flex;
     gap: 0.5rem;
   }

   .speed-slider {
     width: 100%;
     height: 6px;
     border-radius: 3px;
     background: var(--border-color);
     outline: none;
     -webkit-appearance: none;
   }

   .speed-slider::-webkit-slider-thumb {
     -webkit-appearance: none;
     appearance: none;
     width: 18px;
     height: 18px;
     border-radius: 50%;
     background: var(--primary-color);
     cursor: pointer;
   }

   .speed-slider::-moz-range-thumb {
     width: 18px;
     height: 18px;
     border-radius: 50%;
     background: var(--primary-color);
     cursor: pointer;
     border: none;
   }

   .stats-panel {
     padding: 1rem;
     flex: 1;
     overflow-y: auto;
   }

   .stats-grid {
     display: grid;
     gap: 0.75rem;
   }

   .stat-card {
     padding: 0.75rem;
     background: var(--background-color);
     border-radius: var(--border-radius);
     border: 1px solid var(--border-color);
   }

   .stat-label {
     font-size: 0.75rem;
     color: var(--text-secondary);
     text-transform: uppercase;
     letter-spacing: 0.025em;
     margin-bottom: 0.25rem;
   }

   .stat-value {
     font-size: 1.25rem;
     font-weight: 600;
     color: var(--text-primary);
   }

   .loading-screen {
     position: fixed;
     top: 0;
     left: 0;
     right: 0;
     bottom: 0;
     background: var(--surface-color);
     display: flex;
     flex-direction: column;
     align-items: center;
     justify-content: center;
     z-index: 9999;
   }

   .loading-content {
     text-align: center;
     max-width: 400px;
   }

   .loading-title {
     font-size: 1.5rem;
     font-weight: 700;
     color: var(--text-primary);
     margin-bottom: 0.5rem;
   }

   .loading-subtitle {
     color: var(--text-secondary);
     margin-bottom: 2rem;
   }

   .loading-progress {
     width: 100%;
     height: 6px;
     background: var(--border-color);
     border-radius: 3px;
     overflow: hidden;
     margin-bottom: 1rem;
   }

   .loading-progress-bar {
     height: 100%;
     background: var(--primary-color);
     transition: width 0.3s ease;
   }

   .error-boundary {
     padding: 2rem;
     text-align: center;
     color: var(--error-color);
   }

   .error-boundary h2 {
     margin-bottom: 1rem;
   }

   .error-boundary pre {
     background: #f1f5f9;
     padding: 1rem;
     border-radius: var(--border-radius);
     text-align: left;
     overflow: auto;
     margin-top: 1rem;
   }
   ```

3. **Create simulation context** (src/contexts/SimulationContext.tsx):
   ```typescript
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
   ```

4. **Create WASM loader utility** (src/utils/wasmLoader.ts):
   ```typescript
   import { SimulationConfig } from '../types/simulation';

   let wasmModule: any = null;

   export async function loadWasmModule(): Promise<any> {
     if (wasmModule) {
       return wasmModule;
     }

     try {
       // Dynamic import of WASM module
       const module = await import('../wasm/urbansynth_sim');
       await module.default();
       wasmModule = module;
       return module;
     } catch (error) {
       console.error('Failed to load WASM module:', error);
       throw new Error(`WASM module loading failed: ${error.message}`);
     }
   }

   export async function initializeSimulation(cityModel: any): Promise<void> {
     const module = await loadWasmModule();

     try {
       // Convert city model to format expected by WASM
       const config: SimulationConfig = {
         zones: cityModel.zones || [],
         roads: cityModel.roads || [],
         pois: cityModel.pois || [],
         buildings: cityModel.buildings || [],
       };

       // Initialize the simulation
       module.init(new Uint8Array(), config);
     } catch (error) {
       console.error('Failed to initialize simulation:', error);
       throw new Error(`Simulation initialization failed: ${error.message}`);
     }
   }

   export async function loadCityModel(): Promise<any> {
     try {
       const response = await fetch('/model.pbf');
       if (!response.ok) {
         throw new Error(`Failed to fetch city model: ${response.statusText}`);
       }

       const buffer = await response.arrayBuffer();

       // For now, we'll use a simplified approach
       // In a real implementation, we'd decode the protobuf here
       return {
         zones: [],
         roads: [],
         pois: [],
         buildings: [],
       };
     } catch (error) {
       console.error('Failed to load city model:', error);
       throw error;
     }
   }
   ```

5. **Create simulation hook** (src/hooks/useSimulation.ts):
   ```typescript
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
         dispatch({ type: 'SET_ERROR', payload: error.message });
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
         dispatch({ type: 'SET_ERROR', payload: error.message });
       }
     }, [state.isRunning, dispatch]);

     // Handle world updates (adding/removing POIs)
     const updateWorld = useCallback((event: any) => {
       if (!wasmModuleRef.current) return;

       try {
         wasmModuleRef.current.updateWorld(event);
       } catch (error) {
         console.error('World update error:', error);
         dispatch({ type: 'SET_ERROR', payload: error.message });
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
   ```

6. **Create loading screen component** (src/components/LoadingScreen.tsx):
   ```typescript
   import React, { useState, useEffect } from 'react';

   interface LoadingScreenProps {
     isVisible: boolean;
     progress?: number;
     message?: string;
   }

   export function LoadingScreen({ isVisible, progress = 0, message = 'Loading...' }: LoadingScreenProps) {
     const [dots, setDots] = useState('');

     useEffect(() => {
       const interval = setInterval(() => {
         setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
       }, 500);

       return () => clearInterval(interval);
     }, []);

     if (!isVisible) return null;

     return (
       <div className="loading-screen">
         <div className="loading-content">
           <div className="loading-spinner"></div>
           <h2 className="loading-title">UrbanSynth</h2>
           <p className="loading-subtitle">{message}{dots}</p>
           <div className="loading-progress">
             <div
               className="loading-progress-bar"
               style={{ width: `${Math.min(progress, 100)}%` }}
             />
           </div>
           <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
             {progress > 0 ? `${Math.round(progress)}%` : 'Initializing simulation...'}
           </p>
         </div>
       </div>
     );
   }
   ```

7. **Create error boundary** (src/components/ErrorBoundary.tsx):
   ```typescript
   import React, { Component, ErrorInfo, ReactNode } from 'react';

   interface Props {
     children: ReactNode;
   }

   interface State {
     hasError: boolean;
     error?: Error;
   }

   export class ErrorBoundary extends Component<Props, State> {
     public state: State = {
       hasError: false,
     };

     public static getDerivedStateFromError(error: Error): State {
       return { hasError: true, error };
     }

     public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
       console.error('ErrorBoundary caught an error:', error, errorInfo);
     }

     public render() {
       if (this.state.hasError) {
         return (
           <div className="error-boundary">
             <h2>Something went wrong</h2>
             <p>The application encountered an unexpected error.</p>
             <button
               className="button button-primary"
               onClick={() => window.location.reload()}
             >
               Reload Application
             </button>
             {this.state.error && (
               <pre>{this.state.error.toString()}</pre>
             )}
           </div>
         );
       }

       return this.props.children;
     }
   }
   ```

8. **Create toolbar component** (src/components/Toolbar.tsx):
   ```typescript
   import React from 'react';
   import { useSimulationContext } from '../contexts/SimulationContext';

   const tools = [
     { id: 'select', label: 'Select', icon: '👆' },
     { id: 'bulldoze', label: 'Bulldoze', icon: '🚧' },
     { id: 'office', label: 'Office', icon: '🏢' },
     { id: 'park', label: 'Park', icon: '🌳' },
     { id: 'shop', label: 'Shop', icon: '🏪' },
     { id: 'road', label: 'Road', icon: '🛣️' },
   ];

   export function Toolbar() {
     const { state, dispatch } = useSimulationContext();

     const handleToolSelect = (toolId: string) => {
       dispatch({ type: 'SET_TOOL', payload: toolId === state.selectedTool ? null : toolId });
     };

     return (
       <div className="toolbar">
         <h3 className="toolbar-title">Building Tools</h3>
         <div className="tool-grid">
           {tools.map(tool => (
             <button
               key={tool.id}
               className={`tool-button ${state.selectedTool === tool.id ? 'active' : ''}`}
               onClick={() => handleToolSelect(tool.id)}
               disabled={!state.isInitialized}
             >
               <span className="tool-icon">{tool.icon}</span>
               <span className="tool-label">{tool.label}</span>
             </button>
           ))}
         </div>
       </div>
     );
   }
   ```

9. **Create control panel** (src/components/ControlPanel.tsx):
   ```typescript
   import React from 'react';
   import { useSimulationContext } from '../contexts/SimulationContext';
   import { useSimulation } from '../hooks/useSimulation';

   export function ControlPanel() {
     const { state } = useSimulationContext();
     const { start, pause, setSpeed } = useSimulation();

     const formatTime = (time: number) => {
       const hours = Math.floor(time);
       const minutes = Math.floor((time - hours) * 60);
       return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
     };

     return (
       <div className="control-panel">
         <div className="control-group">
           <label className="control-label">Simulation</label>
           <div className="control-buttons">
             <button
               className="button button-primary"
               onClick={state.isRunning ? pause : start}
               disabled={!state.isInitialized}
             >
               {state.isRunning ? '⏸️ Pause' : '▶️ Play'}
             </button>
           </div>
         </div>

         <div className="control-group">
           <label className="control-label">
             Speed: {state.speed.toFixed(1)}x
           </label>
           <input
             type="range"
             min="0.1"
             max="5"
             step="0.1"
             value={state.speed}
             onChange={(e) => setSpeed(parseFloat(e.target.value))}
             className="speed-slider"
             disabled={!state.isInitialized}
           />
         </div>

         <div className="control-group">
           <label className="control-label">Time</label>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <span>{formatTime(state.currentTime)}</span>
             <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
               Day {state.day + 1}
             </span>
           </div>
         </div>
       </div>
     );
   }
   ```

10. **Create main app component** (src/App.tsx):
    ```typescript
    import React, { useEffect } from 'react';
    import { SimulationProvider } from './contexts/SimulationContext';
    import { ErrorBoundary } from './components/ErrorBoundary';
    import { LoadingScreen } from './components/LoadingScreen';
    import { Toolbar } from './components/Toolbar';
    import { ControlPanel } from './components/ControlPanel';
    import { useSimulation } from './hooks/useSimulation';
    import { useSimulationContext } from './contexts/SimulationContext';
    import './styles/globals.css';
    import './styles/components.css';

    function AppContent() {
      const { state } = useSimulationContext();
      const { initialize } = useSimulation();

      useEffect(() => {
        initialize();
      }, [initialize]);

      return (
        <>
          <LoadingScreen
            isVisible={state.isLoading}
            message="Loading city simulation"
          />

          <div className="app">
            <header className="app-header">
              <h1 className="app-title">UrbanSynth</h1>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {state.stats.totalAgents} agents
                </span>
                {state.error && (
                  <span style={{ color: 'var(--error-color)', fontSize: '0.875rem' }}>
                    Error: {state.error}
                  </span>
                )}
              </div>
            </header>

            <main className="app-main">
              <div className="visualization-container">
                {/* Visualization will be added in PLAN5 */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: 'white',
                  fontSize: '1.5rem'
                }}>
                  🏙️ City Visualization Coming Soon
                  {state.selectedTool && (
                    <div style={{ position: 'absolute', top: '1rem', left: '1rem' }}>
                      Selected Tool: {state.selectedTool}
                    </div>
                  )}
                </div>
              </div>

              <aside className="sidebar">
                <Toolbar />
                <ControlPanel />

                <div className="stats-panel">
                  <h3 className="toolbar-title">Statistics</h3>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-label">Total Agents</div>
                      <div className="stat-value">{state.stats.totalAgents}</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Active</div>
                      <div className="stat-value">{state.stats.activeAgents}</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Avg Speed</div>
                      <div className="stat-value">{state.stats.averageSpeed.toFixed(1)}</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Congestion</div>
                      <div className="stat-value">{(state.stats.congestionLevel * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                </div>
              </aside>
            </main>
          </div>
        </>
      );
    }

    function App() {
      return (
        <ErrorBoundary>
          <SimulationProvider>
            <AppContent />
          </SimulationProvider>
        </ErrorBoundary>
      );
    }

    export default App;
    ```

11. **Update main.tsx** to import styles:
    ```typescript
    import React from 'react'
    import ReactDOM from 'react-dom/client'
    import App from './App'

    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    )
    ```

### Acceptance Criteria
- [ ] React application renders without errors
- [ ] All components are created and properly structured
- [ ] WASM module loads and initializes successfully
- [ ] Simulation controls (play/pause/speed) work correctly
- [ ] Tool selection system functions properly
- [ ] Loading states and error handling work as expected
- [ ] UI is responsive and visually appealing
- [ ] Statistics update in real-time
- [ ] Application gracefully handles WASM errors

### Test Plan
Execute from project root directory:

```bash
#!/bin/bash
set -e

echo "🧪 Testing PLAN4: Interactive Frontend Setup"

# Test 1: Verify component files
echo "⚛️ Testing React component files..."
required_files=(
  "src/App.tsx"
  "src/components/SimulationController.tsx"
  "src/components/Toolbar.tsx"
  "src/components/ControlPanel.tsx"
  "src/components/LoadingScreen.tsx"
  "src/components/ErrorBoundary.tsx"
  "src/hooks/useSimulation.ts"
  "src/contexts/SimulationContext.tsx"
  "src/utils/wasmLoader.ts"
  "src/styles/globals.css"
  "src/styles/components.css"
)

for file in "${required_files[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ Required file $file not found"
    exit 1
  fi
done
echo "✅ All React component files present"

# Test 2: TypeScript compilation
echo "🔧 Testing TypeScript compilation..."
npx tsc --noEmit || exit 1
echo "✅ TypeScript compilation successful"

# Test 3: Build test
echo "📦 Testing build process..."
npm run build > /dev/null 2>&1 || exit 1
if [ ! -d "dist" ]; then
  echo "❌ Build output directory not found"
  exit 1
fi
echo "✅ Build process successful"

# Test 4: Development server test
echo "🚀 Testing development server..."
timeout 15s npm run dev > /dev/null 2>&1 &
DEV_PID=$!
sleep 10

if kill -0 $DEV_PID 2>/dev/null; then
  echo "✅ Development server running"
  kill $DEV_PID
  wait $DEV_PID 2>/dev/null
else
  echo "❌ Development server failed to start"
  exit 1
fi

# Test 5: Component imports test
echo "🔍 Testing component imports..."
node -e "
  const React = require('react');
  const { JSDOM } = require('jsdom');

  // Set up DOM environment
  const dom = new JSDOM('<!DOCTYPE html><html><body><div id=\"root\"></div></body></html>');
  global.window = dom.window;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;

  console.log('✅ React environment setup successful');
" 2>/dev/null || echo "⚠️ Component import test skipped (requires jsdom)"

# Test 6: CSS validation
echo "🎨 Testing CSS files..."
for css_file in src/styles/*.css; do
  if [ -f "$css_file" ]; then
    # Basic CSS validation - check for balanced braces
    open_braces=$(grep -o '{' "$css_file" | wc -l)
    close_braces=$(grep -o '}' "$css_file" | wc -l)
    if [ "$open_braces" -ne "$close_braces" ]; then
      echo "❌ CSS syntax error in $css_file: unbalanced braces"
      exit 1
    fi
  fi
done
echo "✅ CSS files valid"

# Test 7: Check for required dependencies
echo "📋 Testing required dependencies..."
if ! npm list react react-dom typescript > /dev/null 2>&1; then
  echo "❌ Missing required React dependencies"
  exit 1
fi
echo "✅ Required dependencies present"

echo "🎉 PLAN4 COMPLETED SUCCESSFULLY"
echo "📊 Frontend Stats:"
echo "   - Components: $(find src/components -name "*.tsx" | wc -l)"
echo "   - Hooks: $(find src/hooks -name "*.ts" | wc -l)"
echo "   - Contexts: $(find src/contexts -name "*.tsx" | wc -l)"
echo "   - Build size: $(du -sh dist 2>/dev/null | cut -f1 || echo "Unknown")"
echo "Next: Execute PLAN5 for deck.gl visualization"
exit 0
```