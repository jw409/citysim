# Claude Code Instructions for UrbanSynth

## Playwright Testing & Screenshot Protocol

### Core Requirements
- **Viewport**: Always use `1920x1440` for consistent 3D visualization
- **Browser**: `chromium.launch({ headless: false, args: ['--window-size=1920,1440'] })`
- **Multi-angle captures**: Required for 3D scene analysis and debugging

### Screenshot Organization
- **Test screenshots**: Use `tests/temp-screenshots/` for all debugging/development
- **Test baselines**: Use `tests/baselines/` for official regression baselines
- **Never save** screenshots to project root (already gitignored)

### Quick Debug Capture
Use the standalone script for rapid debugging:
```bash
# Quick 2-angle capture (normal + panned)
node scripts/capture-debug.mjs feature-name

# Comprehensive 4-angle capture (normal + panned + tilted + zoomed-out)
node scripts/capture-debug.mjs issue-name --comprehensive

# Include full page UI in screenshots
node scripts/capture-debug.mjs ui-test --full-page
```

### Programmatic Screenshot Capture
In tests, use the `ScreenshotHelpers` utility:
```typescript
import { createScreenshotHelpers } from '../utils/screenshot-helpers';

// In your test
const screenshots = createScreenshotHelpers(page);

// Quick debug (normal + panned views)
await screenshots.captureDebug('feature-test');

// Comprehensive analysis (all 4 angles)
await screenshots.captureComprehensive('bug-investigation');

// Before/after comparison
await screenshots.captureComparison(
  async () => await viewport.clickCameraPreset('overview'),
  async () => await viewport.clickCameraPreset('street'),
  'preset-comparison'
);
```

### Multi-Angle Protocol Details
1. **Normal**: Current viewport state
2. **Panned**: Rotate 100px horizontally (≈15° for most zoom levels)
3. **Tilted**: Rotate 50px vertically for different elevation
4. **Zoomed-out**: Zoom out 300px for broader context

### Camera Movements for Analysis
- **Pan**: `viewport.rotateCamera(deltaX, 0)` for horizontal rotation
- **Tilt**: `viewport.rotateCamera(0, deltaY)` for vertical perspective
- **Zoom**: `viewport.zoomCamera(delta)` for scale changes
- **Stabilization**: Always `await viewport.waitForViewportStabilization()` after movements

### Test Running
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:viewport
npm run test:core
npm run test:performance

# Update visual regression baselines
npm run test:update-snapshots
```

### File Cleanup
- Temp screenshots auto-cleanup after 7 days
- Manual cleanup: `screenshots.cleanupOldScreenshots()`
- Recent files: `screenshots.getRecentScreenshots(10)`