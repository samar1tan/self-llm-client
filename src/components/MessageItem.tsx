import { User, Bot, Copy, Check, RefreshCw, ChevronDown, Code, Timer, Zap } from 'lucide-react';
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
  const [httpRequestExpanded, setHttpRequestExpanded] = useState(false);
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
          {/* HTTP Request Block (collapsible) - shown first */}
          {!isUser && message.httpRequest && (
            <details
              className="mb-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
              open={httpRequestExpanded}
              onToggle={(e) => setHttpRequestExpanded((e.target as HTMLDetailsElement).open)}
            >
              <summary className="px-3 py-2 cursor-pointer select-none text-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors">
                <ChevronDown
                  size={16}
                  className={`transition-transform ${httpRequestExpanded ? 'rotate-0' : '-rotate-90'}`}
                />
                <Code size={14} />
                <span>HTTP Request</span>
                <span className="ml-auto text-xs font-mono text-zinc-500">
                  {message.httpRequest.method} {new URL(message.httpRequest.url).pathname}
                </span>
              </summary>
              <div className="px-3 py-2 text-sm border-t border-zinc-200 dark:border-zinc-700 font-mono">
                <div className="space-y-2">
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">URL: </span>
                    <span className="text-zinc-700 dark:text-zinc-300 break-all">{message.httpRequest.url}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">Method: </span>
                    <span className="text-zinc-700 dark:text-zinc-300">{message.httpRequest.method}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">Headers:</span>
                    <pre className="mt-1 p-2 bg-zinc-200 dark:bg-zinc-900 rounded text-xs overflow-x-auto">
                      {JSON.stringify(message.httpRequest.headers, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">Body:</span>
                    <pre className="mt-1 p-2 bg-zinc-200 dark:bg-zinc-900 rounded text-xs overflow-x-auto max-h-64 overflow-y-auto">
                      {JSON.stringify(message.httpRequest.body, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </details>
          )}

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
                <span>{isStreaming && !message.content ? 'Thinking...' : 'Thought'}</span>
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

          {/* Response Metrics */}
          {!isUser && message.metrics && !isStreaming && (
            <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500 dark:text-zinc-400">
              <div className="flex items-center gap-1" title="Prompt / Completion / Total Tokens">
                <span className="font-medium">{message.metrics.promptTokens}</span>
                <span className="text-zinc-400">/</span>
                <span className="font-medium">{message.metrics.completionTokens}</span>
                <span className="text-zinc-400">/</span>
                <span className="font-medium">{message.metrics.totalTokens}</span>
                <span>tokens</span>
              </div>
              <div className="flex items-center gap-1" title="Generation Speed">
                <Zap size={12} />
                <span className="font-medium">{message.metrics.tokensPerSecond}</span>
                <span>tok/s</span>
              </div>
              <div className="flex items-center gap-1" title="Total Duration">
                <Timer size={12} />
                <span className="font-medium">{(message.metrics.durationMs / 1000).toFixed(1)}</span>
                <span>s</span>
              </div>
              <div className="flex items-center gap-1" title="Time to First Token">
                <span className="text-zinc-400 dark:text-zinc-500">TTFT:</span>
                <span className="font-medium">{message.metrics.firstTokenLatencyMs}</span>
                <span>ms</span>
              </div>
            </div>
          )}

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
