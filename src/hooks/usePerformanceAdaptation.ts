import { useState, useEffect, useCallback, useRef } from 'react';
import {
  PerformanceProfile,
  PerformanceState,
  AdaptationSettings,
  PerformanceMetrics,
  DeviceBenchmarkResult,
  PerformanceLevel
} from '../types/performance';
import { performanceProfiler } from '../utils/performanceProfiler';

interface UsePerformanceAdaptationOptions {
  autoStart?: boolean;
  adaptationSettings?: Partial<AdaptationSettings>;
  onProfileChange?: (profile: PerformanceProfile) => void;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

export function usePerformanceAdaptation(options: UsePerformanceAdaptationOptions = {}) {
  const {
    autoStart = true,
    adaptationSettings: userSettings,
    onProfileChange,
    onMetricsUpdate
  } = options;

  const [performanceState, setPerformanceState] = useState<PerformanceState>({
    current_profile: getDefaultProfile(),
    metrics: getDefaultMetrics(),
    adaptation_settings: {
      ...performanceProfiler.createDefaultAdaptationSettings(),
      ...userSettings
    },
    is_adapting: false,
    last_adaptation_time: 0
  });

  const [benchmarkResult, setBenchmarkResult] = useState<DeviceBenchmarkResult | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const adaptationTimeoutRef = useRef<NodeJS.Timeout>();
  const stableFrameCountRef = useRef(0);

  // Initialize performance system
  const initialize = useCallback(async () => {
    if (isInitialized) return;

    try {
      console.log('🚀 Initializing performance adaptation system...');

      // Run device benchmark
      const result = await performanceProfiler.runBenchmark();
      setBenchmarkResult(result);

      // Update state with recommended profile
      setPerformanceState(prev => ({
        ...prev,
        current_profile: result.recommended_profile,
        metrics: {
          ...prev.metrics,
          target_fps: result.recommended_profile.target_fps
        }
      }));

      // Notify about profile change
      onProfileChange?.(result.recommended_profile);

      setIsInitialized(true);
      console.log(`✅ Performance system initialized with ${PerformanceLevel[result.recommended_profile.level]} profile`);

    } catch (error) {
      console.error('❌ Failed to initialize performance system:', error);
      // Fallback to medium profile
      const fallbackProfile = getDefaultProfile();
      setPerformanceState(prev => ({
        ...prev,
        current_profile: fallbackProfile
      }));
      onProfileChange?.(fallbackProfile);
      setIsInitialized(true);
    }
  }, [isInitialized, onProfileChange]);

  // Start performance monitoring
  const startMonitoring = useCallback(() => {
    performanceProfiler.startFrameMonitoring((metrics) => {
      setPerformanceState(prev => {
        const updatedMetrics = {
          ...metrics,
          target_fps: prev.current_profile.target_fps,
          agent_count: prev.metrics.agent_count // Preserve agent count from external updates
        };

        // Check if adaptation is needed
        if (prev.adaptation_settings.enable_auto_scaling && !prev.is_adapting) {
          checkForAdaptation(updatedMetrics, prev);
        }

        onMetricsUpdate?.(updatedMetrics);

        return {
          ...prev,
          metrics: updatedMetrics
        };
      });
    });
  }, [onMetricsUpdate]);

  // Stop performance monitoring
  const stopMonitoring = useCallback(() => {
    performanceProfiler.stopFrameMonitoring();
    if (adaptationTimeoutRef.current) {
      clearTimeout(adaptationTimeoutRef.current);
    }
  }, []);

  // Check if performance adaptation is needed
  const checkForAdaptation = useCallback((metrics: PerformanceMetrics, state: PerformanceState) => {
    const { current_fps, target_fps } = metrics;
    const { adaptation_settings, last_adaptation_time } = state;
    const now = Date.now();

    // Check if enough time has passed since last adaptation
    if (now - last_adaptation_time < adaptation_settings.adaptation_delay_ms) {
      return;
    }

    const fpsDifference = target_fps - current_fps;
    const isUnderperforming = fpsDifference > adaptation_settings.fps_tolerance;
    const isOverperforming = fpsDifference < -adaptation_settings.fps_tolerance;

    if (isUnderperforming || isOverperforming) {
      stableFrameCountRef.current++;

      // Only adapt if we've had consistent performance for minimum frames
      if (stableFrameCountRef.current >= adaptation_settings.min_stable_frames) {
        adaptPerformance(isUnderperforming ? 'down' : 'up');
        stableFrameCountRef.current = 0;
      }
    } else {
      stableFrameCountRef.current = 0;
    }
  }, []);

  // Adapt performance up or down
  const adaptPerformance = useCallback((direction: 'up' | 'down') => {
    setPerformanceState(prev => {
      if (prev.is_adapting) return prev;

      const currentLevel = prev.current_profile.level;
      let newLevel = currentLevel;

      if (direction === 'down' && currentLevel > PerformanceLevel.UltraLow) {
        newLevel = currentLevel - 1;
      } else if (direction === 'up' && currentLevel < PerformanceLevel.Ultra) {
        newLevel = currentLevel + 1;
      } else {
        return prev; // No change needed
      }

      const newProfile = createProfileForLevel(newLevel);

      console.log(`🔄 Adapting performance ${direction}: ${PerformanceLevel[currentLevel]} → ${PerformanceLevel[newLevel]}`);

      // Set adapting state temporarily
      const newState = {
        ...prev,
        current_profile: newProfile,
        is_adapting: true,
        last_adaptation_time: Date.now(),
        metrics: {
          ...prev.metrics,
          target_fps: newProfile.target_fps
        }
      };

      // Clear adapting state after delay
      if (adaptationTimeoutRef.current) {
        clearTimeout(adaptationTimeoutRef.current);
      }
      adaptationTimeoutRef.current = setTimeout(() => {
        setPerformanceState(state => ({
          ...state,
          is_adapting: false
        }));
      }, 1000);

      onProfileChange?.(newProfile);
      return newState;
    });
  }, [onProfileChange]);

  // Manual profile override
  const setProfile = useCallback((profile: PerformanceProfile) => {
    setPerformanceState(prev => ({
      ...prev,
      current_profile: profile,
      metrics: {
        ...prev.metrics,
        target_fps: profile.target_fps
      },
      last_adaptation_time: Date.now()
    }));
    onProfileChange?.(profile);
  }, [onProfileChange]);

  // Update agent count (called externally by simulation)
  const updateAgentCount = useCallback((count: number) => {
    setPerformanceState(prev => ({
      ...prev,
      metrics: {
        ...prev.metrics,
        agent_count: count
      }
    }));
  }, []);

  // Update adaptation settings
  const updateSettings = useCallback((settings: Partial<AdaptationSettings>) => {
    setPerformanceState(prev => ({
      ...prev,
      adaptation_settings: {
        ...prev.adaptation_settings,
        ...settings
      }
    }));
  }, []);

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart) {
      initialize().then(() => {
        startMonitoring();
      });
    }

    return () => {
      stopMonitoring();
    };
  }, [autoStart, initialize, startMonitoring, stopMonitoring]);

  return {
    // State
    performanceState,
    benchmarkResult,
    isInitialized,

    // Actions
    initialize,
    startMonitoring,
    stopMonitoring,
    setProfile,
    updateAgentCount,
    updateSettings,
    adaptPerformance,

    // Computed values
    currentLevel: PerformanceLevel[performanceState.current_profile.level],
    isPerformingWell: Math.abs(performanceState.metrics.current_fps - performanceState.metrics.target_fps) <= performanceState.adaptation_settings.fps_tolerance,
    canAdaptUp: performanceState.current_profile.level < PerformanceLevel.Ultra,
    canAdaptDown: performanceState.current_profile.level > PerformanceLevel.UltraLow
  };
}

// Helper functions
function getDefaultProfile(): PerformanceProfile {
  return {
    target_fps: 60,
    max_agents: 5000,
    render_distance: 600.0,
    update_frequency: 30,
    level: PerformanceLevel.Medium
  };
}

function getDefaultMetrics(): PerformanceMetrics {
  return {
    current_fps: 60,
    target_fps: 60,
    frame_time_ms: 16.67,
    agent_count: 0,
    memory_usage_mb: 0,
    gpu_utilization: 0,
    cpu_utilization: 0
  };
}

function createProfileForLevel(level: PerformanceLevel): PerformanceProfile {
  switch (level) {
    case PerformanceLevel.UltraLow:
      return {
        target_fps: 15,
        max_agents: 500,
        render_distance: 200.0,
        update_frequency: 10,
        level
      };
    case PerformanceLevel.Low:
      return {
        target_fps: 30,
        max_agents: 2000,
        render_distance: 400.0,
        update_frequency: 15,
        level
      };
    case PerformanceLevel.Medium:
      return {
        target_fps: 60,
        max_agents: 5000,
        render_distance: 600.0,
        update_frequency: 30,
        level
      };
    case PerformanceLevel.High:
      return {
        target_fps: 120,
        max_agents: 15000,
        render_distance: 800.0,
        update_frequency: 60,
        level
      };
    case PerformanceLevel.Ultra:
      return {
        target_fps: 240,
        max_agents: 50000,
        render_distance: 1000.0,
        update_frequency: 120,
        level
      };
    default:
      return getDefaultProfile();
  }
}