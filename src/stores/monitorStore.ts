import { create } from 'zustand';
import { GpuMetrics, VllmStats, MonitorSettings, MetricHistoryPoint } from '../types';

// History window: 5 minutes at 2s polling = 150 data points
const MAX_HISTORY_POINTS = 150;

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
  
  // History for charts
  history: MetricHistoryPoint[];

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

const MONITOR_SETTINGS_KEY = 'self-llm-monitor-settings';
const MONITOR_PANEL_KEY = 'self-llm-monitor-panel-open';

// Migration from old keys (one-time)
const OLD_SETTINGS_KEY = 'vllm-monitor-settings';
const OLD_PANEL_KEY = 'vllm-monitor-panel-open';

function migrateOldMonitorKeys(): void {
  try {
    const oldSettings = localStorage.getItem(OLD_SETTINGS_KEY);
    if (oldSettings && !localStorage.getItem(MONITOR_SETTINGS_KEY)) {
      localStorage.setItem(MONITOR_SETTINGS_KEY, oldSettings);
      localStorage.removeItem(OLD_SETTINGS_KEY);
    }
    const oldPanel = localStorage.getItem(OLD_PANEL_KEY);
    if (oldPanel && !localStorage.getItem(MONITOR_PANEL_KEY)) {
      localStorage.setItem(MONITOR_PANEL_KEY, oldPanel);
      localStorage.removeItem(OLD_PANEL_KEY);
    }
  } catch {
    // Ignore migration errors
  }
}
migrateOldMonitorKeys();

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
  history: [],

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
    const now = Date.now();
    const currentHistory = get().history;
    
    // Append new data point to history if we have metrics
    let newHistory = currentHistory;
    if (metrics) {
      const newPoint: MetricHistoryPoint = {
        timestamp: now,
        gfx: metrics.utilization.gfx,
        memory: metrics.utilization.memory,
        vram: metrics.vram.used,
        vramTotal: metrics.vram.total,
        temp: metrics.sensors.temperature,
        power: metrics.sensors.power,
        fan: metrics.sensors.fanSpeed,
      };
      
      // Sliding window: keep only last MAX_HISTORY_POINTS
      newHistory = [...currentHistory, newPoint].slice(-MAX_HISTORY_POINTS);
    }
    
    set({ 
      gpu: metrics, 
      lastUpdate: metrics ? now : get().lastUpdate,
      connected: metrics !== null,
      error: metrics ? null : get().error,
      history: newHistory,
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
      history: [],
    });
  },
}));
