import { create } from 'zustand';
import { Settings } from '../types';
import { storage } from '../utils/storage';

const DEFAULT_SETTINGS: Settings = {
  endpoint: 'http://localhost:8000',
  model: '',
  temperature: 0.7,
  maxTokens: 2048,
  theme: 'system',
};

interface SettingsState {
  settings: Settings;
  setSettings: (settings: Partial<Settings>) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: storage.getSettings() ?? DEFAULT_SETTINGS,

  setSettings: (newSettings) => {
    const updated = { ...get().settings, ...newSettings };
    storage.saveSettings(updated);
    set({ settings: updated });
  },

  resetSettings: () => {
    storage.saveSettings(DEFAULT_SETTINGS);
    set({ settings: DEFAULT_SETTINGS });
  },
}));
