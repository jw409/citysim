# UrbanSynth E2E Testing Suite

A comprehensive Playwright-based testing framework for the UrbanSynth Interactive City Simulator.

## Overview

This testing suite provides comprehensive coverage of UrbanSynth's functionality including:

- 🏗️ **Core Infrastructure**: App initialization, loading, error handling
- 🎮 **3D Viewport**: Camera controls, zoom, pan, rotate, presets
- ⏯️ **Simulation**: Start/pause/reset, speed controls, agent behavior
- 🎛️ **UI Panels**: Draggable panels, state persistence, interactions
- 🏔️ **Terrain System**: Multiple city profiles, terrain generation
- 📊 **Performance**: FPS monitoring, memory usage, stability
- 🖼️ **Visual Regression**: Screenshot comparison, cross-browser consistency

## Quick Start

### Prerequisites

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Running Tests

```bash
# Run all tests
npm test

# Or use the custom test runner
node scripts/test-runner.js all

# Run specific test suite
node scripts/test-runner.js viewport

# Run tests in headed mode (visible browser)
node scripts/test-runner.js headed core

# Debug specific tests
node scripts/test-runner.js debug simulation
```

## Test Structure

```
tests/
├── e2e/                          # End-to-end test suites
│   ├── core/                     # Core infrastructure tests
│   │   ├── app-initialization.spec.ts
│   │   ├── city-generation.spec.ts
│   │   └── error-handling.spec.ts
│   ├── viewport/                 # 3D viewport and camera tests
│   │   ├── camera-controls.spec.ts
│   │   ├── layer-rendering.spec.ts
│   │   └── presets.spec.ts
│   ├── simulation/               # Simulation control tests
│   │   ├── start-pause-reset.spec.ts
│   │   ├── speed-controls.spec.ts
│   │   └── agent-spawning.spec.ts
│   ├── ui-panels/               # UI panel interaction tests
│   │   ├── draggable-panels.spec.ts
│   │   ├── camera-panel.spec.ts
│   │   └── terrain-panel.spec.ts
│   ├── terrain/                 # Terrain generation tests
│   │   ├── terrain-generation.spec.ts
│   │   └── city-profiles.spec.ts
│   ├── performance/             # Performance monitoring tests
│   │   ├── fps-monitoring.spec.ts
│   │   └── memory-usage.spec.ts
│   └── visual-regression/       # Visual regression tests
│       ├── viewport-snapshots.spec.ts
│       └── ui-consistency.spec.ts
├── fixtures/                    # Reusable test fixtures
│   ├── base-page.ts            # Base page object with common selectors
│   ├── viewport-helpers.ts     # 3D viewport interaction helpers
│   └── simulation-helpers.ts   # Simulation control helpers
├── utils/                      # Testing utilities
│   ├── performance-metrics.ts  # Performance monitoring utilities
│   ├── wait-helpers.ts        # Smart waiting utilities
│   └── screenshot-compare.ts  # Visual comparison utilities
├── setup/                     # Global test setup
│   ├── global-setup.ts       # Pre-test setup
│   └── global-teardown.ts    # Post-test cleanup
├── baselines/                 # Visual regression baselines
└── screenshots/              # Test screenshots
```

## Test Runner Commands

### Test Suites

| Command | Description |
|---------|-------------|
| `all [browser]` | Run all tests (default: chromium) |
| `core [browser]` | Run core infrastructure tests |
| `viewport [browser]` | Run viewport and camera tests |
| `simulation [browser]` | Run simulation control tests |
| `ui-panels [browser]` | Run UI panel tests |
| `visual [browser]` | Run visual regression tests |

### Special Modes

| Command | Description |
|---------|-------------|
| `headed [suite] [browser]` | Run tests in headed mode (visible browser) |
| `debug [suite]` | Run tests in debug mode (single worker, breakpoints) |
| `cross-browser` | Run core tests across all browsers |
| `smoke` | Run smoke tests (quick validation) |
| `performance` | Run performance-related tests only |

### Utilities

| Command | Description |
|---------|-------------|
| `report` | Open test report |
| `install` | Install Playwright browsers |
| `update-snapshots` | Update visual regression baselines |

## Browser Support

Tests run on multiple browsers:
- **Chromium** (default)
- **Firefox**
- **WebKit** (Safari engine)
- **Mobile Chrome** (Pixel 5 simulation)
- **Mobile Safari** (iPhone 12 simulation)

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { BasePage } from '../../fixtures/base-page';

test.describe('Feature Tests', () => {
  let basePage: BasePage;

  test.beforeEach(async ({ page }) => {
    basePage = new BasePage(page);
    await basePage.goto();
    await basePage.waitForLayerCount(17);
  });

  test('should test feature functionality', async () => {
    // Test implementation
  });
});
```

### Using Fixtures

```typescript
import { ViewportHelpers } from '../../fixtures/viewport-helpers';
import { SimulationHelpers } from '../../fixtures/simulation-helpers';

test('viewport interaction test', async ({ page }) => {
  const viewport = new ViewportHelpers(page);

  await viewport.goto();
  await viewport.rotateCamera(90, 45);
  await viewport.verifyViewportRendering();
});
```

### Visual Regression Testing

```typescript
test('visual consistency test', async ({ page }) => {
  const viewport = new ViewportHelpers(page);

  await viewport.clickCameraPreset('overview');
  await viewport.waitForViewportStabilization();

  await expect(viewport.canvas).toHaveScreenshot('overview-baseline.png', {
    threshold: 0.3,
    animations: 'disabled'
  });
});
```

### Performance Testing

```typescript
import { PerformanceMetricsCollector } from '../../utils/performance-metrics';

test('performance test', async ({ page }) => {
  const collector = new PerformanceMetricsCollector(page);

  await collector.startCollection(1000);
  // Perform actions
  collector.stopCollection();

  const avgMetrics = collector.getAverageMetrics();
  expect(avgMetrics.fps).toBeGreaterThan(30);
});
```

## Configuration

### Playwright Configuration

Key settings in `playwright.config.ts`:

- **Timeout**: 3 minutes for complex 3D tests
- **Retries**: 2 retries on CI, 0 locally
- **Screenshots**: On failure only
- **Videos**: Retained on failure
- **Traces**: On first retry

### Environment Variables

```bash
# Run in CI mode (more retries, parallel execution)
CI=true npm test

# Custom base URL
BASE_URL=http://localhost:3000 npm test
```

## Best Practices

### Test Organization

1. **Group related tests** in describe blocks
2. **Use descriptive test names** that explain the expected behavior
3. **Keep tests independent** - each test should work in isolation
4. **Use proper setup/teardown** in beforeEach/afterEach hooks

### Performance Considerations

1. **Wait for stability** before taking screenshots
2. **Use appropriate timeouts** for 3D rendering operations
3. **Monitor memory usage** in long-running tests
4. **Clean up resources** in teardown hooks

### Visual Testing

1. **Disable animations** for consistent screenshots
2. **Use appropriate thresholds** (0.3 for most tests)
3. **Update baselines carefully** after intentional changes
4. **Test across multiple viewports** for responsive design

### Debugging

1. **Use headed mode** for visual debugging: `headed core`
2. **Use debug mode** for step-by-step debugging: `debug simulation`
3. **Check test reports** for detailed failure information
4. **Capture additional screenshots** in failing tests

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm test
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: test-results
          path: test-results/
```

### Test Reports

Tests generate multiple report formats:
- **HTML Report**: Interactive test results with screenshots/videos
- **JUnit XML**: For CI integration
- **JSON**: For custom analysis

Access reports:
```bash
npx playwright show-report
```

## Performance Benchmarks

### Expected Performance

| Metric | Minimum | Target |
|--------|---------|--------|
| FPS | 20 | 60 |
| Initial Load | < 10s | < 5s |
| Memory Usage | < 200MB | < 100MB |
| Time to Interactive | < 15s | < 8s |

### Performance Tests

Performance tests monitor:
- Frame rate during simulation
- Memory usage over time
- Load times for different city profiles
- Responsiveness under stress

## Troubleshooting

### Common Issues

1. **Tests timing out**
   - Increase timeout in test or globally
   - Check if application is running on expected port
   - Verify network connectivity

2. **Visual regression failures**
   - Update baselines if changes are intentional
   - Check for animation timing issues
   - Verify consistent browser versions

3. **Flaky tests**
   - Add proper waits for async operations
   - Check for race conditions
   - Use more specific selectors

### Debug Commands

```bash
# Run single test with full output
npx playwright test tests/e2e/core/app-initialization.spec.ts --headed --debug

# Generate trace for failed test
npx playwright test --trace on

# Update specific visual baseline
npx playwright test tests/e2e/visual-regression/viewport-snapshots.spec.ts --update-snapshots
```

## Contributing

### Adding New Tests

1. Create test file in appropriate directory
2. Use existing fixtures and utilities
3. Follow naming conventions
4. Add comprehensive test coverage
5. Update documentation

### Updating Baselines

When UI changes require new visual baselines:

```bash
# Update all visual baselines
node scripts/test-runner.js update-snapshots

# Update specific test baselines
npx playwright test viewport-snapshots.spec.ts --update-snapshots
```

### Code Review Checklist

- [ ] Tests are independent and repeatable
- [ ] Proper use of fixtures and utilities
- [ ] Appropriate timeouts and waits
- [ ] Visual tests have reasonable thresholds
- [ ] Performance assertions are realistic
- [ ] Error conditions are tested
- [ ] Documentation is updated

## Maintenance

### Regular Tasks

1. **Update browser versions** monthly
2. **Review and update baselines** after UI changes
3. **Monitor performance benchmarks** for regressions
4. **Clean up old test artifacts** regularly
5. **Update dependencies** and fix breaking changes

### Monitoring

Track test health with:
- Test execution time trends
- Flakiness rates
- Performance regression detection
- Visual regression frequency

For questions or issues, check the main project documentation or open an issue in the repository.