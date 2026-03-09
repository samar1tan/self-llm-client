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
  
  // Track if messages were ever shown (prevents empty state flash-back)
  const hadMessagesRef = useRef(false);
  // Track message count for auto-scroll (not content changes)
  const prevMessageCountRef = useRef(0);
  // RAF handle for throttled scroll
  const rafRef = useRef<number | null>(null);

  // Filter out system messages for display
  const displayMessages = messages.filter((m) => m.role !== 'system');
  
  // Update hadMessages ref
  if (displayMessages.length > 0) {
    hadMessagesRef.current = true;
  }

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    // Use RAF to ensure smooth scrolling synced with paint
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior });
      setUserScrolled(false);
      rafRef.current = null;
    });
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

  // Auto-scroll to bottom only when new messages are added (not on content updates)
  useEffect(() => {
    const currentCount = displayMessages.length;
    const prevCount = prevMessageCountRef.current;
    
    // Only auto-scroll when message count increases
    if (currentCount > prevCount && !userScrolled) {
      scrollToBottom('smooth');
    }
    
    prevMessageCountRef.current = currentCount;
  }, [displayMessages.length, userScrolled, scrollToBottom]);

  // Auto-scroll during streaming for the last message (throttled)
  useEffect(() => {
    if (!isGenerating || userScrolled) return;
    
    // Throttle scroll during streaming to every 100ms max
    const timeoutId = setTimeout(() => {
      scrollToBottom('smooth');
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [messages, isGenerating, userScrolled, scrollToBottom]);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // Show empty state only on initial load, not on flash-back
  if (displayMessages.length === 0 && !hadMessagesRef.current) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Self LLM</h2>
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
      <div>
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
      
      {/* Scroll to bottom button - absolute positioned within container */}
      {showScrollButton && (
        <button
          onClick={() => scrollToBottom('smooth')}
          className="absolute bottom-6 right-6 p-3 bg-zinc-700 dark:bg-zinc-600 text-white rounded-full shadow-lg hover:bg-zinc-600 dark:hover:bg-zinc-500 transition-all z-50 animate-fade-in"
          title="Scroll to bottom"
        >
          <ArrowDown size={20} />
        </button>
      )}
    </div>
  );
}
