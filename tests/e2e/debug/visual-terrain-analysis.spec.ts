import { test, expect } from '@playwright/test';
import { ViewportHelpers } from '../../fixtures/viewport-helpers';
import { testPerformanceTracker } from '../../utils/test-performance';

test.describe('Visual Terrain Analysis with Camera Angles', () => {
  let viewport: ViewportHelpers;

  test.beforeEach(async ({ page }) => {
    viewport = new ViewportHelpers(page);

    // Set viewport for consistent terrain visualization
    await page.setViewportSize({ width: 1920, height: 1440 });
    await viewport.goto();

    // Reduced wait time for faster tests
    await viewport.waitForViewportStabilization(1500);
  });

  test('comprehensive terrain verification with multiple camera angles', async ({ page }) => {
    testPerformanceTracker.startTest('terrain-camera-angles', 'medium');
    console.log('🏔️ Starting optimized terrain analysis...');

    // Test multiple locations with angled camera views to verify terrain
    const testLocations = [
      { name: 'northeast-hill', x: 2500, y: 2000, description: 'Northeast hill area (expected 180m peak)' },
      { name: 'southwest-hill', x: -3000, y: -1500, description: 'Southwest hill area (expected 200m peak)' },
      { name: 'southeast-hill', x: 1000, y: -3500, description: 'Southeast hill area (expected 160m peak)' },
      { name: 'downtown-flat', x: 0, y: 0, description: 'Downtown center (should be relatively flat)' },
      { name: 'transition-slope', x: 1250, y: 1000, description: 'Transition area between hill and flat' }
    ];

    const analysisResults = [];

    for (const location of testLocations) {
      console.log(`📍 Analyzing ${location.name}: ${location.description}`);

      // Move to location - use camera movements to navigate to different areas
      // Since we can't directly pan to coordinates, we'll use relative camera movements
      // to explore different areas of the city based on the location coordinates

      // Pan camera based on relative position from center
      const panFactorX = location.x / 100; // Scale down coordinates for reasonable pan amounts
      const panFactorY = location.y / 100;
      await viewport.panCamera(panFactorX, panFactorY);

      // Quick zoom - reduced time
      await viewport.zoomCamera(-200); // Moderate zoom, less extreme
      await viewport.waitForViewportStabilization(400); // Reduced wait time

      // Test multiple camera angles for this location
      const cameraAngles = [
        { name: 'overhead', tilt: 0, rotation: 0, description: 'Direct overhead view' },
        { name: 'angled-25', tilt: 25, rotation: 0, description: '25-degree tilt view' },
        { name: 'angled-45', tilt: 45, rotation: 0, description: '45-degree tilt view' },
        { name: 'angled-25-rotated', tilt: 25, rotation: 45, description: '25-degree tilt, 45-degree rotation' }
      ];

      const locationResults = {
        location: location.name,
        description: location.description,
        coordinates: { x: location.x, y: location.y },
        cameraTests: []
      };

      for (const angle of cameraAngles) {
        console.log(`  📷 Testing camera angle: ${angle.description}`);

        // Quick camera angle - reduced stabilization time
        await viewport.rotateCamera(angle.rotation, angle.tilt);
        await viewport.waitForViewportStabilization(250); // Faster camera movement

        // Capture screenshot
        const screenshotPath = `tests/temp-screenshots/terrain-analysis-${location.name}-${angle.name}.png`;
        await page.screenshot({ path: screenshotPath });

        // Analyze terrain visibility programmatically
        const terrainAnalysis = await page.evaluate(() => {
          // Get terrain layer info
          const terrainInfo = {
            terrainLayerExists: false,
            terrainPatchCount: 0,
            buildingsWithTerrain: 0,
            totalBuildings: 0,
            averageTerrainHeight: 0,
            maxTerrainHeight: 0,
            minTerrainHeight: 0,
            deckGLLayers: [],
            terrainLayerVisible: false
          };

          try {
            // Check if DeckGL instance exists
            if (window.deck && window.deck.layerManager) {
              const layers = window.deck.layerManager.layers;
              terrainInfo.deckGLLayers = layers.map(l => ({ id: l.id, type: l.constructor.name, visible: l.props.visible !== false }));

              // Find terrain layer
              const terrainLayer = layers.find(l => l.id.includes('terrain') || l.constructor.name.toLowerCase().includes('terrain'));
              if (terrainLayer) {
                terrainInfo.terrainLayerExists = true;
                terrainInfo.terrainLayerVisible = terrainLayer.props.visible !== false;
                terrainInfo.terrainPatchCount = terrainLayer.props.data ? terrainLayer.props.data.length : 0;
              }
            }

            // Check building terrain data
            if (window.cityData && window.cityData.buildings) {
              const buildings = window.cityData.buildings;
              terrainInfo.totalBuildings = buildings.length;

              const buildingsWithTerrainHeight = buildings.filter(b => b.terrain_height !== undefined && b.terrain_height !== null);
              terrainInfo.buildingsWithTerrain = buildingsWithTerrainHeight.length;

              if (buildingsWithTerrainHeight.length > 0) {
                const terrainHeights = buildingsWithTerrainHeight.map(b => b.terrain_height);
                terrainInfo.averageTerrainHeight = terrainHeights.reduce((a, b) => a + b, 0) / terrainHeights.length;
                terrainInfo.maxTerrainHeight = Math.max(...terrainHeights);
                terrainInfo.minTerrainHeight = Math.min(...terrainHeights);
              }
            }
          } catch (error) {
            console.error('Error analyzing terrain:', error);
          }

          return terrainInfo;
        });

        const cameraResult = {
          angle: angle.name,
          description: angle.description,
          tilt: angle.tilt,
          rotation: angle.rotation,
          screenshot: screenshotPath,
          terrainAnalysis: terrainAnalysis
        };

        locationResults.cameraTests.push(cameraResult);

        console.log(`    ✅ Terrain layer exists: ${terrainAnalysis.terrainLayerExists}`);
        console.log(`    📊 Terrain patches: ${terrainAnalysis.terrainPatchCount}`);
        console.log(`    🏢 Buildings with terrain: ${terrainAnalysis.buildingsWithTerrain}/${terrainAnalysis.totalBuildings}`);
        console.log(`    📈 Terrain height range: ${terrainAnalysis.minTerrainHeight?.toFixed(1)}m to ${terrainAnalysis.maxTerrainHeight?.toFixed(1)}m`);
      }

      analysisResults.push(locationResults);

      // Reset camera for next location by rotating back to center
      await viewport.rotateCamera(0, -45); // Reset any tilt
      await viewport.waitForViewportStabilization(500);
    }

    // Generate comprehensive analysis report
    console.log('\n🔍 TERRAIN ANALYSIS REPORT:');
    console.log('=' .repeat(50));

    let allTerrainWorking = true;
    let totalBuildings = 0;
    let totalBuildingsWithTerrain = 0;

    for (const result of analysisResults) {
      console.log(`\n📍 ${result.location.toUpperCase()}: ${result.description}`);

      for (const cameraTest of result.cameraTests) {
        const analysis = cameraTest.terrainAnalysis;
        console.log(`  📷 ${cameraTest.description}:`);
        console.log(`    - Terrain layer: ${analysis.terrainLayerExists ? '✅ EXISTS' : '❌ MISSING'}`);
        console.log(`    - Terrain patches: ${analysis.terrainPatchCount}`);
        console.log(`    - Buildings w/ terrain: ${analysis.buildingsWithTerrain}/${analysis.totalBuildings}`);

        if (analysis.maxTerrainHeight > 0) {
          console.log(`    - Height range: ${analysis.minTerrainHeight?.toFixed(1)}m to ${analysis.maxTerrainHeight?.toFixed(1)}m`);
        }

        totalBuildings = Math.max(totalBuildings, analysis.totalBuildings);
        totalBuildingsWithTerrain = Math.max(totalBuildingsWithTerrain, analysis.buildingsWithTerrain);

        if (!analysis.terrainLayerExists || analysis.terrainPatchCount === 0) {
          allTerrainWorking = false;
        }
      }
    }

    console.log('\n📊 OVERALL ASSESSMENT:');
    console.log(`  🏔️ Terrain system: ${allTerrainWorking ? '✅ WORKING' : '❌ BROKEN'}`);
    console.log(`  🏗️ Building count: ${totalBuildings} (${totalBuildingsWithTerrain} with terrain data)`);
    console.log(`  📈 Terrain coverage: ${totalBuildings > 0 ? ((totalBuildingsWithTerrain / totalBuildings) * 100).toFixed(1) : 0}%`);

    // Generate improvement suggestions
    console.log('\n💡 IMPROVEMENT SUGGESTIONS:');
    if (totalBuildings < 15000) {
      console.log(`  🏢 NEED MORE BUILDINGS: Currently ${totalBuildings}, should be 15,000+`);
    }
    if (!allTerrainWorking) {
      console.log(`  🏔️ TERRAIN BROKEN: Hills not visible from angled camera views`);
    }
    if (totalBuildingsWithTerrain < totalBuildings * 0.8) {
      console.log(`  📊 TERRAIN DATA MISSING: Only ${((totalBuildingsWithTerrain / totalBuildings) * 100).toFixed(1)}% buildings have terrain heights`);
    }

    // Assertions for test validation
    expect(allTerrainWorking, 'Terrain system should be working with visible hills').toBe(true);
    expect(totalBuildings, 'Should have more buildings for dense city').toBeGreaterThan(10000);
    expect(totalBuildingsWithTerrain / totalBuildings, 'Most buildings should have terrain data').toBeGreaterThan(0.8);

    testPerformanceTracker.endTest();

    // Save detailed analysis report
    const reportPath = 'tests/temp-screenshots/terrain-analysis-report.json';
    await page.evaluate((data) => {
      // This would save the report if we had file system access from browser
      console.log('Full analysis data:', JSON.stringify(data, null, 2));
    }, analysisResults);

    console.log(`\n📋 Analysis complete! Screenshots saved to tests/temp-screenshots/`);
    console.log(`📄 Detailed report available in browser console`);
  });

  test('building density analysis across city zones', async ({ page }) => {
    console.log('🏢 Analyzing building density across city zones...');

    const cityZones = [
      { name: 'downtown-core', x: 0, y: 0, radius: 1500, expectedDensity: 'very-high' },
      { name: 'financial-district', x: -300, y: 1200, radius: 1000, expectedDensity: 'high' },
      { name: 'residential-east', x: 2000, y: 1500, radius: 1200, expectedDensity: 'medium' },
      { name: 'suburbs-north', x: 500, y: 3000, radius: 1500, expectedDensity: 'low' },
      { name: 'industrial-port', x: -4000, y: -1500, radius: 1000, expectedDensity: 'medium' }
    ];

    const densityResults = [];

    for (const zone of cityZones) {
      console.log(`📍 Analyzing ${zone.name} (expected: ${zone.expectedDensity} density)`);

      // Navigate to zone location
      // Pan camera based on zone coordinates
      const panFactorX = zone.x / 100;
      const panFactorY = zone.y / 100;
      await viewport.panCamera(panFactorX, panFactorY);

      // Quick zoom for density analysis
      await viewport.zoomCamera(-300); // Reduced zoom intensity
      await viewport.waitForViewportStabilization(400); // Faster stabilization

      // Take angled screenshot for visual verification
      await viewport.rotateCamera(30, 25); // 30° rotation, 25° tilt
      await viewport.waitForViewportStabilization(300); // Faster camera positioning
      await page.screenshot({ path: `tests/temp-screenshots/density-analysis-${zone.name}.png` });

      const densityAnalysis = await page.evaluate(({ x, y, radius }) => {
        if (!window.cityData || !window.cityData.buildings) {
          return { error: 'No building data available' };
        }

        const buildings = window.cityData.buildings;
        const zoneBuildings = buildings.filter(building => {
          if (!building.footprint || !building.footprint[0]) return false;

          const bx = building.footprint[0].x;
          const by = building.footprint[0].y;
          const distance = Math.sqrt((bx - x) * (bx - x) + (by - y) * (by - y));
          return distance <= radius;
        });

        const zoneArea = Math.PI * radius * radius; // m²
        const buildingDensity = zoneBuildings.length / (zoneArea / 1000000); // buildings per km²

        const heightStats = {
          count: zoneBuildings.length,
          avgHeight: 0,
          maxHeight: 0,
          tallBuildings: 0 // >100m
        };

        if (zoneBuildings.length > 0) {
          const heights = zoneBuildings.map(b => b.height || 0);
          heightStats.avgHeight = heights.reduce((a, b) => a + b, 0) / heights.length;
          heightStats.maxHeight = Math.max(...heights);
          heightStats.tallBuildings = heights.filter(h => h > 100).length;
        }

        return {
          zone: { x, y, radius },
          buildingCount: zoneBuildings.length,
          density: buildingDensity,
          areaKm2: zoneArea / 1000000,
          heightStats
        };
      }, zone);

      densityResults.push({
        zone: zone.name,
        expected: zone.expectedDensity,
        analysis: densityAnalysis
      });

      console.log(`  🏢 Buildings: ${densityAnalysis.buildingCount}`);
      console.log(`  📊 Density: ${densityAnalysis.density?.toFixed(1)} buildings/km²`);
      console.log(`  🏗️ Avg height: ${densityAnalysis.heightStats?.avgHeight?.toFixed(1)}m`);
      console.log(`  🏙️ Tall buildings (>100m): ${densityAnalysis.heightStats?.tallBuildings}`);
    }

    console.log('\n📊 DENSITY ANALYSIS SUMMARY:');
    for (const result of densityResults) {
      const analysis = result.analysis;
      const densityLevel = analysis.density > 2000 ? 'very-high' :
                          analysis.density > 1000 ? 'high' :
                          analysis.density > 500 ? 'medium' : 'low';

      console.log(`  ${result.zone}: ${analysis.buildingCount} buildings, ${analysis.density?.toFixed(1)} bldg/km² (${densityLevel})`);

      if (densityLevel !== result.expected && result.expected !== 'medium') {
        console.log(`    ⚠️  Expected ${result.expected} density, got ${densityLevel}`);
      }
    }

    // Verify downtown has high density
    const downtown = densityResults.find(r => r.zone === 'downtown-core');
    expect(downtown?.analysis.density, 'Downtown should have high building density').toBeGreaterThan(1500);
  });
});