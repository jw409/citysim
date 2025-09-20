/**
 * Centralized z-index management for the application
 * This ensures consistent layering and prevents z-index conflicts
 */

export const Z_INDEX = {
  // Base layer
  BASE: 0,

  // Main application layers
  APP_CONTENT: 1,
  SIDEBAR: 999,

  // Floating panels (draggable panels should be above main content)
  PANEL_BASE: 1000,
  TERRAIN_PANEL: 1000,
  CAMERA_PANEL: 1001,
  TIME_PANEL: 1002,
  PERFORMANCE_PANEL: 1003,

  // Active/focused panel gets higher z-index
  ACTIVE_PANEL: 1100,

  // UI overlays
  LOADING_SCREEN: 9990,
  ERROR_OVERLAY: 9995,

  // Status bar (always on top)
  STATUS_BAR: 9998,

  // Modals and critical overlays
  MODAL: 10000,
  TOOLTIP: 10001,

  // Emergency/debug overlays (highest priority)
  DEBUG: 99999,
} as const;

/**
 * Panel types for z-index management
 */
export type PanelType = 'terrain' | 'camera' | 'time' | 'performance';

/**
 * Get the z-index for a specific panel type
 */
export function getPanelZIndex(panelType: PanelType, isActive = false): number {
  if (isActive) {
    return Z_INDEX.ACTIVE_PANEL;
  }

  switch (panelType) {
    case 'terrain':
      return Z_INDEX.TERRAIN_PANEL;
    case 'camera':
      return Z_INDEX.CAMERA_PANEL;
    case 'time':
      return Z_INDEX.TIME_PANEL;
    case 'performance':
      return Z_INDEX.PERFORMANCE_PANEL;
    default:
      return Z_INDEX.PANEL_BASE;
  }
}

/**
 * Panel z-index state management
 */
class PanelZIndexManager {
  private activePanelId: string | null = null;
  private listeners: ((activePanelId: string | null) => void)[] = [];

  setActivePanel(panelId: string | null) {
    this.activePanelId = panelId;
    this.notifyListeners();
  }

  getActivePanel(): string | null {
    return this.activePanelId;
  }

  subscribe(listener: (activePanelId: string | null) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.activePanelId));
  }
}

export const panelZIndexManager = new PanelZIndexManager();