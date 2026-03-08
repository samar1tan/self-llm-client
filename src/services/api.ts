import { Message, Model, ChatCompletionChunk, ApiError } from '../types';

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onComplete: () => void;
  onError: (error: ApiError) => void;
}

export async function fetchModels(endpoint: string): Promise<Model[]> {
  try {
    const response = await fetch(`${endpoint}/v1/models`);
    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Failed to fetch models:', error);
    return [];
  }
}

export async function streamChatCompletion(
  endpoint: string,
  model: string,
  messages: Message[],
  systemPrompt: string,
  temperature: number,
  maxTokens: number,
  callbacks: StreamCallbacks,
  signal: AbortSignal
): Promise<void> {
  const apiMessages: { role: string; content: string }[] = [];

  // Add system prompt if present
  if (systemPrompt) {
    apiMessages.push({ role: 'system', content: systemPrompt });
  }

  // Add conversation messages (excluding system role from store)
  for (const msg of messages) {
    if (msg.role !== 'system') {
      apiMessages.push({ role: msg.role, content: msg.content });
    }
  }

  try {
    const response = await fetch(`${endpoint}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: apiMessages,
        stream: true,
        temperature,
        max_tokens: maxTokens,
      }),
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        callbacks.onComplete();
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;

        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') {
          callbacks.onComplete();
          return;
        }

        try {
          const chunk: ChatCompletionChunk = JSON.parse(data);
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            callbacks.onToken(content);
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }
  } catch (error) {
    if (signal.aborted) {
      callbacks.onComplete();
      return;
    }
    callbacks.onError({
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
}

export async function checkEndpointHealth(endpoint: string): Promise<boolean> {
  try {
    const response = await fetch(`${endpoint}/v1/models`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
