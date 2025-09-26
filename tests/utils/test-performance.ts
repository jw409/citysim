/**
 * Test Performance Measurement Utilities
 * Provides wall clock time measurement and performance cost analysis for tests
 */

export interface TestCostMetrics {
  testName: string;
  wallClockTime: number; // milliseconds
  startTime: number;
  endTime: number;
  category: 'fast' | 'medium' | 'slow';
  priority: 'high' | 'medium' | 'low';
}

export class TestPerformanceTracker {
  private metrics: Map<string, TestCostMetrics> = new Map();
  private currentTest: string | null = null;
  private startTime: number = 0;

  /**
   * Start measuring test performance
   */
  startTest(testName: string, priority: 'high' | 'medium' | 'low' = 'medium'): void {
    this.currentTest = testName;
    this.startTime = Date.now();

    // Initialize metrics
    this.metrics.set(testName, {
      testName,
      wallClockTime: 0,
      startTime: this.startTime,
      endTime: 0,
      category: 'fast',
      priority
    });
  }

  /**
   * Stop measuring and calculate final metrics
   */
  endTest(): TestCostMetrics | null {
    if (!this.currentTest) return null;

    const endTime = Date.now();
    const wallClockTime = endTime - this.startTime;

    const metrics = this.metrics.get(this.currentTest);
    if (metrics) {
      metrics.endTime = endTime;
      metrics.wallClockTime = wallClockTime;
      metrics.category = this.categorizeTestSpeed(wallClockTime);

      console.log(`⏱️ Test "${this.currentTest}" completed in ${wallClockTime}ms (${metrics.category})`);
    }

    this.currentTest = null;
    return metrics || null;
  }

  /**
   * Categorize test speed based on wall clock time
   */
  private categorizeTestSpeed(wallClockTime: number): 'fast' | 'medium' | 'slow' {
    if (wallClockTime < 5000) return 'fast';      // Under 5 seconds
    if (wallClockTime < 15000) return 'medium';   // 5-15 seconds
    return 'slow';                                // Over 15 seconds
  }

  /**
   * Get performance summary for all tests
   */
  getSummary(): {
    totalTests: number;
    totalTime: number;
    averageTime: number;
    fastTests: number;
    mediumTests: number;
    slowTests: number;
    highPriorityTests: number;
  } {
    const allMetrics = Array.from(this.metrics.values());

    return {
      totalTests: allMetrics.length,
      totalTime: allMetrics.reduce((sum, m) => sum + m.wallClockTime, 0),
      averageTime: allMetrics.length > 0 ? allMetrics.reduce((sum, m) => sum + m.wallClockTime, 0) / allMetrics.length : 0,
      fastTests: allMetrics.filter(m => m.category === 'fast').length,
      mediumTests: allMetrics.filter(m => m.category === 'medium').length,
      slowTests: allMetrics.filter(m => m.category === 'slow').length,
      highPriorityTests: allMetrics.filter(m => m.priority === 'high').length
    };
  }

  /**
   * Get metrics for a specific test
   */
  getTestMetrics(testName: string): TestCostMetrics | undefined {
    return this.metrics.get(testName);
  }

  /**
   * Get all slow tests that should be optimized
   */
  getSlowTests(): TestCostMetrics[] {
    return Array.from(this.metrics.values())
      .filter(m => m.category === 'slow')
      .sort((a, b) => b.wallClockTime - a.wallClockTime);
  }

  /**
   * Print detailed performance report
   */
  printReport(): void {
    const summary = this.getSummary();
    const slowTests = this.getSlowTests();

    console.log('\n📊 TEST PERFORMANCE REPORT');
    console.log('=' .repeat(50));
    console.log(`⏱️ Total wall clock time: ${(summary.totalTime / 1000).toFixed(1)}s`);
    console.log(`📈 Average test time: ${(summary.averageTime / 1000).toFixed(1)}s`);
    console.log(`✅ Fast tests (< 5s): ${summary.fastTests}`);
    console.log(`⚠️ Medium tests (5-15s): ${summary.mediumTests}`);
    console.log(`🐌 Slow tests (> 15s): ${summary.slowTests}`);
    console.log(`🎯 High priority tests: ${summary.highPriorityTests}`);

    if (slowTests.length > 0) {
      console.log('\n🐌 SLOW TESTS TO OPTIMIZE:');
      slowTests.forEach(test => {
        console.log(`  - ${test.testName}: ${(test.wallClockTime / 1000).toFixed(1)}s (${test.priority} priority)`);
      });
    }
  }
}

// Global instance for easy access
export const testPerformanceTracker = new TestPerformanceTracker();

/**
 * Playwright fixture for measuring test performance
 */
export class TestPerformanceFixture {
  constructor(private testName: string) {}

  async measurePerformance<T>(
    operation: () => Promise<T>,
    description: string = this.testName,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<T> {
    testPerformanceTracker.startTest(description, priority);
    try {
      const result = await operation();
      testPerformanceTracker.endTest();
      return result;
    } catch (error) {
      testPerformanceTracker.endTest();
      throw error;
    }
  }
}