import { useState, useCallback } from 'react';

export interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

const INITIAL_VIEW_STATE: ViewState = {
  longitude: 0,
  latitude: 0,
  zoom: 12,
  pitch: 45,
  bearing: 0,
};

export function useViewState(initialViewState: Partial<ViewState> = {}) {
  const [viewState, setViewState] = useState<ViewState>({
    ...INITIAL_VIEW_STATE,
    ...initialViewState,
  });

  const handleViewStateChange = useCallback(({ viewState: newViewState }: { viewState: ViewState }) => {
    setViewState(newViewState);
  }, []);

  const resetView = useCallback(() => {
    setViewState({ ...INITIAL_VIEW_STATE, ...initialViewState });
  }, [initialViewState]);

  const flyTo = useCallback((targetView: Partial<ViewState>, duration: number = 1000) => {
    const startTime = Date.now();
    const startView = { ...viewState };
    const endView = { ...startView, ...targetView };

    function animate() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      const interpolatedView = {
        longitude: startView.longitude + (endView.longitude - startView.longitude) * eased,
        latitude: startView.latitude + (endView.latitude - startView.latitude) * eased,
        zoom: startView.zoom + (endView.zoom - startView.zoom) * eased,
        pitch: startView.pitch + (endView.pitch - startView.pitch) * eased,
        bearing: startView.bearing + (endView.bearing - startView.bearing) * eased,
      };

      setViewState(interpolatedView);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    animate();
  }, [viewState]);

  return {
    viewState,
    setViewState,
    handleViewStateChange,
    resetView,
    flyTo,
  };
}