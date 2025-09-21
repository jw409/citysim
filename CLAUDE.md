# Claude Code Instructions for UrbanSynth

## Playwright Testing Protocol

### Window Configuration
- Always use longer windows: `1920x1440` instead of default `1920x1080`
- Launch browser with: `chromium.launch({ headless: false, args: ['--window-size=1920,1440'] })`
- Set viewport: `page.setViewportSize({ width: 1920, height: 1440 })`

### Screenshot Comparison Protocol
When testing visual changes, always take TWO screenshots for comparison:

1. **Normal view**: Standard screenshot
2. **Panned view**: Rotate/pan the camera 15 degrees for different perspective

This provides:
- Better understanding of 3D geometry
- Different lighting angles
- Verification that changes work from multiple viewpoints

### Example Implementation
```javascript
// Screenshot 1: Normal view
await page.screenshot({ path: 'feature-normal.png', fullPage: true });

// Screenshot 2: Pan 15 degrees and capture
await page.evaluate(() => {
  // Simulate mouse drag to rotate view ~15 degrees
  const canvas = document.querySelector('canvas');
  if (canvas) {
    const rect = canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Simulate drag from center to 15 degrees rotation
    canvas.dispatchEvent(new MouseEvent('mousedown', { clientX: centerX, clientY: centerY }));
    canvas.dispatchEvent(new MouseEvent('mousemove', { clientX: centerX + 50, clientY: centerY }));
    canvas.dispatchEvent(new MouseEvent('mouseup', { clientX: centerX + 50, clientY: centerY }));
  }
});
await page.waitForTimeout(500);
await page.screenshot({ path: 'feature-panned.png', fullPage: true });
```

## Current Debugging Status

### Building Rendering Issue
- ✅ Pure deck.gl works perfectly (red 3D building in test-simple-3d.html)
- ❌ React deck.gl app shows flat buildings despite same settings
- Root cause: Difference between vanilla deck.gl and @deck.gl/react implementation

### Camera Settings
- Zoom: 14 (good detail level)
- Pitch: 60 (good 3D perspective)
- Bearing: 30 (slight rotation)

### Key Findings
- Buildings have correct heights (196m, 252m, 347m, 393m)
- No JavaScript errors after fixing type checking
- viewState missing pitch/bearing issue partially resolved
- 3D extrusion works in isolation but not in React app

## Next Investigation Steps
1. Compare React deck.gl layer props vs vanilla deck.gl
2. Check if polygon coordinate format matches expected structure
3. Verify material and lighting settings in React context
4. Test minimal React reproduction case