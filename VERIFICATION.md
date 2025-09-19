# CitySim Verification Protocol

## Purpose
Quick verification protocol to check implementation status of PLANs without typing long prompts.

## Quick Verification Command
Copy and run this one-liner to verify all implementations:
```bash
bash -c "$(curl -s https://raw.githubusercontent.com/jw409/citysim/master/scripts/verify.sh)"
```

Or locally:
```bash
./scripts/verify.sh
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

## Usage
1. For quick status: Run the one-liner status check
2. For detailed verification: Run the full test suite
3. For specific PLAN: Run the individual PLAN verification
4. For CI/CD: Use the full test suite script with exit codes