import { test, expect } from '@playwright/test';
import { createScreenshotHelpers } from '../../utils/screenshot-helpers';
import { createDebugHelpers } from '../../utils/debug-helpers';

test.describe('Terrain Visualization Debug Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport for consistent terrain visualization
    await page.setViewportSize({ width: 1920, height: 1440 });
    await page.goto('/');

    // Wait for city to load completely
    await page.waitForSelector('[data-testid="city-loaded"]', { timeout: 30000 });
    await page.waitForTimeout(2000); // Allow rendering to stabilize
  });

  test('should verify terrain layer is enabled and visible', async ({ page }) => {
    const debug = createDebugHelpers(page);
    const screenshots = createScreenshotHelpers(page);

    // Run comprehensive diagnosis
    const diagnosis = await debug.runDiagnosis();
    console.log('Terrain Debug Diagnosis:', diagnosis);

    // Check if terrain layer is enabled in code
    const terrainEnabled = await page.evaluate(() => {
      // Check if terrain layer creation function exists
      return typeof window.createTerrainLayer === 'function';
    });

    console.log('Terrain layer function available:', terrainEnabled);

    // Capture screenshots for terrain visibility analysis
    await screenshots.captureDebug('terrain-visibility-test');

    // Test different camera angles to see terrain
    await screenshots.captureComprehensive('terrain-angles-test');

    // Check console for terrain-related logs
    const consoleLogs = await debug.getConsoleMessages();
    const terrainLogs = consoleLogs.filter(log =>
      log.toLowerCase().includes('terrain') ||
      log.toLowerCase().includes('elevation') ||
      log.toLowerCase().includes('height')
    );

    console.log('Terrain-related console messages:', terrainLogs);

    // Verify terrain data exists in city model
    const terrainData = await page.evaluate(() => {
      return {
        buildingsWithTerrain: window.cityData?.buildings?.some(b => b.terrain_height !== undefined),
        totalBuildings: window.cityData?.buildings?.length,
        sampleTerrainHeights: window.cityData?.buildings?.slice(0, 5).map(b => ({
          id: b.id,
          terrain_height: b.terrain_height,
          building_height: b.height
        }))
      };
    });

    console.log('Terrain data analysis:', terrainData);

    // Expect terrain data to exist
    expect(terrainData.buildingsWithTerrain).toBe(true);
    expect(terrainData.totalBuildings).toBeGreaterThan(1000);
  });

  test('should test terrain height variations', async ({ page }) => {
    const screenshots = createScreenshotHelpers(page);

    // Navigate to different areas to see terrain variation
    const testLocations = [
      { name: 'downtown', x: 0, y: 0, zoom: 500 },
      { name: 'hills-north', x: -2000, y: 2000, zoom: 1000 },
      { name: 'river-valley', x: 1000, y: -1000, zoom: 800 },
      { name: 'airport-area', x: -3000, y: 4000, zoom: 1200 }
    ];

    for (const location of testLocations) {
      // Pan to location
      await page.evaluate(({ x, y, zoom }) => {
        if (window.viewport) {
          window.viewport.panTo([x, y]);
          window.viewport.setZoom(zoom);
        }
      }, location);

      await page.waitForTimeout(1000); // Allow movement to complete

      // Capture screenshot of terrain at this location
      await screenshots.captureDebug(`terrain-${location.name}`);

      // Check terrain heights in this area
      const heightData = await page.evaluate(({ x, y }) => {
        if (!window.cityData?.buildings) return { error: 'No building data' };

        const nearbyBuildings = window.cityData.buildings.filter(building => {
          const dist = Math.sqrt(
            Math.pow(building.footprint[0].x - x, 2) +
            Math.pow(building.footprint[0].y - y, 2)
          );
          return dist < 1000; // Within 1km
        });

        const heights = nearbyBuildings.map(b => b.terrain_height || 0);

        return {
          area: `${x},${y}`,
          buildingCount: nearbyBuildings.length,
          minHeight: Math.min(...heights),
          maxHeight: Math.max(...heights),
          avgHeight: heights.reduce((a, b) => a + b, 0) / heights.length,
          heightRange: Math.max(...heights) - Math.min(...heights)
        };
      }, location);

      console.log(`Terrain heights at ${location.name}:`, heightData);

      // Expect height variation
      expect(heightData.heightRange).toBeGreaterThan(10); // At least 10m variation
    }
  });

  test('should debug terrain layer rendering', async ({ page }) => {
    const debug = createDebugHelpers(page);

    // Check WebGL context and layers
    const renderingInfo = await page.evaluate(() => {
      if (!window.deck || !window.deck.layerManager) {
        return { error: 'No DeckGL instance found' };
      }

      const layers = window.deck.layerManager.layers;
      const terrainLayers = layers.filter(layer =>
        layer.id.toLowerCase().includes('terrain') ||
        layer.constructor.name.toLowerCase().includes('terrain')
      );

      return {
        totalLayers: layers.length,
        terrainLayerCount: terrainLayers.length,
        terrainLayerIds: terrainLayers.map(l => l.id),
        terrainLayerTypes: terrainLayers.map(l => l.constructor.name),
        layerErrors: layers.filter(l => l.getError()).map(l => ({
          id: l.id,
          error: l.getError()
        }))
      };
    });

    console.log('DeckGL terrain layer analysis:', renderingInfo);

    // Take screenshot for manual inspection
    await page.screenshot({
      path: 'tests/temp-screenshots/terrain-debug-manual-inspection.png',
      fullPage: true
    });

    // Expect terrain layers to exist
    expect(renderingInfo.terrainLayerCount).toBeGreaterThan(0);
    expect(renderingInfo.layerErrors).toHaveLength(0);
  });

  test('should compare buildings with and without terrain heights', async ({ page }) => {
    const screenshots = createScreenshotHelpers(page);

    // Capture current state with terrain
    await screenshots.captureDebug('buildings-with-terrain');

    // Temporarily disable terrain heights to show difference
    const comparisonData = await page.evaluate(() => {
      if (!window.cityData?.buildings) return null;

      // Sample of buildings with terrain data
      const sample = window.cityData.buildings.slice(0, 100).map(building => ({
        id: building.id,
        x: building.footprint[0]?.x || 0,
        y: building.footprint[0]?.y || 0,
        height: building.height || 0,
        terrain_height: building.terrain_height || 0,
        total_elevation: (building.height || 0) + (building.terrain_height || 0)
      }));

      return {
        sampleSize: sample.length,
        avgTerrainHeight: sample.reduce((sum, b) => sum + b.terrain_height, 0) / sample.length,
        maxTerrainHeight: Math.max(...sample.map(b => b.terrain_height)),
        minTerrainHeight: Math.min(...sample.map(b => b.terrain_height)),
        buildingsOnHills: sample.filter(b => b.terrain_height > 50).length,
        buildingsInValleys: sample.filter(b => b.terrain_height < -20).length
      };
    });

    console.log('Terrain height distribution:', comparisonData);

    // Verify terrain variation exists
    expect(comparisonData.maxTerrainHeight - comparisonData.minTerrainHeight).toBeGreaterThan(100);
  });
});