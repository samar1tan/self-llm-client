import { useEffect, useRef, useState, useCallback } from 'react';
import { Message } from '../types';
import { MessageItem } from './MessageItem';
import { ArrowDown } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  onRegenerate: () => void;
  isGenerating: boolean;
}

export function MessageList({ messages, onRegenerate, isGenerating }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [userScrolled, setUserScrolled] = useState(false);

  // Filter out system messages for display
  const displayMessages = messages.filter((m) => m.role !== 'system');

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior });
    setUserScrolled(false);
  }, []);

  // Handle scroll events to show/hide scroll-to-bottom button
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    // Show button if user is more than 200px from bottom
    setShowScrollButton(distanceFromBottom > 200);
    
    // Track if user manually scrolled up
    if (distanceFromBottom > 50) {
      setUserScrolled(true);
    }
  }, []);

  // Auto-scroll to bottom on new messages, unless user scrolled up
  useEffect(() => {
    if (!userScrolled) {
      scrollToBottom('smooth');
    }
  }, [messages, userScrolled, scrollToBottom]);

  if (displayMessages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">vLLM Chat</h2>
          <p className="text-sm">Start a conversation with your local LLM</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto relative"
      onScroll={handleScroll}
      style={{ contain: 'layout style' }}
    >
      <div style={{ contain: 'content' }}>
        {displayMessages.map((message, index) => (
          <MessageItem
            key={message.id}
            message={message}
            isLast={index === displayMessages.length - 1}
            onRegenerate={onRegenerate}
            isGenerating={isGenerating}
          />
        ))}
        <div ref={bottomRef} className="h-4" />
      </div>
      
      {/* Scroll to bottom button - sticky to bottom of scroll container */}
      {showScrollButton && (
        <button
          onClick={() => scrollToBottom('smooth')}
          className="sticky bottom-6 float-right mr-6 p-3 bg-zinc-700 dark:bg-zinc-600 text-white rounded-full shadow-lg hover:bg-zinc-600 dark:hover:bg-zinc-500 transition-all z-50 animate-fade-in"
          title="Scroll to bottom"
        >
          <ArrowDown size={20} />
        </button>
      )}
    </div>
  );
}
