import { create } from 'zustand';
import { GpuMetrics, VllmStats, MonitorSettings } from '../types';

const DEFAULT_MONITOR_SETTINGS: MonitorSettings = {
  enabled: true,
  endpoint: 'http://localhost:5678',
  pollingInterval: 2000,
};

interface MonitorState {
  // Settings
  settings: MonitorSettings;
  
  // Runtime state
  panelOpen: boolean;
  gpu: GpuMetrics | null;
  vllm: VllmStats | null;
  connected: boolean;
  error: string | null;
  lastUpdate: number | null;

  // Actions
  setSettings: (settings: Partial<MonitorSettings>) => void;
  setPanelOpen: (open: boolean) => void;
  togglePanel: () => void;
  setGpuMetrics: (metrics: GpuMetrics | null) => void;
  setVllmStats: (stats: VllmStats | null) => void;
  setConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const MONITOR_SETTINGS_KEY = 'vllm-monitor-settings';
const MONITOR_PANEL_KEY = 'vllm-monitor-panel-open';

function loadSettings(): MonitorSettings {
  try {
    const data = localStorage.getItem(MONITOR_SETTINGS_KEY);
    return data ? { ...DEFAULT_MONITOR_SETTINGS, ...JSON.parse(data) } : DEFAULT_MONITOR_SETTINGS;
  } catch {
    return DEFAULT_MONITOR_SETTINGS;
  }
}

function saveSettings(settings: MonitorSettings): void {
  try {
    localStorage.setItem(MONITOR_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save monitor settings:', e);
  }
}

function loadPanelState(): boolean {
  try {
    const data = localStorage.getItem(MONITOR_PANEL_KEY);
    return data === 'true';
  } catch {
    return false;
  }
}

function savePanelState(open: boolean): void {
  try {
    localStorage.setItem(MONITOR_PANEL_KEY, String(open));
  } catch (e) {
    console.error('Failed to save panel state:', e);
  }
}

export const useMonitorStore = create<MonitorState>((set, get) => ({
  settings: loadSettings(),
  panelOpen: loadPanelState(),
  gpu: null,
  vllm: null,
  connected: false,
  error: null,
  lastUpdate: null,

  setSettings: (newSettings) => {
    const updated = { ...get().settings, ...newSettings };
    saveSettings(updated);
    set({ settings: updated });
  },

  setPanelOpen: (open) => {
    savePanelState(open);
    set({ panelOpen: open });
  },

  togglePanel: () => {
    const newState = !get().panelOpen;
    savePanelState(newState);
    set({ panelOpen: newState });
  },

  setGpuMetrics: (metrics) => {
    set({ 
      gpu: metrics, 
      lastUpdate: metrics ? Date.now() : get().lastUpdate,
      connected: metrics !== null,
      error: metrics ? null : get().error,
    });
  },

  setVllmStats: (stats) => {
    set({ vllm: stats });
  },

  setConnected: (connected) => {
    set({ connected });
  },

  setError: (error) => {
    set({ error, connected: false });
  },

  reset: () => {
    set({
      gpu: null,
      vllm: null,
      connected: false,
      error: null,
      lastUpdate: null,
    });
  },
}));
