// Utility for loading pre-generated planetary terrain data

export interface TerrainPoint {
  x: number;
  y: number;
  elevation: number;
  terrainType: string;
  color: number[];
  radius: number;
}

export interface TerrainScale {
  scale: number;
  name: string;
  points: TerrainPoint[];
  extent: number;
}

export interface PlanetaryTerrainData {
  seed: string;
  scales: TerrainScale[];
  generatedAt: string;
}

let cachedTerrainData: PlanetaryTerrainData | null = null;
let loadingPromise: Promise<PlanetaryTerrainData | null> | null = null;

export async function loadPlanetaryTerrain(): Promise<PlanetaryTerrainData | null> {
  // Return cached data if available
  if (cachedTerrainData) {
    return cachedTerrainData;
  }

  // Return existing promise if already loading
  if (loadingPromise) {
    return loadingPromise;
  }

  // Start loading
  loadingPromise = (async () => {
    try {
      console.log('Loading planetary terrain data from /model-terrain.json...');
      const response = await fetch('/model-terrain.json');

      console.log('Terrain fetch response:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        console.warn('Failed to load planetary terrain:', response.status, response.statusText);
        return null;
      }

      const data: PlanetaryTerrainData = await response.json();
      console.log(`✅ Successfully loaded planetary terrain with ${data.scales.length} scales:`,
        data.scales.map(s => `${s.name}(${s.points.length} points)`));

      cachedTerrainData = data;
      return data;
    } catch (error) {
      console.error('❌ Error loading planetary terrain:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
      return null;
    } finally {
      loadingPromise = null;
    }
  })();

  return loadingPromise;
}

export function getCachedPlanetaryTerrain(): PlanetaryTerrainData | null {
  return cachedTerrainData;
}
