export interface HttpRequestInfo {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: object;
  timestamp: number;
}

export interface Message {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  reasoning?: string;
  httpRequest?: HttpRequestInfo;
  timestamp: number;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  systemPrompt: string;
  createdAt: number;
  updatedAt: number;
}

export interface Settings {
  endpoint: string;
  model: string;
  temperature: number;
  maxTokens: number;
  theme: 'light' | 'dark' | 'system';
}

export interface Model {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

export interface ChatCompletionChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    delta: {
      role?: string;
      content?: string;
      reasoning?: string;
    };
    finish_reason: string | null;
  }[];
}

export interface ApiError {
  message: string;
  code?: string;
}
