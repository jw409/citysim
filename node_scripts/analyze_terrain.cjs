const puppeteer = require('puppeteer');

(async () => {
  console.log('🏔️ Starting Puppeteer terrain analysis...');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--window-size=1920,1440']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1440 });

  try {
    console.log('📍 Navigating to localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });

    // Wait for city to load
    console.log('⏳ Waiting for city to load...');
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds for loading

    // Take initial screenshot
    await page.screenshot({ path: 'tests/temp-screenshots/terrain-analysis-initial.png' });
    console.log('📷 Initial screenshot saved');

    // Analyze the current state
    const initialAnalysis = await page.evaluate(() => {
      const analysis = {
        deckGLExists: !!window.deck,
        cityDataExists: !!window.cityData,
        buildingCount: 0,
        buildingsWithTerrain: 0,
        layers: [],
        terrainLayers: [],
        viewport: null
      };

      if (window.deck && window.deck.layerManager) {
        analysis.layers = window.deck.layerManager.layers.map(layer => ({
          id: layer.id,
          type: layer.constructor.name,
          visible: layer.props.visible !== false,
          dataCount: layer.props.data ? layer.props.data.length : 0
        }));

        analysis.terrainLayers = analysis.layers.filter(layer =>
          layer.id.toLowerCase().includes('terrain') ||
          layer.type.toLowerCase().includes('terrain')
        );
      }

      if (window.cityData && window.cityData.buildings) {
        analysis.buildingCount = window.cityData.buildings.length;
        analysis.buildingsWithTerrain = window.cityData.buildings.filter(
          b => b.terrain_height !== undefined && b.terrain_height !== null
        ).length;
      }

      // Check viewport state
      if (window.deck && window.deck.viewState) {
        analysis.viewport = {
          longitude: window.deck.viewState.longitude,
          latitude: window.deck.viewState.latitude,
          zoom: window.deck.viewState.zoom,
          pitch: window.deck.viewState.pitch,
          bearing: window.deck.viewState.bearing
        };
      }

      return analysis;
    });

    console.log('\n📊 INITIAL ANALYSIS:');
    console.log(`  🏗️ DeckGL: ${initialAnalysis.deckGLExists ? '✅ Active' : '❌ Missing'}`);
    console.log(`  🏢 City Data: ${initialAnalysis.cityDataExists ? '✅ Loaded' : '❌ Missing'}`);
    console.log(`  🏙️ Buildings: ${initialAnalysis.buildingCount} (${initialAnalysis.buildingsWithTerrain} with terrain)`);
    console.log(`  📋 Total Layers: ${initialAnalysis.layers.length}`);
    console.log(`  🏔️ Terrain Layers: ${initialAnalysis.terrainLayers.length}`);

    if (initialAnalysis.viewport) {
      console.log(`  📹 Viewport: zoom=${initialAnalysis.viewport.zoom.toFixed(1)}, pitch=${initialAnalysis.viewport.pitch}°`);
    }

    // Test camera manipulation by trying different methods
    console.log('\n🎥 Testing camera controls...');

    const cameraTests = [
      {
        name: 'Direct DeckGL viewState',
        code: () => {
          if (window.deck) {
            window.deck.setProps({
              viewState: {
                ...window.deck.viewState,
                pitch: 25,
                bearing: 30
              }
            });
            return true;
          }
          return false;
        }
      },
      {
        name: 'DeckGL controller',
        code: () => {
          if (window.deck && window.deck.controller) {
            window.deck.controller.setViewState({
              ...window.deck.viewState,
              pitch: 45
            });
            return true;
          }
          return false;
        }
      }
    ];

    let workingCameraMethod = null;

    for (const test of cameraTests) {
      console.log(`  🧪 Testing: ${test.name}`);

      try {
        const result = await page.evaluate(test.code);
        if (result) {
          console.log(`    ✅ ${test.name} works!`);
          workingCameraMethod = test;

          await new Promise(resolve => setTimeout(resolve, 1000));
          await page.screenshot({ path: `tests/temp-screenshots/terrain-analysis-${test.name.toLowerCase().replace(/\s+/g, '-')}.png` });

          break;
        } else {
          console.log(`    ❌ ${test.name} failed`);
        }
      } catch (error) {
        console.log(`    ❌ ${test.name} error: ${error.message}`);
      }
    }

    // If we found a working camera method, test terrain visibility
    if (workingCameraMethod) {
      console.log('\n🏔️ Testing terrain visibility with camera angles...');

      const angles = [
        { pitch: 0, bearing: 0, name: 'overhead' },
        { pitch: 25, bearing: 0, name: '25-degree-tilt' },
        { pitch: 45, bearing: 30, name: '45-degree-tilt-rotated' },
        { pitch: 60, bearing: 90, name: '60-degree-side-view' }
      ];

      for (const angle of angles) {
        console.log(`  📐 Testing angle: ${angle.name} (pitch: ${angle.pitch}°, bearing: ${angle.bearing}°)`);

        await page.evaluate((angle) => {
          if (window.deck) {
            window.deck.setProps({
              viewState: {
                ...window.deck.viewState,
                pitch: angle.pitch,
                bearing: angle.bearing
              }
            });
          }
        }, angle);

        await new Promise(resolve => setTimeout(resolve, 1500)); // Wait for animation
        await page.screenshot({ path: `tests/temp-screenshots/terrain-analysis-${angle.name}.png` });

        // Analyze what's visible at this angle
        const angleAnalysis = await page.evaluate(() => {
          if (!window.deck) return { error: 'No DeckGL' };

          const layers = window.deck.layerManager.layers;
          const visibleLayers = layers.filter(l => l.props.visible !== false);

          return {
            totalLayers: layers.length,
            visibleLayers: visibleLayers.length,
            layerTypes: [...new Set(visibleLayers.map(l => l.constructor.name))],
            terrainVisible: visibleLayers.some(l =>
              l.id.toLowerCase().includes('terrain') ||
              l.constructor.name.toLowerCase().includes('terrain')
            )
          };
        });

        console.log(`    📋 Layers visible: ${angleAnalysis.visibleLayers}/${angleAnalysis.totalLayers}`);
        console.log(`    🏔️ Terrain visible: ${angleAnalysis.terrainVisible ? '✅' : '❌'}`);
        console.log(`    🎭 Layer types: ${angleAnalysis.layerTypes?.join(', ') || 'none'}`);
      }
    }

    // Final comprehensive analysis
    const finalAnalysis = await page.evaluate(() => {
      const analysis = {
        timestamp: new Date().toISOString(),
        verdict: 'unknown',
        issues: []
      };

      // Check DeckGL
      if (!window.deck) {
        analysis.issues.push('DeckGL not initialized');
        analysis.verdict = 'broken';
        return analysis;
      }

      const layers = window.deck.layerManager.layers;
      const terrainLayers = layers.filter(l =>
        l.id.toLowerCase().includes('terrain') ||
        l.constructor.name.toLowerCase().includes('terrain')
      );

      // Check terrain
      if (terrainLayers.length === 0) {
        analysis.issues.push('No terrain layers found');
      } else {
        const visibleTerrainLayers = terrainLayers.filter(l => l.props.visible !== false);
        if (visibleTerrainLayers.length === 0) {
          analysis.issues.push('Terrain layers exist but are not visible');
        } else {
          const terrainWithData = visibleTerrainLayers.filter(l => l.props.data && l.props.data.length > 0);
          if (terrainWithData.length === 0) {
            analysis.issues.push('Terrain layers visible but have no data');
          }
        }
      }

      // Check buildings
      if (window.cityData && window.cityData.buildings) {
        const buildingCount = window.cityData.buildings.length;
        const buildingsWithTerrain = window.cityData.buildings.filter(
          b => b.terrain_height !== undefined && b.terrain_height !== null
        ).length;

        if (buildingCount < 10000) {
          analysis.issues.push(`Low building count: ${buildingCount} (should be 15,000+)`);
        }

        if (buildingsWithTerrain / buildingCount < 0.8) {
          analysis.issues.push(`Low terrain coverage: ${((buildingsWithTerrain / buildingCount) * 100).toFixed(1)}% buildings have terrain data`);
        }
      } else {
        analysis.issues.push('No building data found');
      }

      // Determine verdict
      if (analysis.issues.length === 0) {
        analysis.verdict = 'working';
      } else if (analysis.issues.length <= 2) {
        analysis.verdict = 'partially-working';
      } else {
        analysis.verdict = 'broken';
      }

      return analysis;
    });

    console.log('\n🔍 FINAL VERDICT:');
    console.log(`  🎯 Status: ${finalAnalysis.verdict.toUpperCase()}`);
    if (finalAnalysis.issues.length > 0) {
      console.log('  ⚠️ Issues found:');
      finalAnalysis.issues.forEach(issue => console.log(`    - ${issue}`));
    } else {
      console.log('  ✅ All systems working correctly!');
    }

    console.log('\n📁 Screenshots saved to tests/temp-screenshots/');
    console.log('📊 Analysis complete!');

  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    await page.screenshot({ path: 'tests/temp-screenshots/terrain-analysis-error.png' });
  } finally {
    await browser.close();
  }
})();