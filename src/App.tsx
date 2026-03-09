import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { SettingsModal } from './components/SettingsModal';
import { StatusBar } from './components/StatusBar';
import { MonitorPanel } from './components/MonitorPanel';
import { useSettingsStore } from './stores/settingsStore';
import { useChatStore } from './stores/chatStore';
import { AlertCircle, X } from 'lucide-react';

function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { settings } = useSettingsStore();
  const { createChat } = useChatStore();

  // Apply theme on mount
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System preference
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      if (mediaQuery.matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      
      // Listen for system theme changes
      const handler = (e: MediaQueryListEvent) => {
        if (settings.theme === 'system') {
          if (e.matches) {
            root.classList.add('dark');
          } else {
            root.classList.remove('dark');
          }
        }
      };
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [settings.theme]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + N: New chat
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        createChat();
      }
      // Ctrl/Cmd + ,: Open settings
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        setSettingsOpen(true);
      }
      // Escape: Close settings
      if (e.key === 'Escape' && settingsOpen) {
        setSettingsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createChat, settingsOpen]);

  const handleError = useCallback((message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-chat-bg-dark text-zinc-900 dark:text-white">
      {/* Main content area */}
      <div className="flex-1 flex min-h-0">
        <Sidebar onOpenSettings={() => setSettingsOpen(true)} />
        <ChatWindow onError={handleError} />
        <MonitorPanel />
      </div>
      
      {/* Status bar at bottom */}
      <StatusBar />
      
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-14 right-4 z-50 flex items-center gap-3 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg max-w-md animate-in slide-in-from-bottom">
          <AlertCircle size={20} />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="p-1 hover:bg-red-600 rounded">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
