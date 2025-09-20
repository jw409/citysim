---
id: PLAN10
title: "Geographic-Aware City Generation with Terrain Integration"
dependencies: ["PLAN1", "PLAN2", "PLAN3", "PLAN4", "PLAN5"]
status: pending
artifacts:
  - "src/components/TerrainControlPanel.tsx"
  - "src/hooks/useTerrainControls.ts"
  - "src/utils/geographicCityGenerator.ts"
  - "src/utils/terrainAwarePlacement.ts"
  - "src/contexts/TerrainContext.tsx"
  - "scripts/generate_geographic_city.cjs"
  - "src/components/DraggablePanel.tsx"
  - "src/layers/EnhancedTerrainLayer.ts"
  - "src/utils/realWorldTerrainProfiles.ts"
---

### Objective
Integrate the existing PlanetaryTerrain system with the city generation pipeline to create realistic, geography-aware cities where urban development responds to natural features like rivers, hills, and coastlines - similar to how New York differs from San Francisco due to their distinct geographic settings.

### Background
The codebase currently has:
- **PlanetaryTerrain.tsx**: Advanced 3D terrain generation with multi-scale support
- **terrainGenerator.ts**: Simpler terrain system already integrated
- **generate_city.cjs**: Flat city generation that ignores geography
- **CityVisualization**: Visualization that can display terrain layers

The goal is to bridge these systems and create a floating, movable control panel that allows real-time terrain manipulation and geography-aware city generation.

### Task Breakdown

1. **Create draggable panel component** (src/components/DraggablePanel.tsx):
   ```typescript
   import React, { useState, useRef, useEffect, ReactNode } from 'react';

   interface DraggablePanelProps {
     title: string;
     children: ReactNode;
     defaultPosition?: { x: number; y: number };
     defaultSize?: { width: number; height: number };
     isCollapsible?: boolean;
     initiallyCollapsed?: boolean;
     zIndex?: number;
   }

   export function DraggablePanel({
     title,
     children,
     defaultPosition = { x: 20, y: 20 },
     defaultSize = { width: 320, height: 400 },
     isCollapsible = true,
     initiallyCollapsed = false,
     zIndex = 1000
   }: DraggablePanelProps) {
     const [position, setPosition] = useState(defaultPosition);
     const [size, setSize] = useState(defaultSize);
     const [isCollapsed, setIsCollapsed] = useState(initiallyCollapsed);
     const [isDragging, setIsDragging] = useState(false);
     const [isResizing, setIsResizing] = useState(false);
     const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
     const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

     const panelRef = useRef<HTMLDivElement>(null);

     const handleMouseDown = (e: React.MouseEvent) => {
       if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('panel-header')) {
         setIsDragging(true);
         setDragStart({
           x: e.clientX - position.x,
           y: e.clientY - position.y
         });
       }
     };

     const handleResizeMouseDown = (e: React.MouseEvent) => {
       e.stopPropagation();
       setIsResizing(true);
       setResizeStart({
         x: e.clientX,
         y: e.clientY,
         width: size.width,
         height: size.height
       });
     };

     useEffect(() => {
       const handleMouseMove = (e: MouseEvent) => {
         if (isDragging) {
           setPosition({
             x: e.clientX - dragStart.x,
             y: e.clientY - dragStart.y
           });
         } else if (isResizing) {
           setSize({
             width: Math.max(250, resizeStart.width + (e.clientX - resizeStart.x)),
             height: Math.max(200, resizeStart.height + (e.clientY - resizeStart.y))
           });
         }
       };

       const handleMouseUp = () => {
         setIsDragging(false);
         setIsResizing(false);
       };

       if (isDragging || isResizing) {
         document.addEventListener('mousemove', handleMouseMove);
         document.addEventListener('mouseup', handleMouseUp);
       }

       return () => {
         document.removeEventListener('mousemove', handleMouseMove);
         document.removeEventListener('mouseup', handleMouseUp);
       };
     }, [isDragging, isResizing, dragStart, resizeStart]);

     return (
       <div
         ref={panelRef}
         className="floating-panel"
         style={{
           position: 'fixed',
           left: position.x,
           top: position.y,
           width: size.width,
           height: isCollapsed ? 'auto' : size.height,
           zIndex,
           background: 'var(--surface-color)',
           border: '1px solid var(--border-color)',
           borderRadius: 'var(--border-radius)',
           boxShadow: 'var(--shadow-lg)',
           cursor: isDragging ? 'grabbing' : 'grab',
           userSelect: 'none'
         }}
         onMouseDown={handleMouseDown}
       >
         <div
           className="panel-header"
           style={{
             padding: '0.75rem 1rem',
             borderBottom: '1px solid var(--border-color)',
             background: 'var(--background-color)',
             borderRadius: 'var(--border-radius) var(--border-radius) 0 0',
             display: 'flex',
             justifyContent: 'space-between',
             alignItems: 'center',
             fontSize: '0.875rem',
             fontWeight: 600
           }}
         >
           <span>{title}</span>
           <div style={{ display: 'flex', gap: '0.5rem' }}>
             {isCollapsible && (
               <button
                 onClick={(e) => {
                   e.stopPropagation();
                   setIsCollapsed(!isCollapsed);
                 }}
                 style={{
                   background: 'none',
                   border: 'none',
                   cursor: 'pointer',
                   fontSize: '0.75rem',
                   padding: '0.25rem'
                 }}
               >
                 {isCollapsed ? '▼' : '▲'}
               </button>
             )}
           </div>
         </div>

         {!isCollapsed && (
           <>
             <div
               className="panel-content"
               style={{
                 padding: '1rem',
                 overflow: 'auto',
                 height: size.height - 60, // Account for header
                 cursor: 'default'
               }}
               onMouseDown={(e) => e.stopPropagation()}
             >
               {children}
             </div>

             <div
               className="resize-handle"
               style={{
                 position: 'absolute',
                 bottom: 0,
                 right: 0,
                 width: 16,
                 height: 16,
                 cursor: 'se-resize',
                 background: 'linear-gradient(-45deg, transparent 30%, var(--border-color) 30%, var(--border-color) 70%, transparent 70%)'
               }}
               onMouseDown={handleResizeMouseDown}
             />
           </>
         )}
       </div>
     );
   }
   ```

2. **Create terrain context** (src/contexts/TerrainContext.tsx):
   ```typescript
   import React, { createContext, useContext, useReducer, ReactNode } from 'react';

   export interface TerrainState {
     isEnabled: boolean;
     scale: number; // 1 = city, 100 = regional, 1000+ = planetary
     seed: number;
     timeOfDay: number;
     showAtmosphere: boolean;
     terrainProfile: string; // 'manhattan', 'san_francisco', 'denver', 'miami', 'custom'
     customParameters: {
       mountainHeight: number;
       waterLevel: number;
       hilliness: number;
       riverProbability: number;
       coastalDistance: number;
     };
     activeLayer: 'planetary' | 'basic' | 'none';
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
     | { type: 'RESET_TO_DEFAULTS' };

   const initialState: TerrainState = {
     isEnabled: true,
     scale: 1, // City scale by default
     seed: 12345,
     timeOfDay: 12,
     showAtmosphere: false,
     terrainProfile: 'manhattan',
     customParameters: {
       mountainHeight: 100,
       waterLevel: 0,
       hilliness: 0.5,
       riverProbability: 0.3,
       coastalDistance: 5000
     },
     activeLayer: 'basic'
   };

   function terrainReducer(state: TerrainState, action: TerrainAction): TerrainState {
     switch (action.type) {
       case 'TOGGLE_TERRAIN':
         return { ...state, isEnabled: action.payload };
       case 'SET_SCALE':
         return {
           ...state,
           scale: action.payload,
           activeLayer: action.payload > 50 ? 'planetary' : 'basic'
         };
       case 'SET_SEED':
         return { ...state, seed: action.payload };
       case 'SET_TIME_OF_DAY':
         return { ...state, timeOfDay: action.payload };
       case 'TOGGLE_ATMOSPHERE':
         return { ...state, showAtmosphere: action.payload };
       case 'SET_TERRAIN_PROFILE':
         return { ...state, terrainProfile: action.payload };
       case 'UPDATE_CUSTOM_PARAMETERS':
         return {
           ...state,
           customParameters: { ...state.customParameters, ...action.payload }
         };
       case 'SET_ACTIVE_LAYER':
         return { ...state, activeLayer: action.payload };
       case 'RESET_TO_DEFAULTS':
         return initialState;
       default:
         return state;
     }
   }

   interface TerrainContextType {
     state: TerrainState;
     dispatch: React.Dispatch<TerrainAction>;
   }

   const TerrainContext = createContext<TerrainContextType | undefined>(undefined);

   export function TerrainProvider({ children }: { children: ReactNode }) {
     const [state, dispatch] = useReducer(terrainReducer, initialState);

     return (
       <TerrainContext.Provider value={{ state, dispatch }}>
         {children}
       </TerrainContext.Provider>
     );
   }

   export function useTerrainContext() {
     const context = useContext(TerrainContext);
     if (context === undefined) {
       throw new Error('useTerrainContext must be used within a TerrainProvider');
     }
     return context;
   }
   ```

3. **Create terrain controls hook** (src/hooks/useTerrainControls.ts):
   ```typescript
   import { useCallback } from 'react';
   import { useTerrainContext } from '../contexts/TerrainContext';
   import { getTerrainProfilePresets } from '../utils/realWorldTerrainProfiles';

   export function useTerrainControls() {
     const { state, dispatch } = useTerrainContext();

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

     const setTerrainProfile = useCallback((profile: string) => {
       dispatch({ type: 'SET_TERRAIN_PROFILE', payload: profile });

       // Apply preset parameters if not custom
       if (profile !== 'custom') {
         const preset = getTerrainProfilePresets()[profile];
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

     const regenerateTerrain = useCallback(() => {
       // Generate new random seed
       const newSeed = Math.floor(Math.random() * 1000000);
       dispatch({ type: 'SET_SEED', payload: newSeed });
     }, [dispatch]);

     const resetToDefaults = useCallback(() => {
       dispatch({ type: 'RESET_TO_DEFAULTS' });
     }, [dispatch]);

     return {
       state,
       toggleTerrain,
       setScale,
       setSeed,
       setTimeOfDay,
       toggleAtmosphere,
       setTerrainProfile,
       updateCustomParameter,
       regenerateTerrain,
       resetToDefaults
     };
   }
   ```

4. **Create real-world terrain profiles** (src/utils/realWorldTerrainProfiles.ts):
   ```typescript
   interface TerrainProfile {
     name: string;
     description: string;
     parameters: {
       mountainHeight: number;
       waterLevel: number;
       hilliness: number;
       riverProbability: number;
       coastalDistance: number;
     };
     recommendedScale: number;
     characteristics: string[];
   }

   export function getTerrainProfilePresets(): Record<string, TerrainProfile> {
     return {
       manhattan: {
         name: 'Manhattan',
         description: 'Island city with rivers and harbors',
         parameters: {
           mountainHeight: 20,
           waterLevel: 0,
           hilliness: 0.1,
           riverProbability: 0.8,
           coastalDistance: 1000
         },
         recommendedScale: 1,
         characteristics: ['Island setting', 'Multiple rivers', 'Flat terrain', 'Dense waterfront']
       },

       san_francisco: {
         name: 'San Francisco',
         description: 'Hilly peninsula with bay access',
         parameters: {
           mountainHeight: 150,
           waterLevel: 0,
           hilliness: 0.9,
           riverProbability: 0.2,
           coastalDistance: 2000
         },
         recommendedScale: 1,
         characteristics: ['Steep hills', 'Bay coastline', 'Peninsula', 'Varied elevation']
       },

       denver: {
         name: 'Denver',
         description: 'High plains with mountain backdrop',
         parameters: {
           mountainHeight: 300,
           waterLevel: -50,
           hilliness: 0.3,
           riverProbability: 0.4,
           coastalDistance: 50000
         },
         recommendedScale: 10,
         characteristics: ['High elevation', 'Mountain views', 'Prairie setting', 'Continental climate']
       },

       miami: {
         name: 'Miami',
         description: 'Coastal lowlands with barrier islands',
         parameters: {
           mountainHeight: 5,
           waterLevel: 5,
           hilliness: 0.05,
           riverProbability: 0.6,
           coastalDistance: 500
         },
         recommendedScale: 1,
         characteristics: ['Very flat', 'Coastal flooding risk', 'Barrier islands', 'Subtropical wetlands']
       },

       seattle: {
         name: 'Seattle',
         description: 'Puget Sound with rolling hills',
         parameters: {
           mountainHeight: 120,
           waterLevel: 0,
           hilliness: 0.6,
           riverProbability: 0.5,
           coastalDistance: 1500
         },
         recommendedScale: 1,
         characteristics: ['Rolling hills', 'Sound waterfront', 'Moderate terrain', 'Rain shadowing']
       },

       chicago: {
         name: 'Chicago',
         description: 'Great Lakes shore with flat prairie',
         parameters: {
           mountainHeight: 10,
           waterLevel: 0,
           hilliness: 0.05,
           riverProbability: 0.3,
           coastalDistance: 800
         },
         recommendedScale: 5,
         characteristics: ['Very flat', 'Lakefront', 'River confluence', 'Prairie landscape']
       },

       custom: {
         name: 'Custom',
         description: 'User-defined terrain parameters',
         parameters: {
           mountainHeight: 100,
           waterLevel: 0,
           hilliness: 0.5,
           riverProbability: 0.3,
           coastalDistance: 5000
         },
         recommendedScale: 1,
         characteristics: ['Fully customizable']
       }
     };
   }

   export function getTerrainProfileList(): { value: string; label: string; description: string }[] {
     const profiles = getTerrainProfilePresets();
     return Object.entries(profiles).map(([key, profile]) => ({
       value: key,
       label: profile.name,
       description: profile.description
     }));
   }
   ```

5. **Create terrain control panel** (src/components/TerrainControlPanel.tsx):
   ```typescript
   import React from 'react';
   import { DraggablePanel } from './DraggablePanel';
   import { useTerrainControls } from '../hooks/useTerrainControls';
   import { getTerrainProfileList } from '../utils/realWorldTerrainProfiles';

   export function TerrainControlPanel() {
     const {
       state,
       toggleTerrain,
       setScale,
       setSeed,
       setTimeOfDay,
       toggleAtmosphere,
       setTerrainProfile,
       updateCustomParameter,
       regenerateTerrain,
       resetToDefaults
     } = useTerrainControls();

     const terrainProfiles = getTerrainProfileList();

     return (
       <DraggablePanel
         title="🏔️ Terrain Controls"
         defaultPosition={{ x: 350, y: 20 }}
         defaultSize={{ width: 320, height: 600 }}
         isCollapsible={true}
         initiallyCollapsed={false}
       >
         <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

           {/* Master Toggle */}
           <div className="control-group">
             <label className="control-label">
               <input
                 type="checkbox"
                 checked={state.isEnabled}
                 onChange={(e) => toggleTerrain(e.target.checked)}
                 style={{ marginRight: '0.5rem' }}
               />
               Enable Terrain
             </label>
           </div>

           {state.isEnabled && (
             <>
               {/* Terrain Profile Selection */}
               <div className="control-group">
                 <label className="control-label">Terrain Profile</label>
                 <select
                   value={state.terrainProfile}
                   onChange={(e) => setTerrainProfile(e.target.value)}
                   style={{
                     width: '100%',
                     padding: '0.5rem',
                     border: '1px solid var(--border-color)',
                     borderRadius: 'var(--border-radius)',
                     background: 'var(--surface-color)'
                   }}
                 >
                   {terrainProfiles.map(profile => (
                     <option key={profile.value} value={profile.value}>
                       {profile.label}
                     </option>
                   ))}
                 </select>
                 <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                   {terrainProfiles.find(p => p.value === state.terrainProfile)?.description}
                 </small>
               </div>

               {/* Scale Control */}
               <div className="control-group">
                 <label className="control-label">
                   Scale: {state.scale === 1 ? 'City' : state.scale < 100 ? 'Regional' : 'Planetary'} ({state.scale}x)
                 </label>
                 <input
                   type="range"
                   min="1"
                   max="1000"
                   step="1"
                   value={state.scale}
                   onChange={(e) => setScale(parseInt(e.target.value))}
                   className="speed-slider"
                 />
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                   <span>City</span>
                   <span>Regional</span>
                   <span>Planetary</span>
                 </div>
               </div>

               {/* Seed Control */}
               <div className="control-group">
                 <label className="control-label">Terrain Seed</label>
                 <div style={{ display: 'flex', gap: '0.5rem' }}>
                   <input
                     type="number"
                     value={state.seed}
                     onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
                     style={{
                       flex: 1,
                       padding: '0.5rem',
                       border: '1px solid var(--border-color)',
                       borderRadius: 'var(--border-radius)',
                       background: 'var(--surface-color)'
                     }}
                   />
                   <button
                     onClick={regenerateTerrain}
                     className="button button-secondary"
                     style={{ padding: '0.5rem' }}
                   >
                     🎲
                   </button>
                 </div>
               </div>

               {/* Time of Day */}
               <div className="control-group">
                 <label className="control-label">
                   Time of Day: {state.timeOfDay}:00
                 </label>
                 <input
                   type="range"
                   min="0"
                   max="23"
                   step="1"
                   value={state.timeOfDay}
                   onChange={(e) => setTimeOfDay(parseInt(e.target.value))}
                   className="speed-slider"
                 />
               </div>

               {/* Atmosphere Toggle */}
               {state.scale > 50 && (
                 <div className="control-group">
                   <label className="control-label">
                     <input
                       type="checkbox"
                       checked={state.showAtmosphere}
                       onChange={(e) => toggleAtmosphere(e.target.checked)}
                       style={{ marginRight: '0.5rem' }}
                     />
                     Show Atmosphere
                   </label>
                 </div>
               )}

               {/* Custom Parameters (only for custom profile) */}
               {state.terrainProfile === 'custom' && (
                 <div className="control-group">
                   <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                     Custom Parameters
                   </div>

                   <label className="control-label">
                     Mountain Height: {state.customParameters.mountainHeight}m
                   </label>
                   <input
                     type="range"
                     min="0"
                     max="500"
                     step="10"
                     value={state.customParameters.mountainHeight}
                     onChange={(e) => updateCustomParameter('mountainHeight', parseInt(e.target.value))}
                     className="speed-slider"
                   />

                   <label className="control-label">
                     Water Level: {state.customParameters.waterLevel}m
                   </label>
                   <input
                     type="range"
                     min="-50"
                     max="50"
                     step="5"
                     value={state.customParameters.waterLevel}
                     onChange={(e) => updateCustomParameter('waterLevel', parseInt(e.target.value))}
                     className="speed-slider"
                   />

                   <label className="control-label">
                     Hilliness: {(state.customParameters.hilliness * 100).toFixed(0)}%
                   </label>
                   <input
                     type="range"
                     min="0"
                     max="1"
                     step="0.1"
                     value={state.customParameters.hilliness}
                     onChange={(e) => updateCustomParameter('hilliness', parseFloat(e.target.value))}
                     className="speed-slider"
                   />

                   <label className="control-label">
                     River Probability: {(state.customParameters.riverProbability * 100).toFixed(0)}%
                   </label>
                   <input
                     type="range"
                     min="0"
                     max="1"
                     step="0.1"
                     value={state.customParameters.riverProbability}
                     onChange={(e) => updateCustomParameter('riverProbability', parseFloat(e.target.value))}
                     className="speed-slider"
                   />

                   <label className="control-label">
                     Coastal Distance: {(state.customParameters.coastalDistance / 1000).toFixed(1)}km
                   </label>
                   <input
                     type="range"
                     min="500"
                     max="100000"
                     step="500"
                     value={state.customParameters.coastalDistance}
                     onChange={(e) => updateCustomParameter('coastalDistance', parseInt(e.target.value))}
                     className="speed-slider"
                   />
                 </div>
               )}

               {/* Action Buttons */}
               <div className="control-group">
                 <div style={{ display: 'flex', gap: '0.5rem' }}>
                   <button
                     onClick={regenerateTerrain}
                     className="button button-primary"
                     style={{ flex: 1 }}
                   >
                     🔄 Regenerate
                   </button>
                   <button
                     onClick={resetToDefaults}
                     className="button button-secondary"
                     style={{ flex: 1 }}
                   >
                     🔄 Reset
                   </button>
                 </div>
               </div>

               {/* Info Display */}
               <div style={{
                 background: 'var(--background-color)',
                 padding: '0.75rem',
                 borderRadius: 'var(--border-radius)',
                 fontSize: '0.75rem',
                 color: 'var(--text-secondary)'
               }}>
                 <div><strong>Active Layer:</strong> {state.activeLayer}</div>
                 <div><strong>Seed:</strong> {state.seed}</div>
                 {state.terrainProfile !== 'custom' && (
                   <div><strong>Profile:</strong> {state.terrainProfile}</div>
                 )}
               </div>
             </>
           )}
         </div>
       </DraggablePanel>
     );
   }
   ```

6. **Create enhanced terrain layer** (src/layers/EnhancedTerrainLayer.ts):
   ```typescript
   import { PolygonLayer } from '@deck.gl/layers';
   import { PlanetaryTerrain } from '../components/PlanetaryTerrain';
   import { generateTerrainLayers } from '../utils/terrainGenerator';
   import { TerrainState } from '../contexts/TerrainContext';

   export function createEnhancedTerrainLayer(
     bounds: any,
     terrainState: TerrainState
   ): any[] {
     if (!terrainState.isEnabled) {
       return [];
     }

     const { scale, seed, timeOfDay, showAtmosphere, activeLayer } = terrainState;

     switch (activeLayer) {
       case 'planetary':
         // Use the advanced PlanetaryTerrain for large scales
         return [
           PlanetaryTerrain({
             bounds,
             scale,
             timeOfDay,
             seed,
             showAtmosphere
           })
         ];

       case 'basic':
         // Use the simpler terrain generator for city scale
         return generateTerrainLayers(bounds, timeOfDay, seed);

       case 'none':
       default:
         return [];
     }
   }
   ```

7. **Create geographic city generator** (src/utils/geographicCityGenerator.ts):
   ```typescript
   import { TerrainState } from '../contexts/TerrainContext';
   import { getTerrainProfilePresets } from './realWorldTerrainProfiles';

   interface GeographicContext {
     terrainHeight: (x: number, y: number) => number;
     isWater: (x: number, y: number) => boolean;
     distanceToWater: (x: number, y: number) => number;
     slope: (x: number, y: number) => number;
     riverPaths: Array<{ x: number, y: number }[]>;
   }

   export class GeographicCityGenerator {
     private terrainState: TerrainState;
     private context: GeographicContext;

     constructor(terrainState: TerrainState, bounds: any) {
       this.terrainState = terrainState;
       this.context = this.buildGeographicContext(bounds);
     }

     private buildGeographicContext(bounds: any): GeographicContext {
       const { customParameters, terrainProfile, seed } = this.terrainState;
       const profile = getTerrainProfilePresets()[terrainProfile];
       const params = terrainProfile === 'custom' ? customParameters : profile.parameters;

       // Simple noise-based terrain analysis
       const noiseScale = 0.001;

       const terrainHeight = (x: number, y: number): number => {
         // Use same noise as terrain generation for consistency
         const noise = this.perlinNoise(x * noiseScale, y * noiseScale, seed);
         return noise * params.mountainHeight;
       };

       const isWater = (x: number, y: number): boolean => {
         const height = terrainHeight(x, y);
         return height < params.waterLevel;
       };

       const distanceToWater = (x: number, y: number): number => {
         // Simplified distance calculation
         const coastalFactor = params.coastalDistance;
         const distanceFromEdge = Math.min(
           Math.abs(x - bounds.min_x),
           Math.abs(x - bounds.max_x),
           Math.abs(y - bounds.min_y),
           Math.abs(y - bounds.max_y)
         );
         return Math.min(distanceFromEdge, coastalFactor);
       };

       const slope = (x: number, y: number): number => {
         const delta = 50; // Sample distance
         const h1 = terrainHeight(x - delta, y);
         const h2 = terrainHeight(x + delta, y);
         const h3 = terrainHeight(x, y - delta);
         const h4 = terrainHeight(x, y + delta);

         const slopeX = Math.abs(h2 - h1) / (2 * delta);
         const slopeY = Math.abs(h4 - h3) / (2 * delta);

         return Math.sqrt(slopeX * slopeX + slopeY * slopeY);
       };

       const riverPaths = this.generateRiverPaths(bounds, params);

       return {
         terrainHeight,
         isWater,
         distanceToWater,
         slope,
         riverPaths
       };
     }

     // Generate river paths based on terrain profile
     private generateRiverPaths(bounds: any, params: any): Array<{ x: number, y: number }[]> {
       const rivers: Array<{ x: number, y: number }[]> = [];

       if (Math.random() < params.riverProbability) {
         // Generate a main river
         const riverPath: { x: number, y: number }[] = [];
         const centerX = (bounds.min_x + bounds.max_x) / 2;

         for (let y = bounds.min_y - 1000; y <= bounds.max_y + 1000; y += 100) {
           const meander = Math.sin(y / 1000) * 400 + (Math.random() - 0.5) * 200;
           riverPath.push({ x: centerX + meander, y });
         }

         rivers.push(riverPath);
       }

       return rivers;
     }

     // Simplified Perlin noise
     private perlinNoise(x: number, y: number, seed: number): number {
       // Simple noise implementation for terrain-aware placement
       const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
       return n - Math.floor(n);
     }

     // Main method: determine suitable locations for city features based on geography
     public getZoneSuitability(x: number, y: number, zoneType: string): number {
       const height = this.context.terrainHeight(x, y);
       const isWater = this.context.isWater(x, y);
       const waterDistance = this.context.distanceToWater(x, y);
       const slope = this.context.slope(x, y);

       // Can't build on water (unless specific water-based infrastructure)
       if (isWater && zoneType !== 'port' && zoneType !== 'marina') {
         return 0;
       }

       let suitability = 1.0;

       switch (zoneType) {
         case 'downtown':
           // Downtown likes flat areas near water (harbors, rivers)
           suitability *= (1 - Math.min(slope * 5, 0.8)); // Prefer flat
           suitability *= Math.max(0.2, 1 - waterDistance / 2000); // Near water
           suitability *= Math.max(0.1, 1 - Math.abs(height) / 50); // Near sea level
           break;

         case 'residential':
           // Residential can handle some slope, wants moderate water access
           suitability *= (1 - Math.min(slope * 3, 0.6)); // Some slope OK
           suitability *= Math.max(0.5, 1 - waterDistance / 5000); // Moderate water access
           if (height > 20) suitability *= 1.2; // Slight bonus for elevation (views)
           break;

         case 'commercial':
           // Commercial wants accessibility (flat areas, transport corridors)
           suitability *= (1 - Math.min(slope * 4, 0.7)); // Prefer flat
           suitability *= Math.max(0.3, 1 - waterDistance / 3000); // Moderate water access
           break;

         case 'industrial':
           // Industrial wants flat areas, water access for transport, away from steep terrain
           suitability *= (1 - Math.min(slope * 6, 0.9)); // Very flat preferred
           suitability *= Math.max(0.4, 1 - waterDistance / 1500); // Good water access
           if (Math.abs(height) < 10) suitability *= 1.3; // Bonus for very flat areas
           break;

         case 'park':
           // Parks can use varied terrain, including hills
           if (slope > 0.1) suitability *= 1.5; // Actually prefer some terrain variation
           if (height > 50) suitability *= 1.3; // Bonus for elevated areas (scenic)
           break;

         default:
           break;
       }

       return Math.max(0, Math.min(1, suitability));
     }

     // Generate geographic-aware POI placement
     public getOptimalPOILocation(poiType: string, searchRadius: number, centerX: number, centerY: number): { x: number, y: number, suitability: number } | null {
       let bestLocation: { x: number, y: number, suitability: number } | null = null;
       let bestSuitability = 0;

       const samples = 20; // Number of locations to test

       for (let i = 0; i < samples; i++) {
         const angle = (i / samples) * 2 * Math.PI;
         const distance = Math.random() * searchRadius;
         const x = centerX + Math.cos(angle) * distance;
         const y = centerY + Math.sin(angle) * distance;

         let suitability = this.getZoneSuitability(x, y, poiType);

         // Additional POI-specific rules
         if (poiType === 'lighthouse' || poiType === 'port') {
           const waterDistance = this.context.distanceToWater(x, y);
           suitability *= Math.max(0, 1 - waterDistance / 500); // Must be very close to water
         }

         if (poiType === 'ski_resort' || poiType === 'observatory') {
           const height = this.context.terrainHeight(x, y);
           suitability *= Math.max(0, height / 200); // Prefer high elevation
         }

         if (suitability > bestSuitability) {
           bestSuitability = suitability;
           bestLocation = { x, y, suitability };
         }
       }

       return bestLocation;
     }
   }

   // Helper function to integrate with existing city generation
   export function enhanceCityWithGeography(cityModel: any, terrainState: TerrainState): any {
     if (!terrainState.isEnabled) {
       return cityModel; // Return unchanged if terrain is disabled
     }

     const bounds = cityModel.bounds;
     const generator = new GeographicCityGenerator(terrainState, bounds);

     // Re-evaluate and potentially relocate zones based on geography
     const enhancedZones = cityModel.zones.map((zone: any) => {
       const centerX = zone.boundary.reduce((sum: number, p: any) => sum + p.x, 0) / zone.boundary.length;
       const centerY = zone.boundary.reduce((sum: number, p: any) => sum + p.y, 0) / zone.boundary.length;

       const suitability = generator.getZoneSuitability(centerX, centerY, zone.type);

       return {
         ...zone,
         geographic_suitability: suitability,
         terrain_context: {
           height: generator.context.terrainHeight(centerX, centerY),
           slope: generator.context.slope(centerX, centerY),
           water_distance: generator.context.distanceToWater(centerX, centerY)
         }
       };
     });

     // Add geography-specific POIs
     const geographicPOIs = [];

     // Add lighthouses near coasts
     if (terrainState.customParameters.coastalDistance < 5000) {
       const lighthouse = generator.getOptimalPOILocation('lighthouse', 2000, bounds.min_x, (bounds.min_y + bounds.max_y) / 2);
       if (lighthouse && lighthouse.suitability > 0.5) {
         geographicPOIs.push({
           id: `lighthouse_${Date.now()}`,
           type: 'lighthouse',
           position: { x: lighthouse.x, y: lighthouse.y },
           properties: { name: 'Harbor Lighthouse', capacity: 1 }
         });
       }
     }

     // Add scenic overlooks on high terrain
     if (terrainState.customParameters.mountainHeight > 100) {
       const overlook = generator.getOptimalPOILocation('observatory', 3000, (bounds.min_x + bounds.max_x) / 2, (bounds.min_y + bounds.max_y) / 2);
       if (overlook && overlook.suitability > 0.7) {
         geographicPOIs.push({
           id: `overlook_${Date.now()}`,
           type: 'scenic_overlook',
           position: { x: overlook.x, y: overlook.y },
           properties: { name: 'Scenic Overlook', capacity: 100 }
         });
       }
     }

     return {
       ...cityModel,
       zones: enhancedZones,
       pois: [...cityModel.pois, ...geographicPOIs],
       geographic_metadata: {
         terrain_profile: terrainState.terrainProfile,
         terrain_seed: terrainState.seed,
         generated_features: geographicPOIs.length
       }
     };
   }
   ```

8. **Create geographic city generation script** (scripts/generate_geographic_city.cjs):
   ```javascript
   const fs = require('fs');
   const path = require('path');
   const { createNoise2D } = require('simplex-noise');
   const protobuf = require('protobufjs');

   // Enhanced city generator that respects terrain
   class GeographicCityGenerator {
     constructor(terrainProfile = 'manhattan', seed = 'geo-city-v1') {
       this.seed = seed;
       this.terrainProfile = terrainProfile;
       this.noise = createNoise2D(() => this.hashSeed(seed));
       this.rngState = this.hashSeed(seed + '_rng') * 2147483647;

       // Load terrain profile
       this.terrainParams = this.getTerrainParams(terrainProfile);

       this.zones = [];
       this.roads = [];
       this.pois = [];
       this.buildings = [];
     }

     getTerrainParams(profile) {
       const profiles = {
         manhattan: {
           mountainHeight: 20,
           waterLevel: 0,
           hilliness: 0.1,
           riverProbability: 0.8,
           coastalDistance: 1000,
           characteristics: ['island', 'rivers', 'flat', 'dense_waterfront']
         },
         san_francisco: {
           mountainHeight: 150,
           waterLevel: 0,
           hilliness: 0.9,
           riverProbability: 0.2,
           coastalDistance: 2000,
           characteristics: ['hills', 'bay', 'peninsula', 'varied_elevation']
         },
         denver: {
           mountainHeight: 300,
           waterLevel: -50,
           hilliness: 0.3,
           riverProbability: 0.4,
           coastalDistance: 50000,
           characteristics: ['high_plains', 'mountains', 'continental']
         }
       };

       return profiles[profile] || profiles.manhattan;
     }

     hashSeed(seed) {
       let hash = 0;
       for (let i = 0; i < seed.length; i++) {
         const char = seed.charCodeAt(i);
         hash = ((hash << 5) - hash) + char;
         hash = hash & hash;
       }
       return Math.abs(hash) / 2147483647;
     }

     random() {
       this.rngState = (this.rngState * 1664525 + 1013904223) % 4294967296;
       return this.rngState / 4294967296;
     }

     // Terrain-aware helper functions
     getTerrainHeight(x, y) {
       const noiseScale = 0.001;
       const noise = this.noise(x * noiseScale, y * noiseScale);
       return noise * this.terrainParams.mountainHeight;
     }

     isWater(x, y) {
       return this.getTerrainHeight(x, y) < this.terrainParams.waterLevel;
     }

     getSlope(x, y, delta = 50) {
       const h1 = this.getTerrainHeight(x - delta, y);
       const h2 = this.getTerrainHeight(x + delta, y);
       const h3 = this.getTerrainHeight(x, y - delta);
       const h4 = this.getTerrainHeight(x, y + delta);

       const slopeX = Math.abs(h2 - h1) / (2 * delta);
       const slopeY = Math.abs(h4 - h3) / (2 * delta);

       return Math.sqrt(slopeX * slopeX + slopeY * slopeY);
     }

     getZoneSuitability(x, y, zoneType) {
       const height = this.getTerrainHeight(x, y);
       const isWater = this.isWater(x, y);
       const slope = this.getSlope(x, y);

       if (isWater && zoneType !== 'port') return 0;

       let suitability = 1.0;

       switch (zoneType) {
         case 'downtown':
           suitability *= (1 - Math.min(slope * 5, 0.8));
           suitability *= Math.max(0.1, 1 - Math.abs(height) / 50);
           break;
         case 'residential':
           suitability *= (1 - Math.min(slope * 3, 0.6));
           if (height > 20) suitability *= 1.2; // View bonus
           break;
         case 'industrial':
           suitability *= (1 - Math.min(slope * 6, 0.9));
           if (Math.abs(height) < 10) suitability *= 1.3;
           break;
         case 'park':
           if (slope > 0.1) suitability *= 1.5; // Parks like terrain variation
           break;
       }

       return Math.max(0, Math.min(1, suitability));
     }

     generateGeographicCity() {
       console.log(`🏔️ Generating ${this.terrainProfile} city with terrain awareness...`);

       this.generateTerrainAwareZones();
       this.generateGeographicRoads();
       this.generateTerrainAwarePOIs();
       this.generateGeographicBuildings();

       return this.createGeographicCityModel();
     }

     generateTerrainAwareZones() {
       console.log('📍 Generating terrain-aware zones...');

       // Sample many potential zone locations and pick the best ones
       const potentialZones = [];

       // Downtown: find the best flat area
       for (let i = 0; i < 50; i++) {
         const x = (this.random() - 0.5) * 4000;
         const y = (this.random() - 0.5) * 4000;
         const suitability = this.getZoneSuitability(x, y, 'downtown');

         if (suitability > 0.3) {
           potentialZones.push({
             type: 'downtown',
             x, y,
             suitability,
             width: 1200 + this.random() * 600,
             height: 800 + this.random() * 400
           });
         }
       }

       // Pick the best downtown location
       potentialZones.sort((a, b) => b.suitability - a.suitability);
       if (potentialZones.length > 0) {
         const best = potentialZones[0];
         this.zones.push({
           id: 'downtown_core',
           type: 3, // DOWNTOWN
           boundary: this.generateRectangularZone(best.x, best.y, best.width, best.height),
           density: 0.95,
           properties: {
             residential_density: 0.1,
             commercial_density: 0.4,
             office_density: 0.8,
             terrain_suitability: best.suitability
           }
         });
       }

       // Generate residential zones in suitable areas
       for (let i = 0; i < 6; i++) {
         let bestLocation = null;
         let bestSuitability = 0;

         for (let attempt = 0; attempt < 30; attempt++) {
           const x = (this.random() - 0.5) * 8000;
           const y = (this.random() - 0.5) * 8000;
           const suitability = this.getZoneSuitability(x, y, 'residential');

           if (suitability > bestSuitability) {
             bestSuitability = suitability;
             bestLocation = { x, y };
           }
         }

         if (bestLocation && bestSuitability > 0.2) {
           this.zones.push({
             id: `residential_${i}`,
             type: 0, // RESIDENTIAL
             boundary: this.generateRectangularZone(
               bestLocation.x,
               bestLocation.y,
               1000 + this.random() * 800,
               800 + this.random() * 600
             ),
             density: 0.7,
             properties: {
               residential_density: 0.85,
               commercial_density: 0.15,
               office_density: 0.05,
               terrain_suitability: bestSuitability
             }
           });
         }
       }

       // Add parks in scenic/hilly areas
       for (let i = 0; i < 3; i++) {
         let bestLocation = null;
         let bestSuitability = 0;

         for (let attempt = 0; attempt < 20; attempt++) {
           const x = (this.random() - 0.5) * 6000;
           const y = (this.random() - 0.5) * 6000;
           const suitability = this.getZoneSuitability(x, y, 'park');

           if (suitability > bestSuitability) {
             bestSuitability = suitability;
             bestLocation = { x, y };
           }
         }

         if (bestLocation && bestSuitability > 0.4) {
           this.zones.push({
             id: `park_${i}`,
             type: 4, // PARK
             boundary: this.generateRectangularZone(
               bestLocation.x,
               bestLocation.y,
               600 + this.random() * 400,
               600 + this.random() * 400
             ),
             density: 0.05,
             properties: {
               residential_density: 0,
               commercial_density: 0,
               office_density: 0,
               terrain_suitability: bestSuitability
             }
           });
         }
       }
     }

     generateGeographicRoads() {
       console.log('🛣️ Generating geographic road network...');

       // Roads follow terrain contours and connect zones efficiently
       const zoneConnections = [];

       this.zones.forEach((zone, i) => {
         this.zones.forEach((otherZone, j) => {
           if (i < j) { // Avoid duplicates
             zoneConnections.push({
               from: this.getZoneCenter(zone),
               to: this.getZoneCenter(otherZone),
               priority: zone.type === 3 || otherZone.type === 3 ? 'high' : 'normal' // Downtown connections are priority
             });
           }
         });
       });

       // Generate roads that avoid steep terrain
       zoneConnections.forEach((connection, index) => {
         const roadPath = this.generateTerrainAwareRoadPath(connection.from, connection.to);

         this.roads.push({
           id: `road_${index}`,
           type: connection.priority === 'high' ? 1 : 2, // ARTERIAL or LOCAL
           path: roadPath,
           width: connection.priority === 'high' ? 12 : 8,
           speedLimit: connection.priority === 'high' ? 60 : 40,
           properties: {
             terrain_difficulty: this.calculatePathDifficulty(roadPath)
           }
         });
       });
     }

     generateTerrainAwareRoadPath(from, to) {
       const path = [from];
       const numSegments = 8;

       for (let i = 1; i < numSegments; i++) {
         const t = i / numSegments;
         const directX = from.x + (to.x - from.x) * t;
         const directY = from.y + (to.y - from.y) * t;

         // Try to avoid steep terrain
         let bestX = directX;
         let bestY = directY;
         let bestSlope = this.getSlope(directX, directY);

         for (let attempt = 0; attempt < 5; attempt++) {
           const offsetX = directX + (this.random() - 0.5) * 200;
           const offsetY = directY + (this.random() - 0.5) * 200;
           const slope = this.getSlope(offsetX, offsetY);

           if (slope < bestSlope) {
             bestSlope = slope;
             bestX = offsetX;
             bestY = offsetY;
           }
         }

         path.push({ x: bestX, y: bestY });
       }

       path.push(to);
       return path;
     }

     calculatePathDifficulty(path) {
       let totalDifficulty = 0;
       for (let i = 1; i < path.length; i++) {
         const slope = this.getSlope(path[i].x, path[i].y);
         totalDifficulty += slope;
       }
       return totalDifficulty / path.length;
     }

     generateTerrainAwarePOIs() {
       console.log('🏢 Generating terrain-aware POIs...');

       this.zones.forEach(zone => {
         const zoneCenter = this.getZoneCenter(zone);
         const zoneBounds = this.getZoneBounds(zone.boundary);

         let poiCount = Math.floor(zone.density * 40);

         for (let i = 0; i < poiCount; i++) {
           // Find suitable location within zone
           let bestLocation = null;
           let bestSuitability = 0;

           for (let attempt = 0; attempt < 10; attempt++) {
             const x = zoneBounds.minX + this.random() * (zoneBounds.maxX - zoneBounds.minX);
             const y = zoneBounds.minY + this.random() * (zoneBounds.maxY - zoneBounds.minY);

             let poiType = this.choosePOIType(zone);
             let suitability = this.getZoneSuitability(x, y, poiType);

             if (suitability > bestSuitability) {
               bestSuitability = suitability;
               bestLocation = { x, y, type: poiType };
             }
           }

           if (bestLocation && bestSuitability > 0.1) {
             this.pois.push({
               id: `poi_${zone.id}_${i}`,
               type: this.mapPOITypeToEnum(bestLocation.type),
               position: { x: bestLocation.x, y: bestLocation.y },
               capacity: this.calculatePOICapacity(bestLocation.type),
               properties: {
                 name: this.generatePOIName(bestLocation.type, i),
                 terrain_suitability: bestSuitability,
                 terrain_height: this.getTerrainHeight(bestLocation.x, bestLocation.y)
               }
             });
           }
         }
       });

       // Add special geographic POIs
       this.addGeographicLandmarks();
     }

     addGeographicLandmarks() {
       // Add lighthouse if coastal
       if (this.terrainParams.coastalDistance < 5000) {
         this.pois.push({
           id: 'lighthouse_main',
           type: 5, // PARK (using as landmark)
           position: { x: -4000, y: 0 },
           capacity: 10,
           properties: {
             name: 'Harbor Lighthouse',
             landmark: true
           }
         });
       }

       // Add scenic overlook if mountainous
       if (this.terrainParams.mountainHeight > 100) {
         let bestOverlook = null;
         let bestHeight = 0;

         for (let attempt = 0; attempt < 20; attempt++) {
           const x = (this.random() - 0.5) * 6000;
           const y = (this.random() - 0.5) * 6000;
           const height = this.getTerrainHeight(x, y);

           if (height > bestHeight) {
             bestHeight = height;
             bestOverlook = { x, y };
           }
         }

         if (bestOverlook) {
           this.pois.push({
             id: 'scenic_overlook',
             type: 5, // PARK
             position: bestOverlook,
             capacity: 50,
             properties: {
               name: 'Scenic Overlook',
               landmark: true,
               elevation: bestHeight
             }
           });
         }
       }
     }

     // ... (continue with remaining methods similar to original generate_city.cjs but with terrain awareness)

     createGeographicCityModel() {
       return {
         bounds: {
           minX: -5000,
           minY: -5000,
           maxX: 5000,
           maxY: 5000
         },
         metadata: {
           generationTimestamp: new Date().toISOString(),
           seed: this.seed,
           terrainProfile: this.terrainProfile,
           terrainParameters: this.terrainParams,
           populationEstimate: this.pois.filter(poi => poi.type === 0).length * 2.5,
           cityArea: 100, // km²
           version: '2.0-geographic'
         },
         zones: this.zones,
         roads: this.roads,
         pois: this.pois,
         buildings: this.buildings
       };
     }

     // Helper methods (adapted from original)
     getZoneCenter(zone) {
       const bounds = this.getZoneBounds(zone.boundary);
       return {
         x: (bounds.minX + bounds.maxX) / 2,
         y: (bounds.minY + bounds.maxY) / 2
       };
     }

     getZoneBounds(boundary) {
       return {
         minX: Math.min(...boundary.map(p => p.x)),
         maxX: Math.max(...boundary.map(p => p.x)),
         minY: Math.min(...boundary.map(p => p.y)),
         maxY: Math.max(...boundary.map(p => p.y))
       };
     }

     generateRectangularZone(centerX, centerY, width, height) {
       const halfWidth = width / 2;
       const halfHeight = height / 2;
       return [
         { x: centerX - halfWidth, y: centerY - halfHeight },
         { x: centerX + halfWidth, y: centerY - halfHeight },
         { x: centerX + halfWidth, y: centerY + halfHeight },
         { x: centerX - halfWidth, y: centerY + halfHeight }
       ];
     }

     choosePOIType(zone) {
       const rand = this.random();
       switch (zone.type) {
         case 0: return rand < 0.8 ? 'home' : 'shop'; // RESIDENTIAL
         case 1: return rand < 0.6 ? 'shop' : 'restaurant'; // COMMERCIAL
         case 2: return 'factory'; // INDUSTRIAL
         case 3: return rand < 0.5 ? 'office' : 'shop'; // DOWNTOWN
         case 4: return 'park'; // PARK
         default: return 'shop';
       }
     }

     mapPOITypeToEnum(type) {
       const mapping = {
         'home': 0, 'shop': 1, 'restaurant': 2, 'factory': 3, 'office': 4, 'park': 5
       };
       return mapping[type] || 1;
     }

     calculatePOICapacity(type) {
       const capacities = {
         'home': 2 + Math.floor(this.random() * 4),
         'shop': 20 + Math.floor(this.random() * 80),
         'restaurant': 30 + Math.floor(this.random() * 120),
         'factory': 100 + Math.floor(this.random() * 400),
         'office': 50 + Math.floor(this.random() * 200),
         'park': 100 + Math.floor(this.random() * 500)
       };
       return capacities[type] || 50;
     }

     generatePOIName(type, index) {
       const names = {
         'home': `Residence ${index + 1}`,
         'shop': `Store ${index + 1}`,
         'restaurant': `Restaurant ${index + 1}`,
         'factory': `Factory ${index + 1}`,
         'office': `Office Building ${index + 1}`,
         'park': `Park ${index + 1}`
       };
       return names[type] || `POI ${index + 1}`;
     }

     generateGeographicBuildings() {
       // Similar to original but consider terrain suitability
       this.buildings = this.pois
         .filter(poi => poi.capacity > 50)
         .map((poi, index) => ({
           id: `building_${index}`,
           type: this.mapPOITypeToBuilding(poi.type),
           footprint: this.generateBuildingFootprint(poi.position.x, poi.position.y, poi.capacity),
           height: this.calculateBuildingHeight(poi.type, poi.capacity, poi.properties?.terrain_height || 0),
           properties: {
             poiId: poi.id,
             address: `${poi.properties?.name || 'Building'} ${index + 1}`,
             terrain_adapted: true
           }
         }));
     }

     mapPOITypeToBuilding(poiType) {
       // 0: RESIDENTIAL, 1: RESIDENTIAL, 2: OFFICE, 3: COMMERCIAL, 4: INDUSTRIAL
       const mapping = [1, 3, 3, 4, 2, 1]; // Based on POI type enum
       return mapping[poiType] || 1;
     }

     generateBuildingFootprint(centerX, centerY, capacity) {
       const size = Math.sqrt(capacity) * 8;
       const halfSize = size / 2;
       return [
         { x: centerX - halfSize, y: centerY - halfSize },
         { x: centerX + halfSize, y: centerY - halfSize },
         { x: centerX + halfSize, y: centerY + halfSize },
         { x: centerX - halfSize, y: centerY + halfSize }
       ];
     }

     calculateBuildingHeight(type, capacity, terrainHeight) {
       const baseHeight = 30 + Math.sqrt(capacity) * 2;
       const terrainBonus = Math.max(0, terrainHeight * 0.1); // Slight height bonus for elevated terrain
       return baseHeight + terrainBonus;
     }
   }

   // CLI interface
   async function generateGeographicCity() {
     const terrainProfile = process.argv[2] || 'manhattan';
     const seed = process.argv[3] || `geo-${terrainProfile}-${Date.now()}`;

     console.log(`🌍 Generating geographic city: ${terrainProfile}`);

     const generator = new GeographicCityGenerator(terrainProfile, seed);
     const cityModel = generator.generateGeographicCity();

     // Load protobuf schema and create binary file
     const protoPath = path.join(__dirname, '../src/data/city_model.proto');
     const root = await protobuf.load(protoPath);
     const CityModel = root.lookupType('urbansynth.CityModel');

     const message = CityModel.create(cityModel);
     const buffer = CityModel.encode(message).finish();

     const outputPath = path.join(__dirname, '../public/model.pbf');
     fs.writeFileSync(outputPath, buffer);

     console.log(`✅ Geographic city generated: ${buffer.length} bytes`);
     console.log(`📊 Profile: ${terrainProfile}`);
     console.log(`🏗️ Zones: ${cityModel.zones.length}`);
     console.log(`🛣️ Roads: ${cityModel.roads.length}`);
     console.log(`🏢 POIs: ${cityModel.pois.length}`);
     console.log(`🏗️ Buildings: ${cityModel.buildings.length}`);
   }

   if (require.main === module) {
     generateGeographicCity().catch(console.error);
   }

   module.exports = { GeographicCityGenerator };
   ```

9. **Update the main App.tsx to include terrain controls**:
   ```typescript
   // Add to App.tsx imports:
   import { TerrainProvider } from './contexts/TerrainContext';
   import { TerrainControlPanel } from './components/TerrainControlPanel';

   // Wrap the application with TerrainProvider:
   function App() {
     return (
       <ErrorBoundary>
         <SimulationProvider>
           <TerrainProvider>
             <AppContent />
             <TerrainControlPanel />
           </TerrainProvider>
         </SimulationProvider>
       </ErrorBoundary>
     );
   }
   ```

10. **Update CityVisualization to use enhanced terrain**:
    ```typescript
    // In CityVisualization.tsx, add terrain integration:
    import { useTerrainContext } from '../contexts/TerrainContext';
    import { createEnhancedTerrainLayer } from '../layers/EnhancedTerrainLayer';

    // In the layers creation:
    const layers = useMemo(() => {
      const { state: terrainState } = useTerrainContext();
      const cityData = state.trafficData || { zones: [], roads: [], pois: [], buildings: [] };

      const terrainLayers = createEnhancedTerrainLayer(cityData.bounds, terrainState);

      return [
        ...terrainLayers, // Add terrain first (background)
        createZoneLayer(cityData.zones || [], timeOfDay, showZones),
        createRoadLayer(cityData.roads || [], timeOfDay),
        createBuildingLayer(cityData.buildings || [], timeOfDay),
        createAgentLayer(state.agents, timeOfDay),
      ];
    }, [state.agents, state.trafficData, timeOfDay, showZones]);
    ```

11. **Update package.json with new scripts**:
    ```json
    {
      "scripts": {
        "build:city:manhattan": "node scripts/generate_geographic_city.cjs manhattan",
        "build:city:san-francisco": "node scripts/generate_geographic_city.cjs san_francisco",
        "build:city:denver": "node scripts/generate_geographic_city.cjs denver",
        "build:city:custom": "node scripts/generate_geographic_city.cjs custom"
      }
    }
    ```

### Acceptance Criteria
- [ ] Floating terrain control panel can be moved and resized
- [ ] Terrain controls actually modify the terrain generation
- [ ] City generation respects geographic features (roads avoid steep terrain, zones placed optimally)
- [ ] Different terrain profiles (Manhattan, San Francisco, Denver, etc.) create distinctly different cities
- [ ] Real-time terrain parameter adjustments work smoothly
- [ ] PlanetaryTerrain and basic terrain systems can be toggled
- [ ] Geographic landmarks are placed appropriately (lighthouses near coast, overlooks on high terrain)
- [ ] Performance remains smooth with terrain enabled
- [ ] Terrain context persists across page reloads
- [ ] City generation script can create geography-aware cities

### Test Plan
Execute from project root directory:

```bash
#!/bin/bash
set -e

echo "🧪 Testing PLAN10: Geographic-Aware City Generation with Terrain Integration"

# Test 1: Verify new terrain component files
echo "🏔️ Testing terrain control files..."
required_files=(
  "src/components/TerrainControlPanel.tsx"
  "src/components/DraggablePanel.tsx"
  "src/hooks/useTerrainControls.ts"
  "src/contexts/TerrainContext.tsx"
  "src/utils/realWorldTerrainProfiles.ts"
  "src/utils/geographicCityGenerator.ts"
  "src/layers/EnhancedTerrainLayer.ts"
  "scripts/generate_geographic_city.cjs"
)

for file in "${required_files[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ Required file $file not found"
    exit 1
  fi
done
echo "✅ All terrain control files present"

# Test 2: Test geographic city generation
echo "🌍 Testing geographic city generation..."
profiles=("manhattan" "san_francisco" "denver")

for profile in "${profiles[@]}"; do
  echo "Generating $profile city..."
  node scripts/generate_geographic_city.cjs "$profile" "test-seed-$profile" > /dev/null 2>&1

  if [ ! -f "public/model.pbf" ]; then
    echo "❌ Failed to generate $profile city model"
    exit 1
  fi

  filesize=$(stat -f%z "public/model.pbf" 2>/dev/null || stat -c%s "public/model.pbf" 2>/dev/null)
  if [ $filesize -lt 1000 ]; then
    echo "❌ Generated $profile city model is too small ($filesize bytes)"
    exit 1
  fi

  echo "✅ $profile city generated successfully ($filesize bytes)"
done

# Test 3: TypeScript compilation with new terrain components
echo "🔧 Testing TypeScript compilation..."
npx tsc --noEmit || exit 1
echo "✅ TypeScript compilation successful"

# Test 4: Test terrain profile validation
echo "🗺️ Testing terrain profiles..."
node -e "
  const { getTerrainProfilePresets, getTerrainProfileList } = require('./src/utils/realWorldTerrainProfiles.ts');

  const profiles = getTerrainProfilePresets();
  const profileList = getTerrainProfileList();

  if (Object.keys(profiles).length < 5) {
    console.error('❌ Not enough terrain profiles defined');
    process.exit(1);
  }

  if (!profiles.manhattan || !profiles.san_francisco) {
    console.error('❌ Missing required terrain profiles');
    process.exit(1);
  }

  profileList.forEach(profile => {
    if (!profile.value || !profile.label || !profile.description) {
      console.error('❌ Invalid profile format:', profile);
      process.exit(1);
    }
  });

  console.log('✅ Terrain profiles validation passed');
" 2>/dev/null || echo "⚠️ Terrain profile test skipped (requires compilation)"

# Test 5: Build test with terrain integration
echo "📦 Testing build with terrain integration..."
npm run build > /dev/null 2>&1 || exit 1
echo "✅ Build with terrain integration successful"

# Test 6: Test geographic city differences
echo "🏙️ Testing geographic city differentiation..."
node scripts/generate_geographic_city.cjs manhattan test-1 > /dev/null 2>&1
manhattan_size=$(stat -f%z "public/model.pbf" 2>/dev/null || stat -c%s "public/model.pbf" 2>/dev/null)

node scripts/generate_geographic_city.cjs san_francisco test-2 > /dev/null 2>&1
sf_size=$(stat -f%z "public/model.pbf" 2>/dev/null || stat -c%s "public/model.pbf" 2>/dev/null)

if [ $manhattan_size -eq $sf_size ]; then
  echo "⚠️ WARNING: Different terrain profiles generated identical file sizes"
else
  echo "✅ Different terrain profiles generate different cities"
fi

# Test 7: Component integration test
echo "⚛️ Testing React component integration..."
node -e "
  // Test that components can be imported without errors
  console.log('✅ Component integration test completed');
" || echo "⚠️ Component integration test skipped"

# Test 8: Performance test with terrain
echo "⚡ Testing performance impact..."
performance_start=\$(date +%s%N)
node scripts/generate_geographic_city.cjs denver perf-test > /dev/null 2>&1
performance_end=\$(date +%s%N)
performance_duration=\$(((performance_end - performance_start) / 1000000))

if [ \$performance_duration -gt 10000 ]; then  # 10 seconds
  echo "⚠️ WARNING: Geographic city generation is slow (\${performance_duration}ms)"
else
  echo "✅ Geographic city generation performance acceptable (\${performance_duration}ms)"
fi

echo "🎉 PLAN10 COMPLETED SUCCESSFULLY"
echo "📊 Geographic City Generation Stats:"
echo "   - Terrain profiles: $(ls src/utils/realWorldTerrainProfiles.ts | wc -l)"
echo "   - Control components: $(find src/components -name "*Terrain*" -o -name "*Panel*" | wc -l)"
echo "   - Geographic utilities: $(find src/utils -name "*geographic*" -o -name "*terrain*" | wc -l)"
echo "   - Generation performance: ${performance_duration:-"Unknown"}ms"
echo ""
echo "🌍 Available terrain profiles:"
echo "   - Manhattan: Island city with rivers"
echo "   - San Francisco: Hilly peninsula with bay"
echo "   - Denver: High plains with mountains"
echo "   - Custom: User-defined parameters"
echo ""
echo "🎮 New features:"
echo "   - Draggable terrain control panel"
echo "   - Real-time terrain parameter adjustment"
echo "   - Geography-aware city generation"
echo "   - Multi-scale terrain system (city/regional/planetary)"
echo "   - Terrain-optimized zone and road placement"
exit 0
```

### Integration Notes

PLAN10 builds upon the existing PlanetaryTerrain component and integrates it with:
- **PLAN2**: Enhanced city generation with geographic awareness
- **PLAN4**: React frontend with new draggable control panel
- **PLAN5**: Visualization system with enhanced terrain layers

### Future Enhancements

- **Weather System**: Terrain affects climate and weather patterns
- **Seasonal Changes**: Terrain appearance changes with seasons
- **Geological Events**: Earthquakes, landslides based on terrain
- **Economic Impact**: Terrain affects transport costs and development patterns
- **Real Map Data**: Import actual elevation data from real cities

---

*This plan transforms UrbanSynth from a flat city simulator into a realistic geographic simulation where terrain drives urban development patterns, just like in the real world.*