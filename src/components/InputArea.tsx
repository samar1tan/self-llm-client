import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, Square } from 'lucide-react';

interface InputAreaProps {
  onSend: (message: string) => void;
  onStop: () => void;
  isGenerating: boolean;
  disabled: boolean;
}

export function InputArea({ onSend, onStop, isGenerating, disabled }: InputAreaProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (trimmed && !isGenerating && !disabled) {
      onSend(trimmed);
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-zinc-200 dark:border-zinc-700 bg-white dark:bg-chat-bg-dark p-4">
      <div className="max-w-3xl mx-auto">
        <div className="relative flex items-end bg-white dark:bg-input-bg-dark border border-zinc-300 dark:border-zinc-600 rounded-xl shadow-sm">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? 'Configure endpoint in settings...' : 'Send a message...'}
            disabled={disabled}
            rows={1}
            className="flex-1 max-h-[200px] px-4 py-3 bg-transparent resize-none focus:outline-none text-zinc-900 dark:text-white placeholder-zinc-500 disabled:opacity-50"
          />
          <div className="p-2">
            {isGenerating ? (
              <button
                onClick={onStop}
                className="p-2 rounded-lg bg-zinc-200 dark:bg-zinc-600 hover:bg-zinc-300 dark:hover:bg-zinc-500 transition-colors"
                title="Stop generating"
              >
                <Square size={18} className="text-zinc-700 dark:text-white" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!input.trim() || disabled}
                className="p-2 rounded-lg bg-zinc-800 dark:bg-zinc-100 hover:bg-zinc-700 dark:hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Send message"
              >
                <Send size={18} className="text-white dark:text-zinc-900" />
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-center mt-2 text-zinc-500">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
