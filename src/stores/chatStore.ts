import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { Chat, Message } from '../types';
import { storage } from '../utils/storage';

interface ChatState {
  chats: Chat[];
  activeChatId: string | null;
  isGenerating: boolean;
  abortController: AbortController | null;

  // Chat operations
  createChat: (systemPrompt?: string) => string;
  deleteChat: (id: string) => void;
  renameChat: (id: string, title: string) => void;
  setActiveChat: (id: string | null) => void;
  updateChatSystemPrompt: (id: string, prompt: string) => void;

  // Message operations
  addMessage: (chatId: string, role: Message['role'], content: string) => string;
  updateMessage: (chatId: string, messageId: string, content: string) => void;
  appendToMessage: (chatId: string, messageId: string, content: string) => void;
  appendReasoningToMessage: (chatId: string, messageId: string, reasoning: string) => void;
  deleteMessage: (chatId: string, messageId: string) => void;

  // Generation control
  setGenerating: (isGenerating: boolean, controller?: AbortController | null) => void;
  stopGeneration: () => void;

  // Helpers
  getActiveChat: () => Chat | null;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: storage.getChats(),
  activeChatId: null,
  isGenerating: false,
  abortController: null,

  createChat: (systemPrompt = '') => {
    const id = nanoid();
    const now = Date.now();
    const newChat: Chat = {
      id,
      title: 'New Chat',
      messages: [],
      systemPrompt,
      createdAt: now,
      updatedAt: now,
    };
    const chats = [newChat, ...get().chats];
    storage.saveChats(chats);
    set({ chats, activeChatId: id });
    return id;
  },

  deleteChat: (id) => {
    const chats = get().chats.filter((c) => c.id !== id);
    storage.saveChats(chats);
    const activeChatId = get().activeChatId === id ? null : get().activeChatId;
    set({ chats, activeChatId });
  },

  renameChat: (id, title) => {
    const chats = get().chats.map((c) =>
      c.id === id ? { ...c, title, updatedAt: Date.now() } : c
    );
    storage.saveChats(chats);
    set({ chats });
  },

  setActiveChat: (id) => {
    set({ activeChatId: id });
  },

  updateChatSystemPrompt: (id, prompt) => {
    const chats = get().chats.map((c) =>
      c.id === id ? { ...c, systemPrompt: prompt, updatedAt: Date.now() } : c
    );
    storage.saveChats(chats);
    set({ chats });
  },

  addMessage: (chatId, role, content) => {
    const messageId = nanoid();
    const message: Message = {
      id: messageId,
      role,
      content,
      timestamp: Date.now(),
    };
    const chats = get().chats.map((c) => {
      if (c.id !== chatId) return c;
      const messages = [...c.messages, message];
      // Auto-title from first user message
      const title =
        c.title === 'New Chat' && role === 'user'
          ? content.slice(0, 30) + (content.length > 30 ? '...' : '')
          : c.title;
      return { ...c, messages, title, updatedAt: Date.now() };
    });
    storage.saveChats(chats);
    set({ chats });
    return messageId;
  },

  updateMessage: (chatId, messageId, content) => {
    const chats = get().chats.map((c) => {
      if (c.id !== chatId) return c;
      const messages = c.messages.map((m) =>
        m.id === messageId ? { ...m, content } : m
      );
      return { ...c, messages, updatedAt: Date.now() };
    });
    storage.saveChats(chats);
    set({ chats });
  },

  appendToMessage: (chatId, messageId, content) => {
    const chats = get().chats.map((c) => {
      if (c.id !== chatId) return c;
      const messages = c.messages.map((m) =>
        m.id === messageId ? { ...m, content: m.content + content } : m
      );
      return { ...c, messages, updatedAt: Date.now() };
    });
    // Don't save to storage on every append for performance
    set({ chats });
  },

  appendReasoningToMessage: (chatId, messageId, reasoning) => {
    const chats = get().chats.map((c) => {
      if (c.id !== chatId) return c;
      const messages = c.messages.map((m) =>
        m.id === messageId ? { ...m, reasoning: (m.reasoning || '') + reasoning } : m
      );
      return { ...c, messages, updatedAt: Date.now() };
    });
    // Don't save to storage on every append for performance
    set({ chats });
  },

  deleteMessage: (chatId, messageId) => {
    const chats = get().chats.map((c) => {
      if (c.id !== chatId) return c;
      const messages = c.messages.filter((m) => m.id !== messageId);
      return { ...c, messages, updatedAt: Date.now() };
    });
    storage.saveChats(chats);
    set({ chats });
  },

  setGenerating: (isGenerating, controller = null) => {
    set({ isGenerating, abortController: controller });
  },

  stopGeneration: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
    }
    set({ isGenerating: false, abortController: null });
    // Save current state to storage
    storage.saveChats(get().chats);
  },

  getActiveChat: () => {
    const { chats, activeChatId } = get();
    return chats.find((c) => c.id === activeChatId) ?? null;
  },
}));
