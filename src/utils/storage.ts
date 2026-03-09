import { Chat, Settings } from '../types';

const CHATS_KEY = 'self-llm-chat-history';
const SETTINGS_KEY = 'self-llm-chat-settings';

// Migration: move data from old keys to new keys (one-time)
const OLD_CHATS_KEY = 'vllm-chat-history';
const OLD_SETTINGS_KEY = 'vllm-chat-settings';

function migrateOldKeys(): void {
  try {
    // Migrate chats
    const oldChats = localStorage.getItem(OLD_CHATS_KEY);
    if (oldChats && !localStorage.getItem(CHATS_KEY)) {
      localStorage.setItem(CHATS_KEY, oldChats);
      localStorage.removeItem(OLD_CHATS_KEY);
    }
    // Migrate settings
    const oldSettings = localStorage.getItem(OLD_SETTINGS_KEY);
    if (oldSettings && !localStorage.getItem(SETTINGS_KEY)) {
      localStorage.setItem(SETTINGS_KEY, oldSettings);
      localStorage.removeItem(OLD_SETTINGS_KEY);
    }
  } catch {
    // Ignore migration errors
  }
}

// Run migration on module load
migrateOldKeys();

export const storage = {
  getChats(): Chat[] {
    try {
      const data = localStorage.getItem(CHATS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveChats(chats: Chat[]): void {
    try {
      localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
    } catch (e) {
      console.error('Failed to save chats:', e);
    }
  },

  getSettings(): Settings | null {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  saveSettings(settings: Settings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  },

  getStorageSize(): number {
    let total = 0;
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        total += localStorage[key].length * 2; // UTF-16 = 2 bytes per char
      }
    }
    return total;
  }
};
