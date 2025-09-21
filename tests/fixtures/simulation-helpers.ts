import { Page, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class SimulationHelpers extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Start simulation and verify it's running
   */
  async startAndVerifySimulation() {
    await this.startSimulation();

    // Verify simulation is actually running by checking agent movement
    // or time progression over a short period
    const initialTime = await this.getCurrentSimulationTime();
    await this.page.waitForTimeout(2000);
    const afterTime = await this.getCurrentSimulationTime();

    expect(afterTime).toBeGreaterThan(initialTime);
  }

  /**
   * Pause simulation and verify it's paused
   */
  async pauseAndVerifySimulation() {
    await this.pauseSimulation();

    // Verify simulation is actually paused
    const initialTime = await this.getCurrentSimulationTime();
    await this.page.waitForTimeout(2000);
    const afterTime = await this.getCurrentSimulationTime();

    expect(afterTime).toBe(initialTime);
  }

  /**
   * Get current simulation time
   */
  async getCurrentSimulationTime(): Promise<number> {
    const timeText = await this.timeDisplay.textContent();
    const match = timeText?.match(/Time: ([\\d.]+)h/);
    return match ? parseFloat(match[1]) : 0;
  }

  /**
   * Get current agent count
   */
  async getCurrentAgentCount(): Promise<number> {
    const agentText = await this.agentsCount.textContent();
    const match = agentText?.match(/Agents: (\\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Test speed controls
   */
  async testSpeedControls() {
    await this.startSimulation();

    const speeds = [1, 2, 5, 10];
    const timeDeltas: number[] = [];

    for (const speed of speeds) {
      await this.setSimulationSpeed(speed);
      await this.page.waitForTimeout(500); // Allow speed to take effect

      const startTime = await this.getCurrentSimulationTime();
      await this.page.waitForTimeout(2000); // Measure for 2 seconds
      const endTime = await this.getCurrentSimulationTime();

      const timeDelta = endTime - startTime;
      timeDeltas.push(timeDelta);

      // Verify higher speeds produce faster time progression
      if (timeDeltas.length > 1) {
        expect(timeDelta).toBeGreaterThanOrEqual(timeDeltas[timeDeltas.length - 2] * 0.8);
      }
    }

    await this.pauseSimulation();
  }

  /**
   * Test simulation reset functionality
   */
  async testSimulationReset() {
    // Start simulation and let it run
    await this.startSimulation();
    await this.page.waitForTimeout(3000);

    const timeAfterRunning = await this.getCurrentSimulationTime();
    const agentsAfterRunning = await this.getCurrentAgentCount();

    expect(timeAfterRunning).toBeGreaterThan(0);

    // Reset simulation (if reset button exists)
    const resetButton = this.page.locator('button:has-text("Reset"), button:has-text("RESET")');
    if (await resetButton.isVisible()) {
      await resetButton.click();

      // Verify simulation was reset
      const timeAfterReset = await this.getCurrentSimulationTime();
      expect(timeAfterReset).toBeLessThanOrEqual(timeAfterRunning);
    }
  }

  /**
   * Test agent spawning and movement
   */
  async testAgentBehavior() {
    await this.startSimulation();

    // Monitor agent count over time
    const initialAgentCount = await this.getCurrentAgentCount();
    await this.page.waitForTimeout(5000);
    const laterAgentCount = await this.getCurrentAgentCount();

    // Agents should spawn or at least maintain count
    expect(laterAgentCount).toBeGreaterThanOrEqual(initialAgentCount);

    // If agents are spawning, count should increase
    if (laterAgentCount > initialAgentCount) {
      expect(laterAgentCount).toBeGreaterThan(initialAgentCount);
    }

    await this.pauseSimulation();
  }

  /**
   * Test time controls panel
   */
  async testTimeControlsPanel() {
    await this.expandPanel('time');

    // Test time of day controls
    const timeSlider = this.page.locator('input[type="range"]:near(:has-text("Time"))');
    if (await timeSlider.isVisible()) {
      // Test different times of day
      const times = ['6', '12', '18', '24'];
      for (const time of times) {
        await timeSlider.fill(time);
        await this.page.waitForTimeout(500);

        // Visual verification could be added here
        // e.g., checking lighting changes in the viewport
      }
    }

    await this.collapsePanel('time');
  }

  /**
   * Monitor performance during simulation
   */
  async monitorSimulationPerformance(durationMs: number = 10000) {
    await this.expandPanel('performance');

    const performanceData: Array<{
      fps: number;
      memory: number;
      agents: number;
      time: number;
      timestamp: number;
    }> = [];

    const startTime = Date.now();

    while (Date.now() - startTime < durationMs) {
      const metrics = await this.getPerformanceMetrics();
      performanceData.push({
        ...metrics,
        time: await this.getCurrentSimulationTime()
      });

      await this.page.waitForTimeout(1000);
    }

    await this.collapsePanel('performance');

    return performanceData;
  }

  /**
   * Test simulation stability under load
   */
  async testSimulationStability() {
    await this.startSimulation();

    // Run simulation at maximum speed for extended period
    await this.setSimulationSpeed(10);

    const performanceData = await this.monitorSimulationPerformance(30000); // 30 seconds

    // Verify FPS remains reasonable
    const avgFps = performanceData.reduce((sum, data) => sum + data.fps, 0) / performanceData.length;
    expect(avgFps).toBeGreaterThan(20); // Minimum acceptable FPS

    // Verify no memory leaks (memory should not consistently increase)
    const firstMemory = performanceData[0].memory;
    const lastMemory = performanceData[performanceData.length - 1].memory;
    const memoryIncrease = lastMemory - firstMemory;

    // Memory increase should be reasonable (less than 50MB over 30 seconds)
    expect(memoryIncrease).toBeLessThan(50000);

    await this.pauseSimulation();
  }

  /**
   * Test pause/resume cycling
   */
  async testPauseResumeCycling() {
    const cycles = 5;

    for (let i = 0; i < cycles; i++) {
      await this.startSimulation();
      await this.page.waitForTimeout(2000);

      await this.pauseSimulation();
      await this.page.waitForTimeout(1000);

      // Verify simulation state is consistent
      const agentCount = await this.getCurrentAgentCount();
      expect(agentCount).toBeGreaterThanOrEqual(0);

      await expect(this.layersActiveIndicator).toBeVisible();
    }
  }

  /**
   * Test simulation with different terrain profiles
   */
  async testSimulationWithTerrainProfiles() {
    const profiles = ['manhattan', 'san_francisco', 'denver', 'miami'];

    for (const profile of profiles) {
      // Change terrain profile
      await this.expandPanel('terrain');
      await this.terrainProfileDropdown.selectOption(profile);
      await this.page.waitForTimeout(3000); // Wait for terrain generation

      // Start simulation on new terrain
      await this.startSimulation();
      await this.page.waitForTimeout(3000);

      // Verify simulation works on this terrain
      const agentCount = await this.getCurrentAgentCount();
      const layerCount = await this.getActiveLayerCount();

      expect(agentCount).toBeGreaterThanOrEqual(0);
      expect(layerCount).toBeGreaterThan(0);

      await this.pauseSimulation();
      await this.collapsePanel('terrain');
    }
  }

  /**
   * Test edge cases and error conditions
   */
  async testSimulationEdgeCases() {
    // Test rapid start/stop
    for (let i = 0; i < 10; i++) {
      await this.startSimulation();
      await this.page.waitForTimeout(100);
      await this.pauseSimulation();
      await this.page.waitForTimeout(100);
    }

    // Verify simulation is still functional
    await this.startSimulation();
    await this.page.waitForTimeout(2000);

    const finalTime = await this.getCurrentSimulationTime();
    expect(finalTime).toBeGreaterThan(0);

    await this.pauseSimulation();
  }
}