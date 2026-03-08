import { useCallback } from 'react';
import { useChatStore } from '../stores/chatStore';
import { useSettingsStore } from '../stores/settingsStore';
import { streamChatCompletion } from '../services/api';
import { MessageList } from './MessageList';
import { InputArea } from './InputArea';
import { storage } from '../utils/storage';

interface ChatWindowProps {
  onError: (message: string) => void;
}

export function ChatWindow({ onError }: ChatWindowProps) {
  const {
    chats,
    activeChatId,
    isGenerating,
    createChat,
    addMessage,
    appendToMessage,
    deleteMessage,
    setGenerating,
    stopGeneration,
  } = useChatStore();

  const { settings } = useSettingsStore();

  const activeChat = chats.find((c) => c.id === activeChatId);

  const handleSend = useCallback(
    async (content: string) => {
      let chatId = activeChatId;

      // Create new chat if none active
      if (!chatId) {
        chatId = createChat(settings.model ? '' : '');
      }

      // Add user message
      addMessage(chatId, 'user', content);

      // Get updated chat
      const chat = useChatStore.getState().chats.find((c) => c.id === chatId);
      if (!chat) return;

      // Add empty assistant message
      const assistantMsgId = addMessage(chatId, 'assistant', '');

      // Create abort controller
      const controller = new AbortController();
      setGenerating(true, controller);

      try {
        await streamChatCompletion(
          settings.endpoint,
          settings.model,
          chat.messages.concat({ id: 'temp', role: 'user', content, timestamp: Date.now() }),
          chat.systemPrompt,
          settings.temperature,
          settings.maxTokens,
          {
            onToken: (token) => {
              appendToMessage(chatId!, assistantMsgId, token);
            },
            onComplete: () => {
              setGenerating(false, null);
              // Save final state to storage
              storage.saveChats(useChatStore.getState().chats);
            },
            onError: (error) => {
              setGenerating(false, null);
              // Remove empty assistant message on error
              deleteMessage(chatId!, assistantMsgId);
              onError(error.message);
            },
          },
          controller.signal
        );
      } catch (error) {
        setGenerating(false, null);
        deleteMessage(chatId, assistantMsgId);
        onError(error instanceof Error ? error.message : 'Unknown error');
      }
    },
    [
      activeChatId,
      settings,
      createChat,
      addMessage,
      appendToMessage,
      deleteMessage,
      setGenerating,
      onError,
    ]
  );

  const handleRegenerate = useCallback(async () => {
    if (!activeChat || activeChat.messages.length < 2) return;

    const messages = activeChat.messages.filter((m) => m.role !== 'system');
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant');

    if (!lastUserMsg || !lastAssistantMsg) return;

    // Delete last assistant message
    deleteMessage(activeChat.id, lastAssistantMsg.id);

    // Re-send the last user message
    handleSend(lastUserMsg.content);
  }, [activeChat, deleteMessage, handleSend]);

  const isDisabled = !settings.model;

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-chat-bg-dark">
      <MessageList
        messages={activeChat?.messages || []}
        onRegenerate={handleRegenerate}
        isGenerating={isGenerating}
      />
      <InputArea
        onSend={handleSend}
        onStop={stopGeneration}
        isGenerating={isGenerating}
        disabled={isDisabled}
      />
    </div>
  );
}
