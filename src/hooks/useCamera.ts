import { useState, useEffect, useCallback, useRef } from 'react';

export interface CameraState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

export interface CameraControls {
  enableGyroscope: boolean;
  enableVR: boolean;
  followTarget: string | null;
  smoothTransitions: boolean;
}

export interface FollowTarget {
  id: string;
  position: [number, number, number];
  type: 'agent' | 'vehicle' | 'aircraft';
}

interface DeviceMotionState {
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
  supported: boolean;
  permissionGranted: boolean;
}

export function useCamera(initialState: CameraState) {
  const [viewState, setViewState] = useState<CameraState>(initialState);
  const [controls, setControls] = useState<CameraControls>({
    enableGyroscope: false,
    enableVR: false,
    followTarget: null,
    smoothTransitions: true
  });

  const [deviceMotion, setDeviceMotion] = useState<DeviceMotionState>({
    alpha: null,
    beta: null,
    gamma: null,
    supported: false,
    permissionGranted: false
  });

  const [followTargets, setFollowTargets] = useState<Map<string, FollowTarget>>(new Map());
  const animationFrameRef = useRef<number>();
  const baseViewState = useRef<CameraState>(initialState);

  // Detect device capabilities
  useEffect(() => {
    const hasDeviceMotion = 'DeviceMotionEvent' in window;
    const hasVR = 'xr' in navigator;

    setDeviceMotion(prev => ({
      ...prev,
      supported: hasDeviceMotion
    }));

    // Auto-enable gyroscope on mobile devices if supported
    if (hasDeviceMotion && /Mobile|Android|iOS/.test(navigator.userAgent)) {
      requestGyroscopePermission();
    }
  }, []);

  const requestGyroscopePermission = useCallback(async () => {
    if (!deviceMotion.supported) return false;

    try {
      // For iOS 13+ devices
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        const granted = permission === 'granted';

        setDeviceMotion(prev => ({ ...prev, permissionGranted: granted }));

        if (granted) {
          setControls(prev => ({ ...prev, enableGyroscope: true }));
        }

        return granted;
      } else {
        // For non-iOS devices
        setDeviceMotion(prev => ({ ...prev, permissionGranted: true }));
        setControls(prev => ({ ...prev, enableGyroscope: true }));
        return true;
      }
    } catch (error) {
      console.warn('Gyroscope permission denied:', error);
      return false;
    }
  }, [deviceMotion.supported]);

  const requestVRSession = useCallback(async () => {
    if (!('xr' in navigator)) {
      console.warn('WebXR not supported');
      return false;
    }

    try {
      const isSupported = await (navigator as any).xr.isSessionSupported('immersive-vr');
      if (!isSupported) {
        console.warn('VR not supported');
        return false;
      }

      const session = await (navigator as any).xr.requestSession('immersive-vr');
      setControls(prev => ({ ...prev, enableVR: true }));

      // Handle VR session events
      session.addEventListener('end', () => {
        setControls(prev => ({ ...prev, enableVR: false }));
      });

      return true;
    } catch (error) {
      console.warn('VR session request failed:', error);
      return false;
    }
  }, []);

  // Device motion handler
  useEffect(() => {
    if (!controls.enableGyroscope || !deviceMotion.permissionGranted) {
      return;
    }

    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      if (event.rotationRate) {
        setDeviceMotion(prev => ({
          ...prev,
          alpha: event.rotationRate!.alpha,
          beta: event.rotationRate!.beta,
          gamma: event.rotationRate!.gamma
        }));

        // Convert device orientation to camera rotation
        if (event.rotationRate.alpha !== null && event.rotationRate.beta !== null) {
          setViewState(prev => ({
            ...prev,
            bearing: prev.bearing + (event.rotationRate!.alpha || 0) * 0.1,
            pitch: Math.max(0, Math.min(60, prev.pitch + (event.rotationRate!.beta || 0) * 0.1))
          }));
        }
      }
    };

    window.addEventListener('devicemotion', handleDeviceMotion);
    return () => window.removeEventListener('devicemotion', handleDeviceMotion);
  }, [controls.enableGyroscope, deviceMotion.permissionGranted]);

  // Follow target animation
  useEffect(() => {
    if (!controls.followTarget) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const target = followTargets.get(controls.followTarget);
    if (!target) return;

    const animateFollow = () => {
      const [x, y, z] = target.position;

      // Convert world coordinates to lat/lng (rough approximation)
      const targetLongitude = x / 111320;
      const targetLatitude = y / 110540;

      // Smooth camera movement toward target
      setViewState(prev => {
        const lerpFactor = 0.05; // Smooth following

        return {
          ...prev,
          longitude: prev.longitude + (targetLongitude - prev.longitude) * lerpFactor,
          latitude: prev.latitude + (targetLatitude - prev.latitude) * lerpFactor,
          // Adjust zoom based on target type and elevation
          zoom: target.type === 'aircraft' ? 12 : target.type === 'vehicle' ? 16 : 18,
          // Adjust pitch to look down at target
          pitch: z > 50 ? 60 : 45
        };
      });

      animationFrameRef.current = requestAnimationFrame(animateFollow);
    };

    animateFollow();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [controls.followTarget, followTargets]);

  const updateFollowTarget = useCallback((id: string, position: [number, number, number], type: 'agent' | 'vehicle' | 'aircraft') => {
    setFollowTargets(prev => new Map(prev.set(id, { id, position, type })));
  }, []);

  const startFollowing = useCallback((targetId: string) => {
    setControls(prev => ({ ...prev, followTarget: targetId }));
    baseViewState.current = viewState;
  }, [viewState]);

  const stopFollowing = useCallback(() => {
    setControls(prev => ({ ...prev, followTarget: null }));
  }, []);

  const toggleGyroscope = useCallback(async () => {
    if (!controls.enableGyroscope) {
      const granted = await requestGyroscopePermission();
      if (!granted) return false;
    } else {
      setControls(prev => ({ ...prev, enableGyroscope: false }));
    }
    return true;
  }, [controls.enableGyroscope, requestGyroscopePermission]);

  const toggleVR = useCallback(async () => {
    if (!controls.enableVR) {
      const success = await requestVRSession();
      return success;
    } else {
      setControls(prev => ({ ...prev, enableVR: false }));
      return true;
    }
  }, [controls.enableVR, requestVRSession]);

  const smoothTransitionTo = useCallback((targetState: Partial<CameraState>, duration: number = 1000) => {
    if (!controls.smoothTransitions) {
      setViewState(prev => ({ ...prev, ...targetState }));
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      const startTime = Date.now();
      const initialState = viewState;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function (ease-out cubic)
        const eased = 1 - Math.pow(1 - progress, 3);

        setViewState(prev => {
          const newState: CameraState = { ...prev };

          Object.entries(targetState).forEach(([key, value]) => {
            if (value !== undefined && key in initialState) {
              const startValue = initialState[key as keyof CameraState];
              const diff = value - startValue;
              (newState as any)[key] = startValue + diff * eased;
            }
          });

          return newState;
        });

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      animate();
    });
  }, [viewState, controls.smoothTransitions]);

  // Preset camera positions
  const presets = {
    overview: () => smoothTransitionTo({ zoom: 12, pitch: 45, bearing: 0 }),
    street: () => smoothTransitionTo({ zoom: 18, pitch: 0, bearing: 0 }),
    aerial: () => smoothTransitionTo({ zoom: 10, pitch: 75, bearing: 0 }),
    underground: () => smoothTransitionTo({ zoom: 16, pitch: 60, bearing: 0 }),
    isometric: () => smoothTransitionTo({ zoom: 14, pitch: 45, bearing: 45 })
  };

  return {
    viewState,
    setViewState,
    controls,
    setControls,
    deviceMotion,
    followTargets,
    updateFollowTarget,
    startFollowing,
    stopFollowing,
    toggleGyroscope,
    toggleVR,
    smoothTransitionTo,
    presets,
    capabilities: {
      hasGyroscope: deviceMotion.supported,
      hasVR: 'xr' in navigator,
      gyroscopeEnabled: controls.enableGyroscope && deviceMotion.permissionGranted,
      vrEnabled: controls.enableVR
    }
  };
}