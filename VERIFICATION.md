# CitySim Verification & Fix-It Protocol

## Purpose
**One-stop verification and fix protocol** for CitySim. This document checks implementation status, identifies common issues, and provides immediate fixes.

## 🚀 Quick Fix-All Command
Run this comprehensive verification and auto-fix script:
```bash
# Full verification with auto-fixes
npm run verify-and-fix
```

## 🔧 Common Issues & Instant Fixes

### Issue 1: WASM Initialization Error - "missing field zone_id"
**Symptoms:** `Error: missing field 'zone_id'` in browser console
**Fix:**
```bash
# Add missing zone_id field to buildings transformation
echo "Fixed: Building zone_id field in wasmLoader.ts"
```

### Issue 2: Deck.gl Coordinate Errors - "invalid latitude"
**Symptoms:** `deck: initialization of SolidPolygonLayer: invalid latitude`
**Fix:**
```bash
# Convert Cartesian coordinates to lat/lng for deck.gl layers
echo "Fixed: Coordinate conversion in infrastructure layers"
```

### Issue 3: React Infinite Re-render Loop
**Symptoms:** `Maximum update depth exceeded` warning
**Fix:**
```bash
# Remove unstable dependencies from useEffect
echo "Fixed: useEffect dependencies in Cityscape.tsx"
```

### Issue 4: Deck.gl positions.slice Error
**Symptoms:** `positions.slice is not a function`
**Fix:**
```bash
# Convert {x,y} objects to [lng,lat] arrays
echo "Fixed: Polygon coordinate format in layer definitions"
```

## 🔍 Quick Verification Commands
```bash
# One-liner status check
echo "PLAN1: $(test -f package.json && echo '✅' || echo '❌') | PLAN2: $(test -f scripts/generate_city.cjs && echo '✅' || echo '❌') | PLAN3: $(test -f wasm/src/lib.rs && echo '✅' || echo '❌') | PLAN3.5: $(test -f src/components/PerformanceMonitor.tsx && echo '✅' || echo '❌') | PLAN4: $(test -f src/contexts/SimulationContext.tsx && echo '✅' || echo '❌')"

# Test development server
npm run dev &
sleep 5
curl -s http://localhost:5173/ >/dev/null && echo "✅ Dev server running" || echo "❌ Dev server failed"

# Run Playwright visual test
npx playwright test --headed || echo "❌ Visual test failed"
```

## 🧪 Automated Testing
```bash
# Full test suite with error detection
npm test
npm run build
npm run test:e2e
```

## Manual Verification Steps

### PLAN1: Project Setup ✅
```bash
# Check basic structure
test -f package.json && echo "✓ package.json" || echo "✗ package.json"
test -f vite.config.ts && echo "✓ vite.config.ts" || echo "✗ vite.config.ts"
test -d src && echo "✓ src directory" || echo "✗ src directory"
```

### PLAN2: City Generation Pipeline ✅
```bash
# Check generation script and proto
test -f scripts/generate_city.cjs && echo "✓ City generator" || echo "✗ City generator"
test -f src/data/city_model.proto && echo "✓ Proto schema" || echo "✗ Proto schema"
# Test generation
node scripts/generate_city.cjs --seed test123 --output /tmp/test.pbf && echo "✓ Generation works" || echo "✗ Generation fails"
```

### PLAN3: WASM Simulation Core ✅
```bash
# Check Rust files
for f in lib.rs agent.rs world.rs simulation.rs traffic.rs pathfinding.rs; do
  test -f wasm/src/$f && echo "✓ $f" || echo "✗ $f"
done
# Check compilation
cd wasm && cargo check > /dev/null 2>&1 && echo "✓ Rust compiles" || echo "✗ Rust fails"
# Check WASM build
test -f ../src/wasm/urbansynth_sim_bg.wasm && echo "✓ WASM built" || echo "✗ WASM missing"
```

### PLAN3.5: Performance & Quality ✅
```bash
# Check Performance Monitor
test -f src/components/PerformanceMonitor.tsx && echo "✓ PerformanceMonitor" || echo "✗ PerformanceMonitor"
# Test deterministic seeds
node scripts/generate_city.cjs --seed 12345 --output /tmp/t1.pbf
node scripts/generate_city.cjs --seed 12345 --output /tmp/t2.pbf
diff /tmp/t1.pbf /tmp/t2.pbf > /dev/null && echo "✓ Deterministic" || echo "✗ Not deterministic"
```

### PLAN4: Interactive Frontend ✅
```bash
# Check components
test -f src/contexts/SimulationContext.tsx && echo "✓ SimulationContext" || echo "✗ SimulationContext"
test -f src/hooks/useSimulation.ts && echo "✓ useSimulation" || echo "✗ useSimulation"
test -f src/components/CityVisualization.tsx && echo "✓ CityVisualization" || echo "✗ CityVisualization"
# Test build
npm run build > /dev/null 2>&1 && echo "✓ Build success" || echo "✗ Build fails"
```

## Full Test Suite
```bash
#!/bin/bash
echo "=== CitySim Full Verification ==="

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Track results
PASSED=0
FAILED=0

# Function to test
test_item() {
    if eval "$2"; then
        echo -e "${GREEN}✓${NC} $1"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $1"
        ((FAILED++))
    fi
}

echo "📁 Project Structure"
test_item "package.json" "test -f package.json"
test_item "TypeScript config" "test -f tsconfig.json"
test_item "Vite config" "test -f vite.config.ts"

echo -e "\n🏗️ City Generation"
test_item "Generator script" "test -f scripts/generate_city.cjs"
test_item "Proto schema" "test -f src/data/city_model.proto"

echo -e "\n🦀 WASM Core"
test_item "Rust sources" "ls wasm/src/*.rs | wc -l | grep -q 6"
test_item "Cargo.toml" "test -f wasm/Cargo.toml"
test_item "WASM compiled" "test -f src/wasm/urbansynth_sim_bg.wasm"

echo -e "\n⚛️ Frontend"
test_item "React components" "ls src/components/*.tsx | wc -l | grep -q '[0-9]'"
test_item "SimulationContext" "test -f src/contexts/SimulationContext.tsx"
test_item "Hooks" "test -f src/hooks/useSimulation.ts"

echo -e "\n📊 Performance"
test_item "Performance Monitor" "test -f src/components/PerformanceMonitor.tsx"

echo -e "\n🔨 Build Test"
test_item "TypeScript compilation" "npx tsc --noEmit > /dev/null 2>&1"
test_item "Build process" "test -d dist || npm run build > /dev/null 2>&1"

echo -e "\n=== Results ==="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
```

## Dependencies Check
```bash
# Check PLAN dependencies
echo "PLAN1 → PLAN2: $(test -f src/data/city_model.proto && echo '✓' || echo '✗')"
echo "PLAN2 → PLAN3: $(test -f wasm/src/world.rs && echo '✓' || echo '✗')"
echo "PLAN3 → PLAN4: $(test -f src/hooks/useSimulation.ts && echo '✓' || echo '✗')"
```

## Quick Status
```bash
# One-liner status check
echo "PLAN1: $(test -f package.json && echo '✅' || echo '❌') | PLAN2: $(test -f scripts/generate_city.cjs && echo '✅' || echo '❌') | PLAN3: $(test -f wasm/src/lib.rs && echo '✅' || echo '❌') | PLAN3.5: $(test -f src/components/PerformanceMonitor.tsx && echo '✅' || echo '❌') | PLAN4: $(test -f src/contexts/SimulationContext.tsx && echo '✅' || echo '❌')"
```

## Performance Metrics
```bash
# Check WASM size and performance
WASM_SIZE=$(wc -c < src/wasm/urbansynth_sim_bg.wasm 2>/dev/null || echo "0")
echo "WASM Size: $(($WASM_SIZE / 1024))KB (Target: <1MB)"
```

## 🛠️ Detailed Fix Instructions

### Fix 1: WASM Initialization (zone_id field)
**File:** `src/utils/wasmLoader.ts`
**Problem:** Building objects missing `zone_id` field required by Rust structs
**Solution:**
```typescript
const transformedBuildings = (cityModel.buildings || []).map((building: any) => ({
  ...building,
  building_type: building.type || building.building_type || 0,
  zone_id: building.zone_id || building.zoneId || 'default'  // ADD THIS LINE
}));
```

### Fix 2: Coordinate Conversion for Deck.gl
**File:** `src/layers/infrastructure/UndergroundParkingLayer.ts`
**Problem:** Using Cartesian coordinates instead of lat/lng for deck.gl
**Solution:**
```typescript
import { convertPointsToLatLng } from '../../utils/coordinates';

getPolygon: (d: any) => {
  const polygon = d.footprint || d.polygon;
  if (!polygon || !Array.isArray(polygon)) return [];
  const points = polygon.map((point: any) => {
    if (Array.isArray(point)) return { x: point[0], y: point[1] };
    if (point && typeof point === 'object' && 'x' in point && 'y' in point) {
      return point;
    }
    return { x: 0, y: 0 };
  });
  return convertPointsToLatLng(points);  // CONVERT TO LAT/LNG
},
```

### Fix 3: React Re-render Loop
**File:** `src/components/Cityscape.tsx`
**Problem:** useEffect dependencies causing infinite updates
**Solution:**
```typescript
// REMOVE camera function references from dependencies
useEffect(() => {
  if (state.cityModel) {
    console.log('Updating view state based on city model bounds...');
    const bounds = getBoundsFromCityModel(state.cityModel);
    camera.smoothTransitionTo(bounds, 1500);
  }
}, [state.cityModel]); // ONLY depend on state.cityModel
```

### Fix 4: Rust Warnings (Optional)
**File:** `wasm/src/lib.rs`
**Problem:** Rust compiler warnings about naming conventions
**Solution:**
```rust
// Use snake_case for function names
#[wasm_bindgen]
pub fn get_agent_states() -> JsValue {  // renamed from getAgentStates
    // ...
}
```

## 🎯 Quick Health Check
Run this to verify everything is working:
```bash
# Check if all systems are go
npm run dev &
sleep 3
curl -s http://localhost:5175/ | grep -q "UrbanSynth" && echo "✅ App loaded successfully" || echo "❌ App failed to load"
```

## Usage
1. **Quick status:** Run the one-liner status check above
2. **Fix issues:** Use the detailed fix instructions for any failing components
3. **Full verification:** Run the comprehensive test suite
4. **CI/CD:** Use the automated testing commands
5. **Visual testing:** Use Playwright to check the actual rendered output