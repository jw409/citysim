# Test HTML Fixtures

This directory contains standalone HTML test files used for debugging and verification.

## Files

### test-simple-3d.html
- **Purpose**: Minimal deck.gl test to verify 3D extrusion works in isolation
- **Usage**: Open in browser to test basic PolygonLayer with height extrusion
- **Created**: During building rendering debugging to isolate deck.gl behavior
- **Key features**: Single red building with 100m height, proper 3D settings

### test-minimal-3d.html
- **Purpose**: Even simpler 3D test with minimal configuration
- **Usage**: Standalone verification of 3D capabilities
- **Created**: For comparing vanilla deck.gl vs React implementation

## Usage

These files can be served locally for testing:

```bash
# Simple HTTP server
python -m http.server 8080
# Then navigate to http://localhost:8080/tests/fixtures/html/test-simple-3d.html
```

Or opened directly in browser for basic testing.

## When to Use

- **Isolating deck.gl issues**: Test if problems are in React integration vs core deck.gl
- **Verifying 3D capabilities**: Quick check that WebGL and extrusion work
- **Reference implementation**: See working examples of deck.gl configuration
- **Debugging baseline**: Compare against known-working minimal cases

## Integration with Test Suite

These fixtures can be used in playwright tests:

```typescript
// Navigate to fixture instead of main app
await page.goto('/tests/fixtures/html/test-simple-3d.html');
await page.waitForSelector('canvas');
// Test isolated deck.gl behavior
```

This provides a controlled environment for testing specific deck.gl functionality without the complexity of the full application.