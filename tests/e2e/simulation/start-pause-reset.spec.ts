import { test, expect } from '@playwright/test';
import { SimulationHelpers } from '../../fixtures/simulation-helpers';
import { PerformanceMetricsCollector } from '../../utils/performance-metrics';

test.describe('Simulation Controls', () => {
  let simulation: SimulationHelpers;
  let performanceCollector: PerformanceMetricsCollector;

  test.beforeEach(async ({ page }) => {
    simulation = new SimulationHelpers(page);
    performanceCollector = new PerformanceMetricsCollector(page);

    await simulation.goto();
    await simulation.waitForLayerCount(17);
  });

  test.describe('Basic Simulation Controls', () => {
    test('should start simulation from paused state', async () => {
      // Verify initial paused state
      await expect(simulation.simulationStatus).toContainText('Paused');
      await expect(simulation.startSimulationButton).toBeVisible();

      // Start simulation
      await simulation.startAndVerifySimulation();

      // Verify simulation is running
      await expect(simulation.simulationStatus).toContainText('Running');
    });

    test('should pause running simulation', async () => {
      await simulation.startSimulation();
      await expect(simulation.simulationStatus).toContainText('Running');

      // Pause simulation
      await simulation.pauseAndVerifySimulation();

      // Verify simulation is paused
      await expect(simulation.simulationStatus).toContainText('Paused');
    });

    test('should maintain time progression during simulation', async () => {
      await simulation.startSimulation();

      const initialTime = await simulation.getCurrentSimulationTime();
      await simulation.page.waitForTimeout(3000);
      const laterTime = await simulation.getCurrentSimulationTime();

      expect(laterTime).toBeGreaterThan(initialTime);
    });

    test('should stop time progression when paused', async () => {
      await simulation.startSimulation();
      await simulation.page.waitForTimeout(1000);
      await simulation.pauseSimulation();

      const pausedTime = await simulation.getCurrentSimulationTime();
      await simulation.page.waitForTimeout(2000);
      const stillPausedTime = await simulation.getCurrentSimulationTime();

      expect(stillPausedTime).toBe(pausedTime);
    });
  });

  test.describe('Speed Controls', () => {
    test('should adjust simulation speed correctly', async () => {
      await simulation.testSpeedControls();
    });

    test('should handle maximum speed without performance degradation', async () => {
      await performanceCollector.startCollection(1000);

      await simulation.startSimulation();
      await simulation.setSimulationSpeed(10); // Maximum speed
      await simulation.page.waitForTimeout(5000);

      performanceCollector.stopCollection();
      const avgMetrics = performanceCollector.getAverageMetrics();

      // Should maintain reasonable performance at max speed
      expect(avgMetrics.fps).toBeGreaterThan(20);

      await simulation.pauseSimulation();
    });

    test('should allow speed changes during simulation', async () => {
      await simulation.startSimulation();

      const speeds = [1, 5, 10, 2];
      for (const speed of speeds) {
        await simulation.setSimulationSpeed(speed);
        await simulation.page.waitForTimeout(1000);

        // Verify simulation continues running at new speed
        await expect(simulation.simulationStatus).toContainText('Running');
      }

      await simulation.pauseSimulation();
    });
  });

  test.describe('Agent Management', () => {
    test('should spawn and manage agents during simulation', async () => {
      await simulation.testAgentBehavior();
    });

    test('should maintain agent count consistency', async () => {
      await simulation.startSimulation();

      const agentCounts: number[] = [];

      // Monitor agent count over time
      for (let i = 0; i < 10; i++) {
        const count = await simulation.getCurrentAgentCount();
        agentCounts.push(count);
        await simulation.page.waitForTimeout(1000);
      }

      // Agent count should be stable or increasing (depending on simulation rules)
      const initialCount = agentCounts[0];
      const finalCount = agentCounts[agentCounts.length - 1];

      expect(finalCount).toBeGreaterThanOrEqual(initialCount * 0.8); // Allow some variation

      await simulation.pauseSimulation();
    });

    test('should handle high agent counts without performance issues', async () => {
      await simulation.startSimulation();

      // Let simulation run to potentially spawn many agents
      await simulation.setSimulationSpeed(10);
      await simulation.page.waitForTimeout(10000);

      const agentCount = await simulation.getCurrentAgentCount();

      if (agentCount > 100) {
        // If we have many agents, verify performance is still acceptable
        await simulation.waitForStableFramerate(15, 3000);
      }

      await simulation.pauseSimulation();
    });
  });

  test.describe('Simulation Persistence', () => {
    test('should maintain simulation state across pause/resume cycles', async () => {
      await simulation.testPauseResumeCycling();
    });

    test('should handle rapid start/stop operations', async () => {
      await simulation.testSimulationEdgeCases();
    });

    test('should preserve time progression accuracy', async () => {
      await simulation.startSimulation();

      const startTime = await simulation.getCurrentSimulationTime();
      const realStartTime = Date.now();

      await simulation.page.waitForTimeout(5000); // Wait 5 real seconds

      const endTime = await simulation.getCurrentSimulationTime();
      const realEndTime = Date.now();

      const simulationElapsed = endTime - startTime;
      const realElapsed = (realEndTime - realStartTime) / 1000; // Convert to seconds

      // At 1x speed, simulation time should roughly match real time
      // Allow for some variance due to processing overhead
      expect(simulationElapsed).toBeGreaterThan(realElapsed * 0.5);
      expect(simulationElapsed).toBeLessThan(realElapsed * 2);

      await simulation.pauseSimulation();
    });
  });

  test.describe('Performance Under Load', () => {
    test('should maintain stability during extended simulation', async () => {
      await simulation.testSimulationStability();
    });

    test('should handle memory efficiently during long runs', async () => {
      await simulation.startSimulation();

      const hasMemoryLeak = await performanceCollector.detectMemoryLeaks(30000);
      expect(hasMemoryLeak).toBe(false);

      await simulation.pauseSimulation();
    });

    test('should recover from performance bottlenecks', async () => {
      await simulation.startSimulation();
      await simulation.setSimulationSpeed(10);

      // Let it run at high speed to potentially stress the system
      await simulation.page.waitForTimeout(10000);

      // Reduce speed and verify recovery
      await simulation.setSimulationSpeed(1);
      await simulation.page.waitForTimeout(3000);

      // Should maintain good performance at normal speed
      await simulation.waitForStableFramerate(30, 3000);

      await simulation.pauseSimulation();
    });
  });

  test.describe('Time Controls Integration', () => {
    test('should integrate with time control panel', async () => {
      await simulation.testTimeControlsPanel();
    });

    test('should handle time of day changes during simulation', async () => {
      await simulation.expandPanel('time');
      await simulation.startSimulation();

      const timeSlider = simulation.page.locator('input[type="range"]:near(:has-text("Time"))');

      if (await timeSlider.isVisible()) {
        // Change time of day during simulation
        await timeSlider.fill('6'); // 6 AM
        await simulation.page.waitForTimeout(1000);

        await timeSlider.fill('18'); // 6 PM
        await simulation.page.waitForTimeout(1000);

        // Simulation should continue running despite time changes
        await expect(simulation.simulationStatus).toContainText('Running');
      }

      await simulation.pauseSimulation();
      await simulation.collapsePanel('time');
    });
  });

  test.describe('Error Conditions and Recovery', () => {
    test('should recover from simulation errors gracefully', async () => {
      await simulation.startSimulation();

      // Simulate potential error conditions
      // This could include network interruptions, memory pressure, etc.

      // For now, test rapid state changes that might cause issues
      for (let i = 0; i < 5; i++) {
        await simulation.startSimulation();
        await simulation.page.waitForTimeout(100);
        await simulation.pauseSimulation();
        await simulation.page.waitForTimeout(100);
      }

      // System should recover and be functional
      await simulation.startSimulation();
      await simulation.page.waitForTimeout(2000);

      const currentTime = await simulation.getCurrentSimulationTime();
      expect(currentTime).toBeGreaterThan(0);

      await simulation.pauseSimulation();
    });

    test('should handle browser tab visibility changes', async ({ page }) => {
      await simulation.startSimulation();

      // Simulate tab going to background
      await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', { value: true, writable: true });
        document.dispatchEvent(new Event('visibilitychange'));
      });

      await simulation.page.waitForTimeout(2000);

      // Simulate tab coming back to foreground
      await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', { value: false, writable: true });
        document.dispatchEvent(new Event('visibilitychange'));
      });

      // Simulation should continue or resume properly
      await expect(simulation.layersActiveIndicator).toBeVisible();
      const agentCount = await simulation.getCurrentAgentCount();
      expect(agentCount).toBeGreaterThanOrEqual(0);

      await simulation.pauseSimulation();
    });

    test('should maintain consistent state after window resize', async ({ page }) => {
      await simulation.startSimulation();
      const initialTime = await simulation.getCurrentSimulationTime();

      // Resize window
      await page.setViewportSize({ width: 800, height: 600 });
      await simulation.page.waitForTimeout(1000);

      // Simulation should continue
      const timeAfterResize = await simulation.getCurrentSimulationTime();
      expect(timeAfterResize).toBeGreaterThanOrEqual(initialTime);

      // Resize back
      await page.setViewportSize({ width: 1920, height: 1080 });
      await simulation.page.waitForTimeout(1000);

      // Should still be functional
      await expect(simulation.simulationStatus).toContainText('Running');

      await simulation.pauseSimulation();
    });
  });
});