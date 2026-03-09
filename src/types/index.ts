export interface HttpRequestInfo {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: object;
  timestamp: number;
}

export interface MessageMetrics {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  durationMs: number;
  tokensPerSecond: number;
  firstTokenLatencyMs: number;
}

export interface Message {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  reasoning?: string;
  httpRequest?: HttpRequestInfo;
  metrics?: MessageMetrics;
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
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ApiError {
  message: string;
  code?: string;
}

// GPU Monitoring Types
export interface GpuMetrics {
  deviceName: string;
  pci: string;
  utilization: {
    gfx: number;      // GPU compute %
    memory: number;   // Memory controller %
    media: number;    // Media engine %
  };
  vram: {
    used: number;     // MiB
    total: number;    // MiB
  };
  sensors: {
    temperature: number;  // Celsius
    power: number;        // Watts
    fanSpeed?: number;    // RPM
  };
  timestamp: number;
}

export interface VllmStats {
  tokensPerSecond?: number;
  queueDepth?: number;
  activeRequests?: number;
}

export interface MonitorSettings {
  enabled: boolean;
  endpoint: string;       // GPU monitor server endpoint
  pollingInterval: number; // milliseconds
}

// Metric types for history tracking
export type MetricType = 'gfx' | 'memory' | 'vram' | 'temp' | 'power' | 'fan';

export interface MetricHistoryPoint {
  timestamp: number;
  gfx: number;        // GPU utilization %
  memory: number;     // Memory controller %
  vram: number;       // VRAM used in MiB
  vramTotal: number;  // VRAM total in MiB
  temp: number;       // Temperature in Celsius
  power: number;      // Power in Watts
  fan?: number;       // Fan speed in RPM
}
