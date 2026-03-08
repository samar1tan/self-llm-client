import { useEffect, useRef } from 'react';
import { Message } from '../types';
import { MessageItem } from './MessageItem';

interface MessageListProps {
  messages: Message[];
  onRegenerate: () => void;
  isGenerating: boolean;
}

export function MessageList({ messages, onRegenerate, isGenerating }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Filter out system messages for display
  const displayMessages = messages.filter((m) => m.role !== 'system');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    <div className="flex-1 overflow-y-auto">
      {displayMessages.map((message, index) => (
        <MessageItem
          key={message.id}
          message={message}
          isLast={index === displayMessages.length - 1}
          onRegenerate={onRegenerate}
          isGenerating={isGenerating}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
