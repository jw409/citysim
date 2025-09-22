import { test, expect } from '@playwright/test';
import { createDebugHelpers } from '../../utils/debug-helpers';
import { createScreenshotHelpers } from '../../utils/screenshot-helpers';

test.describe('Comprehensive Debug Suite', () => {
  test('run complete diagnostic and functionality test', async ({ page }) => {
    // Create debug helpers
    const debug = createDebugHelpers(page);
    const screenshots = createScreenshotHelpers(page);

    // Navigate and wait for initial load
    await debug.goto();
    await debug.waitForLayerCount(17);

    // 1. Run comprehensive diagnosis
    const diagnosis = await debug.runDiagnosis();

    // Basic health checks
    expect(diagnosis.errors.length).toBeLessThan(5); // Allow some minor errors
    expect(diagnosis.dom.canvasCount).toBeGreaterThan(0);
    expect(diagnosis.dom.rootExists).toBe(true);

    // Save diagnosis report
    debug.saveDiagnosisReport(diagnosis);

    // 2. Test camera presets with multi-angle captures
    const presetScreenshots = await debug.testCameraPresets();
    expect(presetScreenshots.length).toBeGreaterThan(0);

    // For each preset, also capture multi-angle view
    for (const preset of ['overview', 'street', 'aerial'] as const) {
      await debug.clickCameraPreset(preset);
      await debug.waitForViewportStabilization();

      await screenshots.captureMultiAngle({
        prefix: `preset-${preset}`,
        timestamp: true,
        angles: {
          normal: true,
          panned: true,
          tilted: false,
          zoomedOut: true
        }
      });
    }

    // 3. Test simulation controls
    const simulationTest = await debug.testSimulationControls();
    expect(simulationTest.actions.length).toBeGreaterThan(0);

    // 4. Test UI panel interactions
    const panelScreenshots = await debug.testPanelInteractions();
    expect(panelScreenshots.length).toBeGreaterThan(0);

    // 5. Performance validation
    const performanceMetrics = await debug.getPerformanceMetrics();
    expect(performanceMetrics.fps).toBeGreaterThan(10); // Minimum acceptable FPS

    // 6. Final comprehensive capture
    await screenshots.captureComprehensive('final-state');

    console.log('\n✅ Comprehensive debug test completed successfully');
    console.log(`📊 Generated ${presetScreenshots.length + simulationTest.screenshots.length + panelScreenshots.length} screenshots`);
  });

  test('diagnose rendering issues', async ({ page }) => {
    const debug = createDebugHelpers(page);
    const screenshots = createScreenshotHelpers(page);

    await debug.goto();
    await debug.waitForLayerCount(17);

    // Clear any existing logs to focus on rendering
    debug.clearLogs();

    // Test different camera angles to detect 3D rendering issues
    await debug.clickCameraPreset('overview');
    await debug.waitForViewportStabilization();

    // Capture multi-angle for 3D analysis
    const multiAngleShots = await screenshots.captureMultiAngle({
      prefix: 'rendering-diagnosis',
      timestamp: true,
      angles: {
        normal: true,
        panned: true,
        tilted: true,
        zoomedOut: true
      }
    });

    expect(multiAngleShots.length).toBe(4);

    // Run diagnosis after camera movements
    const diagnosis = await debug.runDiagnosis();

    // Check for rendering-related errors
    const renderingErrors = diagnosis.errors.filter(error =>
      error.includes('WebGL') ||
      error.includes('deck.gl') ||
      error.includes('canvas') ||
      error.includes('layer')
    );

    if (renderingErrors.length > 0) {
      console.warn('🚨 Rendering errors detected:');
      renderingErrors.forEach(error => console.warn(`  - ${error}`));
    }

    // Save specific rendering diagnosis
    debug.saveDiagnosisReport(diagnosis, 'rendering-diagnosis.json');
  });

  test('performance monitoring', async ({ page }) => {
    const debug = createDebugHelpers(page);

    await debug.goto();
    await debug.waitForLayerCount(17);

    // Start simulation for performance testing
    await debug.startSimulation();
    await page.waitForTimeout(5000); // Let simulation run

    // Collect performance metrics over time
    const metrics = [];
    for (let i = 0; i < 10; i++) {
      const metric = await debug.getPerformanceMetrics();
      metrics.push(metric);
      await page.waitForTimeout(1000);
    }

    // Analyze performance trends
    const avgFps = metrics.reduce((sum, m) => sum + m.fps, 0) / metrics.length;
    const minFps = Math.min(...metrics.map(m => m.fps));
    const maxMemory = Math.max(...metrics.map(m => m.memory));

    console.log(`📊 Performance Analysis:`);
    console.log(`  Average FPS: ${avgFps.toFixed(1)}`);
    console.log(`  Minimum FPS: ${minFps}`);
    console.log(`  Peak Memory: ${maxMemory.toFixed(1)} KB`);

    // Performance assertions
    expect(avgFps).toBeGreaterThan(15); // Minimum acceptable average FPS
    expect(minFps).toBeGreaterThan(5);  // Shouldn't drop too low
    expect(maxMemory).toBeLessThan(50000); // Memory usage reasonable

    // Save performance report
    const performanceReport = {
      timestamp: new Date().toISOString(),
      metrics,
      analysis: { avgFps, minFps, maxMemory }
    };

    debug.saveDiagnosisReport(performanceReport as any, 'performance-analysis.json');
  });

  test('interaction stress test', async ({ page }) => {
    const debug = createDebugHelpers(page);
    const screenshots = createScreenshotHelpers(page);

    await debug.goto();
    await debug.waitForLayerCount(17);

    // Rapid interaction sequence
    const interactions = [
      () => debug.clickCameraPreset('overview'),
      () => debug.clickCameraPreset('street'),
      () => debug.clickCameraPreset('aerial'),
      () => debug.startSimulation(),
      () => debug.setSimulationSpeed(10),
      () => debug.pauseSimulation(),
      () => debug.expandPanel('terrain'),
      () => debug.expandPanel('performance'),
      () => debug.collapsePanel('terrain'),
      () => debug.clickCameraPreset('isometric')
    ];

    // Perform rapid interactions
    for (const interaction of interactions) {
      try {
        await interaction();
        await page.waitForTimeout(500); // Short delay between interactions
      } catch (e) {
        console.warn(`Interaction failed: ${e}`);
      }
    }

    // Check if app is still responsive
    await debug.waitForViewportStabilization();

    const finalDiagnosis = await debug.runDiagnosis();
    await screenshots.captureDebug('stress-test-final');

    // App should still be functional
    expect(finalDiagnosis.dom.canvasCount).toBeGreaterThan(0);
    expect(await debug.getActiveLayerCount()).toBeGreaterThan(0);

    debug.saveDiagnosisReport(finalDiagnosis, 'stress-test-diagnosis.json');
  });
});