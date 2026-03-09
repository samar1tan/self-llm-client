import { useState, useEffect } from 'react';
import { X, Sun, Moon, Monitor, RefreshCw, CheckCircle2, XCircle, Activity } from 'lucide-react';
import { useSettingsStore } from '../stores/settingsStore';
import { useChatStore } from '../stores/chatStore';
import { useMonitorStore } from '../stores/monitorStore';
import { fetchModels, checkEndpointHealth } from '../services/api';
import { checkMonitorHealth } from '../services/monitor';
import { Model } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, setSettings } = useSettingsStore();
  const { activeChatId, updateChatSystemPrompt, chats } = useChatStore();
  const { settings: monitorSettings, setSettings: setMonitorSettings } = useMonitorStore();

  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);
  const [endpointStatus, setEndpointStatus] = useState<'unknown' | 'healthy' | 'error'>(
    'unknown'
  );
  const [monitorStatus, setMonitorStatus] = useState<'unknown' | 'healthy' | 'error'>('unknown');
  const [systemPrompt, setSystemPrompt] = useState('');

  const activeChat = chats.find((c) => c.id === activeChatId);

  useEffect(() => {
    if (activeChat) {
      setSystemPrompt(activeChat.systemPrompt);
    }
  }, [activeChat]);

  useEffect(() => {
    if (isOpen) {
      loadModels();
    }
  }, [isOpen, settings.endpoint]);

  const loadModels = async () => {
    setLoading(true);
    setEndpointStatus('unknown');

    const healthy = await checkEndpointHealth(settings.endpoint);
    setEndpointStatus(healthy ? 'healthy' : 'error');

    if (healthy) {
      const modelList = await fetchModels(settings.endpoint);
      setModels(modelList);

      // Auto-select first model if none selected
      if (!settings.model && modelList.length > 0) {
        setSettings({ model: modelList[0].id });
      }
    } else {
      setModels([]);
    }

    setLoading(false);
  };

  const handleSystemPromptSave = () => {
    if (activeChatId) {
      updateChatSystemPrompt(activeChatId, systemPrompt);
    }
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    setSettings({ theme });

    // Apply theme
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
          >
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Endpoint */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              API Endpoint
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={settings.endpoint}
                  onChange={(e) => setSettings({ endpoint: e.target.value })}
                  placeholder="http://localhost:8000"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {endpointStatus === 'healthy' && (
                    <CheckCircle2 size={18} className="text-green-500" />
                  )}
                  {endpointStatus === 'error' && (
                    <XCircle size={18} className="text-red-500" />
                  )}
                </div>
              </div>
              <button
                onClick={loadModels}
                disabled={loading}
                className="px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Model
            </label>
            <select
              value={settings.model}
              onChange={(e) => setSettings({ model: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a model...</option>
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.id}
                </option>
              ))}
            </select>
            {models.length === 0 && !loading && (
              <p className="mt-1 text-sm text-zinc-500">
                No models found. Check your endpoint.
              </p>
            )}
          </div>

          {/* Temperature */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Temperature: {settings.temperature}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={settings.temperature}
              onChange={(e) => setSettings({ temperature: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-zinc-500 mt-1">
              <span>Precise</span>
              <span>Creative</span>
            </div>
          </div>

          {/* Max Tokens */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Max Tokens
            </label>
            <input
              type="number"
              min="1"
              max="32000"
              value={settings.maxTokens}
              onChange={(e) => setSettings({ maxTokens: parseInt(e.target.value) || 2048 })}
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* System Prompt */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              System Prompt {activeChatId ? '(current chat)' : ''}
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              onBlur={handleSystemPromptSave}
              placeholder="You are a helpful assistant..."
              rows={4}
              disabled={!activeChatId}
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:opacity-50"
            />
            {!activeChatId && (
              <p className="mt-1 text-sm text-zinc-500">
                Create a chat to set system prompt
              </p>
            )}
          </div>

          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Theme
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => handleThemeChange('light')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                  settings.theme === 'light'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                    : 'border-zinc-300 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                }`}
              >
                <Sun size={18} />
                Light
              </button>
              <button
                onClick={() => handleThemeChange('dark')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                  settings.theme === 'dark'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                    : 'border-zinc-300 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                }`}
              >
                <Moon size={18} />
                Dark
              </button>
              <button
                onClick={() => handleThemeChange('system')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                  settings.theme === 'system'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                    : 'border-zinc-300 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                }`}
              >
                <Monitor size={18} />
                System
              </button>
            </div>
          </div>

          {/* GPU Monitor */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-zinc-500" />
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  GPU Monitor
                </label>
              </div>
              <button
                onClick={() => setMonitorSettings({ enabled: !monitorSettings.enabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  monitorSettings.enabled ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    monitorSettings.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {monitorSettings.enabled && (
              <div className="space-y-4">
                {/* Monitor Endpoint */}
                <div>
                  <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                    Monitor Server Endpoint
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={monitorSettings.endpoint}
                        onChange={(e) => setMonitorSettings({ endpoint: e.target.value })}
                        placeholder="http://localhost:5678"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {monitorStatus === 'healthy' && (
                          <CheckCircle2 size={16} className="text-green-500" />
                        )}
                        {monitorStatus === 'error' && (
                          <XCircle size={16} className="text-red-500" />
                        )}
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        setMonitorStatus('unknown');
                        const healthy = await checkMonitorHealth(monitorSettings.endpoint);
                        setMonitorStatus(healthy ? 'healthy' : 'error');
                      }}
                      className="px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors"
                    >
                      <RefreshCw size={16} />
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">
                    Run: python3 tools/gpu-monitor-server.py
                  </p>
                </div>

                {/* Polling Interval */}
                <div>
                  <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                    Polling Interval: {monitorSettings.pollingInterval / 1000}s
                  </label>
                  <input
                    type="range"
                    min="1000"
                    max="10000"
                    step="1000"
                    value={monitorSettings.pollingInterval}
                    onChange={(e) => setMonitorSettings({ pollingInterval: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-zinc-500 mt-1">
                    <span>1s</span>
                    <span>10s</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
