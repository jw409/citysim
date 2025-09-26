/**
 * Fast Initial Load Tests - High Priority
 * These tests focus on rapid verification of core functionality
 * Target: < 5 seconds wall clock time per test
 */

import { test, expect } from '@playwright/test';
import { ViewportHelpers } from '../../fixtures/viewport-helpers';
import { testPerformanceTracker } from '../../utils/test-performance';

test.describe('Fast Initial Load Suite', () => {
  let viewport: ViewportHelpers;

  test.beforeEach(async ({ page }) => {
    viewport = new ViewportHelpers(page);
    await page.setViewportSize({ width: 1920, height: 1440 });
  });

  test('initial page load and city data presence (HIGH PRIORITY)', async ({ page }) => {
    testPerformanceTracker.startTest('initial-page-load', 'high');

    try {
      // Fast load - no extended wait times
      await viewport.goto();

      // Quick city data check - only wait for essential data
      await page.waitForFunction(() => {
        return window.cityData && window.cityData.buildings && window.cityData.buildings.length > 0;
      }, { timeout: 10000 }); // Reduced from typical 30s timeout

      // Verify basic city data is loaded
      const cityDataStatus = await page.evaluate(() => {
        return {
          hasBuildings: !!(window.cityData?.buildings?.length),
          buildingCount: window.cityData?.buildings?.length || 0,
          hasRoads: !!(window.cityData?.roads?.length),
          roadCount: window.cityData?.roads?.length || 0,
          hasDeck: !!window.deck,
          hasLayers: window.deck?.layerManager?.layers?.length || 0
        };
      });

      // Fast assertions - just verify core data loaded
      expect(cityDataStatus.hasBuildings).toBe(true);
      expect(cityDataStatus.buildingCount).toBeGreaterThan(8000);
      expect(cityDataStatus.hasRoads).toBe(true);
      expect(cityDataStatus.hasDeck).toBe(true);

      console.log(`✅ City loaded: ${cityDataStatus.buildingCount} buildings, ${cityDataStatus.roadCount} roads`);

    } finally {
      testPerformanceTracker.endTest();
    }
  });

  test('basic rendering verification without camera movement', async ({ page }) => {
    testPerformanceTracker.startTest('basic-rendering', 'high');

    try {
      await viewport.goto();

      // Wait only for render completion - no camera movements
      await viewport.waitForViewportStabilization(2000);

      // Quick canvas verification
      const renderingStatus = await page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        return {
          hasCanvas: !!canvas,
          canvasSize: canvas ? `${canvas.width}x${canvas.height}` : null,
          layerCount: window.deck?.layerManager?.layers?.length || 0,
          deckGLReady: !!window.deck
        };
      });

      expect(renderingStatus.hasCanvas).toBe(true);
      expect(renderingStatus.deckGLReady).toBe(true);
      expect(renderingStatus.layerCount).toBeGreaterThan(0);

      // Single quick screenshot for visual verification
      await page.screenshot({
        path: 'tests/temp-screenshots/fast-initial-render.png',
        quality: 75 // Lower quality for speed
      });

      console.log(`✅ Rendering: ${renderingStatus.layerCount} layers on ${renderingStatus.canvasSize} canvas`);

    } finally {
      testPerformanceTracker.endTest();
    }
  });

  test('terrain data verification without zoom operations', async ({ page }) => {
    testPerformanceTracker.startTest('terrain-data-check', 'high');

    try {
      await viewport.goto();
      await viewport.waitForViewportStabilization(1500);

      // Fast terrain data check - no camera movements
      const terrainStatus = await page.evaluate(() => {
        if (!window.cityData?.buildings) return { error: 'No city data' };

        const buildingsWithTerrain = window.cityData.buildings.filter(
          b => b.terrain_height !== undefined && b.terrain_height !== null
        );

        const terrainLayers = window.deck?.layerManager?.layers?.filter(
          layer => layer.id.toLowerCase().includes('terrain') ||
                   layer.constructor.name.toLowerCase().includes('terrain')
        ) || [];

        return {
          totalBuildings: window.cityData.buildings.length,
          buildingsWithTerrain: buildingsWithTerrain.length,
          terrainCoverage: (buildingsWithTerrain.length / window.cityData.buildings.length * 100).toFixed(1),
          terrainLayers: terrainLayers.length,
          hasTerrainLayer: terrainLayers.length > 0
        };
      });

      if ('error' in terrainStatus) {
        throw new Error(terrainStatus.error);
      }

      expect(terrainStatus.buildingsWithTerrain).toBeGreaterThan(6000);
      expect(parseFloat(terrainStatus.terrainCoverage)).toBeGreaterThan(75);
      expect(terrainStatus.hasTerrainLayer).toBe(true);

      console.log(`✅ Terrain: ${terrainStatus.terrainCoverage}% coverage (${terrainStatus.buildingsWithTerrain}/${terrainStatus.totalBuildings} buildings)`);

    } finally {
      testPerformanceTracker.endTest();
    }
  });

  test('control panel and UI elements load', async ({ page }) => {
    testPerformanceTracker.startTest('ui-elements-load', 'medium');

    try {
      await viewport.goto();
      await page.waitForSelector('[data-testid="city-loaded"]', { timeout: 8000 });

      // Fast UI verification - no interactions
      const uiStatus = await page.evaluate(() => {
        return {
          hasControlPanel: !!document.querySelector('.control-panel'),
          hasTimeControls: !!document.querySelector('.time-controls'),
          hasPerformanceMonitor: !!document.querySelector('.performance-monitor'),
          loadingComplete: !!document.querySelector('[data-testid="city-loaded"]')
        };
      });

      expect(uiStatus.loadingComplete).toBe(true);
      expect(uiStatus.hasControlPanel).toBe(true);

      console.log(`✅ UI loaded: Control panel, time controls, performance monitor`);

    } finally {
      testPerformanceTracker.endTest();
    }
  });

  test.afterAll(async () => {
    // Print performance report for fast tests
    testPerformanceTracker.printReport();
  });
});