import { User, Bot, Copy, Check, RefreshCw, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Message } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface MessageItemProps {
  message: Message;
  isLast: boolean;
  onRegenerate?: () => void;
  isGenerating?: boolean;
}

export function MessageItem({ message, isLast, onRegenerate, isGenerating }: MessageItemProps) {
  const [copied, setCopied] = useState(false);
  const [reasoningExpanded, setReasoningExpanded] = useState(false);
  const isUser = message.role === 'user';
  const isStreaming = isGenerating && isLast && !isUser;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`py-6 ${
        isUser
          ? 'bg-white dark:bg-chat-bg-dark'
          : 'bg-zinc-50 dark:bg-assistant-msg-dark'
      }`}
    >
      <div className="max-w-3xl mx-auto px-4 flex gap-4">
        {/* Avatar */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-sm flex items-center justify-center ${
            isUser
              ? 'bg-zinc-600 dark:bg-zinc-500'
              : 'bg-emerald-600 dark:bg-emerald-500'
          }`}
        >
          {isUser ? (
            <User size={18} className="text-white" />
          ) : (
            <Bot size={18} className="text-white" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Reasoning Block (collapsible) */}
          {!isUser && message.reasoning && (
            <details
              className="mb-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
              open={reasoningExpanded}
              onToggle={(e) => setReasoningExpanded((e.target as HTMLDetailsElement).open)}
            >
              <summary className="px-3 py-2 cursor-pointer select-none text-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors">
                <ChevronDown
                  size={16}
                  className={`transition-transform ${reasoningExpanded ? 'rotate-0' : '-rotate-90'}`}
                />
                <span>Thinking...</span>
                {isStreaming && (
                  <span className="ml-auto text-xs text-zinc-400">streaming</span>
                )}
              </summary>
              <div className="px-3 py-2 text-sm border-t border-zinc-200 dark:border-zinc-700">
                <div className="prose prose-sm prose-zinc dark:prose-invert max-w-none prose-p:text-zinc-600 dark:prose-p:text-zinc-400 prose-p:my-1 prose-pre:my-2 prose-code:text-zinc-600 dark:prose-code:text-zinc-400">
                  <MarkdownRenderer content={message.reasoning} />
                  {isStreaming && !message.content && (
                    <span className="inline-block w-2 h-4 ml-0.5 bg-zinc-400 dark:bg-zinc-500 animate-cursor" />
                  )}
                </div>
              </div>
            </details>
          )}

          {/* Main Content */}
          <div className="prose prose-zinc dark:prose-invert max-w-none">
            {message.content ? (
              <>
                <MarkdownRenderer content={message.content} />
                {isStreaming && (
                  <span className="inline-block w-2 h-5 ml-0.5 bg-zinc-400 dark:bg-zinc-500 animate-cursor" />
                )}
              </>
            ) : (
              !message.reasoning && (
                <span className="inline-block w-2 h-5 bg-zinc-400 dark:bg-zinc-500 animate-pulse" />
              )
            )}
          </div>

          {/* Actions */}
          {!isUser && message.content && (
            <div className="flex items-center gap-2 mt-3 text-zinc-400">
              <button
                onClick={handleCopy}
                className="p-1 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                title="Copy"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
              {isLast && onRegenerate && !isGenerating && (
                <button
                  onClick={onRegenerate}
                  className="p-1 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                  title="Regenerate"
                >
                  <RefreshCw size={16} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
