import { Chat, Settings } from '../types';

const CHATS_KEY = 'vllm-chat-history';
const SETTINGS_KEY = 'vllm-chat-settings';

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
