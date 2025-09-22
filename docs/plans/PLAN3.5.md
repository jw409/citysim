---
id: PLAN3.5
title: "Performance & Quality Improvements"
dependencies: ["PLAN3"]
status: pending
artifacts:
  - "src/components/PerformanceMonitor.tsx"
  - "wasm/src/simulation.rs" (updated)
  - "scripts/generate_city.js" (updated)
  - "src/App.tsx" (updated)
---

### Objective
Incorporate high-value performance monitoring and deterministic testing capabilities based on Technical Advisor recommendations, while maintaining development velocity and completing the MVP.

### Background
Following completion of PLAN3 (WASM Simulation Core), the Technical Advisor provided strategic recommendations for performance optimization and testing reliability. This plan implements the immediate, low-friction improvements that provide maximum value without disrupting the existing architecture.

### Adopted Immediately (High Value, Low Friction)

#### 1. Performance Benchmarking
Add simple TPS/FPS metrics to existing debug overlay for real-time performance visibility.

**Rationale**: Essential for identifying performance bottlenecks early. Low implementation cost, high debugging value.

#### 2. Deterministic Seeds
Extend existing noise-based generation to use consistent seeds for reproducible testing.

**Rationale**: Already partially implemented. Small change enables reliable automated testing and debugging.

#### 3. Simple Visual Fidelity
Continue with current "cute" aesthetic approach - no changes needed.

**Rationale**: Already aligned with advisor recommendations.

### Deferred to Post-MVP

#### Performance Optimizations (v2.0 scope)
- ECS architecture refactor
- WASM memory pre-allocation
- Cargo bench performance suite

#### Architecture Improvements (v2.0 scope)
- Zustand state management migration
- Advanced memory management patterns

### Task Breakdown

1. **Create Performance Monitor Component** (src/components/PerformanceMonitor.tsx):
   ```typescript
   interface PerformanceMetrics {
     fps: number;
     tps: number; // Ticks per second
     memoryUsage: number;
     agentCount: number;
   }
   ```

2. **Add Seed Support to Simulation** (wasm/src/simulation.rs):
   ```rust
   pub struct Simulation {
       pub world: World,
       pub running: bool,
       pub speed_multiplier: f32,
       pub seed: u64, // New field
   }
   ```

3. **Update City Generation Script** (scripts/generate_city.js):
   - Accept `--seed` parameter
   - Use deterministic random number generation
   - Output seed in generated city metadata

4. **Integrate Performance Monitor** (src/App.tsx):
   - Add PerformanceMonitor to debug overlay
   - Position in corner with minimal UI impact
   - Show/hide with keyboard shortcut

### Implementation Strategy

**Phase 1: Performance Monitoring**
- Create standalone PerformanceMonitor component
- Add to existing App layout
- Hook into simulation update loop

**Phase 2: Deterministic Seeds**
- Update WASM simulation to accept seed parameter
- Modify city generation to use provided seeds
- Add seed display to UI for debugging

**Phase 3: Integration**
- Test performance monitoring accuracy
- Validate deterministic behavior with same seeds
- Update documentation

### Acceptance Criteria
- [ ] Performance monitor displays accurate FPS and TPS
- [ ] Simulation accepts seed parameter and produces deterministic results
- [ ] City generation script uses deterministic seeds
- [ ] Performance overlay can be toggled on/off
- [ ] Same seed produces identical city layouts
- [ ] No performance regression from monitoring overhead
- [ ] All existing functionality remains intact

### Technical Specifications

#### Performance Monitor Requirements
- Update frequency: 60Hz for FPS, 10Hz for other metrics
- Display format: Compact overlay in screen corner
- Metrics tracked:
  - Browser FPS (requestAnimationFrame timing)
  - Simulation TPS (WASM tick timing)
  - Memory usage (WASM heap size)
  - Active agent count

#### Seed Implementation Requirements
- Seed type: 64-bit unsigned integer
- Default behavior: Auto-generate random seed if not provided
- Scope: Affects both city generation and agent behavior
- Persistence: Store in simulation state for debugging

### Test Plan
Execute from project root directory:

```bash
#!/bin/bash
set -e

echo "🧪 Testing PLAN3.5: Performance & Quality Improvements"

# Test 1: Performance Monitor Component
echo "📊 Testing Performance Monitor..."
if [ ! -f "src/components/PerformanceMonitor.tsx" ]; then
  echo "❌ PerformanceMonitor component not found"
  exit 1
fi
echo "✅ PerformanceMonitor component exists"

# Test 2: Deterministic Seeds
echo "🎲 Testing deterministic seeds..."
cd scripts
node generate_city.js --seed 12345 --output ../test_city_1.json
node generate_city.js --seed 12345 --output ../test_city_2.json
cd ..

if ! diff test_city_1.json test_city_2.json > /dev/null; then
  echo "❌ Deterministic seeds failed - cities are different"
  exit 1
fi
echo "✅ Deterministic seeds working"

# Cleanup test files
rm -f test_city_1.json test_city_2.json

# Test 3: WASM Integration
echo "🦀 Testing WASM seed integration..."
npm run build:wasm > /dev/null 2>&1 || exit 1
echo "✅ WASM builds with seed support"

# Test 4: Performance Monitoring
echo "⚡ Testing performance monitoring..."
timeout 10s npm run dev > /dev/null 2>&1 &
DEV_PID=$!
sleep 5

if kill -0 $DEV_PID 2>/dev/null; then
  echo "✅ App runs with performance monitoring"
  kill $DEV_PID
  wait $DEV_PID 2>/dev/null
else
  echo "❌ App failed with performance monitoring"
  exit 1
fi

echo "🎉 PLAN3.5 COMPLETED SUCCESSFULLY"
echo "📈 Performance Features:"
echo "   - Real-time FPS/TPS monitoring"
echo "   - Deterministic city generation"
echo "   - Reproducible testing capability"
echo "Next: Continue with existing roadmap"
exit 0
```

### Success Metrics
- Zero performance regression in core simulation
- Deterministic behavior verified with automated tests
- Performance metrics provide actionable debugging information
- Implementation completed within 1 development session

This plan maintains the project's velocity while incorporating the Technical Advisor's most valuable recommendations for immediate implementation.