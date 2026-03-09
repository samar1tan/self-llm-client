# vLLM Chat Client - Project Codemap

> Generated: 2026-03-09 19:00  
> Project: vLLM Chat Client - A ChatGPT-like web client for local vLLM deployments

---

## 1. Project Overview

| Attribute | Value |
|-----------|-------|
| **Name** | vLLM Chat Client |
| **Type** | React + TypeScript SPA |
| **Build Tool** | Vite 5 |
| **Styling** | Tailwind CSS 3 |
| **State Management** | Zustand |
| **Purpose** | ChatGPT-like interface for local vLLM/OpenAI-compatible API endpoints |

---

## 2. Architecture Diagram

```mermaid
graph TB
    subgraph "UI Layer"
        App[App.tsx]
        Sidebar[Sidebar.tsx]
        ChatWindow[ChatWindow.tsx]
        MessageList[MessageList.tsx]
        MessageItem[MessageItem.tsx]
        InputArea[InputArea.tsx]
        SettingsModal[SettingsModal.tsx]
        MonitorPanel[MonitorPanel.tsx]
        StatusBar[StatusBar.tsx]
    end

    subgraph "State Layer"
        ChatStore[chatStore.ts]
        SettingsStore[settingsStore.ts]
        MonitorStore[monitorStore.ts]
    end

    subgraph "Service Layer"
        API[api.ts]
        Monitor[monitor.ts]
    end

    subgraph "Utility Layer"
        Storage[storage.ts]
        Export[export.ts]
        Markdown[MarkdownRenderer.tsx]
        CodeBlock[CodeBlock.tsx]
    end

    subgraph "External"
        vLLM[vLLM Server]
        GPUServer[GPU Monitor Server]
    end

    App --> Sidebar
    App --> ChatWindow
    App --> MonitorPanel
    App --> StatusBar
    App --> SettingsModal

    ChatWindow --> MessageList
    ChatWindow --> InputArea
    MessageList --> MessageItem
    MessageItem --> Markdown
    Markdown --> CodeBlock

    ChatWindow --> ChatStore
    ChatWindow --> SettingsStore
    ChatWindow --> API

    Sidebar --> ChatStore
    SettingsModal --> SettingsStore
    MonitorPanel --> MonitorStore
    MonitorPanel --> Monitor

    ChatStore --> Storage
    API --> vLLM
    Monitor --> GPUServer
```

---

## 3. Module Breakdown

### 3.1 Entry Point

| File | Purpose |
|------|---------|
| [main.tsx](/home/jd/self-llm-client/src/main.tsx) | React application entry point |
| [App.tsx](/home/jd/self-llm-client/src/App.tsx) | Root component, theme management, keyboard shortcuts, error handling |

**App.tsx Key Responsibilities:**
- Theme switching (light/dark/system) with system preference detection
- Global keyboard shortcuts (Ctrl+N new chat, Ctrl+, settings)
- Error toast notifications
- Layout composition: Sidebar | ChatWindow | MonitorPanel + StatusBar

---

### 3.2 Components Layer

| Component | File | Key Props | Purpose |
|-----------|------|-----------|---------||
| **Sidebar** | [Sidebar.tsx](/home/jd/self-llm-client/src/components/Sidebar.tsx) | `onOpenSettings` | Chat list navigation, create/rename/delete chats |
| **ChatWindow** | [ChatWindow.tsx](/home/jd/self-llm-client/src/components/ChatWindow.tsx) | `onError` | Main chat orchestration, message sending, streaming |
| **MessageList** | [MessageList.tsx](/home/jd/self-llm-client/src/components/MessageList.tsx) | `messages`, `onRegenerate`, `isGenerating` | Scrollable message container with smart auto-scroll |
| **MessageItem** | [MessageItem.tsx](/home/jd/self-llm-client/src/components/MessageItem.tsx) | `message`, `isLast`, `onRegenerate`, `isGenerating` | Single message with actions, reasoning block, HTTP inspector |
| **InputArea** | [InputArea.tsx](/home/jd/self-llm-client/src/components/InputArea.tsx) | `onSend`, `onStop`, `isGenerating`, `disabled` | User input with send/stop buttons |
| **SettingsModal** | [SettingsModal.tsx](/home/jd/self-llm-client/src/components/SettingsModal.tsx) | `isOpen`, `onClose` | Settings panel (endpoint, model, temperature, GPU monitor) |
| **MonitorPanel** | [MonitorPanel.tsx](/home/jd/self-llm-client/src/components/MonitorPanel.tsx) | - | GPU metrics dashboard with clickable metric cards |
| **StatusBar** | [StatusBar.tsx](/home/jd/self-llm-client/src/components/StatusBar.tsx) | - | Bottom status bar with GPU stats, manages polling service |
| **MetricChart** | [MetricChart.tsx](/home/jd/self-llm-client/src/components/MetricChart.tsx) | `data`, `label`, `unit`, `color`, `minValue`, `maxValue`, `height` | SVG line chart for time-series metrics |
| **ChartPopup** | [ChartPopup.tsx](/home/jd/self-llm-client/src/components/ChartPopup.tsx) | `metric`, `history`, `onClose` | Modal popup for detailed metric charts with min/avg/max stats |
| **MarkdownRenderer** | [MarkdownRenderer.tsx](/home/jd/self-llm-client/src/components/MarkdownRenderer.tsx) | `content` | Markdown rendering with GFM support |
| **CodeBlock** | [CodeBlock.tsx](/home/jd/self-llm-client/src/components/CodeBlock.tsx) | `children`, `className` | Syntax-highlighted code with copy button |

---

### 3.3 State Management (Zustand Stores)

#### ChatStore ([chatStore.ts](/home/jd/self-llm-client/src/stores/chatStore.ts))

```typescript
interface ChatState {
  chats: Chat[];
  activeChatId: string | null;
  isGenerating: boolean;
  abortController: AbortController | null;
  
  // Chat operations
  createChat, deleteChat, renameChat, setActiveChat, updateChatSystemPrompt
  
  // Message operations
  addMessage, updateMessage, appendToMessage, appendReasoningToMessage,
  setMessageHttpRequest, deleteMessage
  
  // Generation control
  setGenerating, stopGeneration
  
  // Helpers
  getActiveChat
}
```

**Key Behaviors:**
- Auto-title from first user message
- Persist chats to LocalStorage via `storage.ts`
- Streaming append operations don't save to storage (performance)
- Final state saved on completion/error

#### SettingsStore ([settingsStore.ts](/home/jd/self-llm-client/src/stores/settingsStore.ts))

```typescript
interface SettingsState {
  settings: Settings;
  updateSettings, resetSettings
}

interface Settings {
  endpoint: string;      // default: http://localhost:8000
  model: string;
  temperature: number;   // default: 0.7
  maxTokens: number;     // default: 2048
  theme: 'light' | 'dark' | 'system';
}
```

#### MonitorStore ([monitorStore.ts](/home/jd/self-llm-client/src/stores/monitorStore.ts))

```typescript
interface MonitorState {
  // Settings
  settings: MonitorSettings;
  
  // Runtime state
  panelOpen: boolean;
  gpu: GpuMetrics | null;
  vllm: VllmStats | null;
  connected: boolean;
  error: string | null;
  lastUpdate: number | null;
  
  // History for charts (max 150 points, ~5 min at 2s interval)
  history: MetricHistoryPoint[];
  
  // Actions
  setSettings, setPanelOpen, togglePanel, setGpuMetrics, 
  setVllmStats, setConnected, setError, reset
}
```

**Key Behaviors:**
- Sliding window history (150 data points max)
- Panel state persisted to LocalStorage
- Auto-clears error on successful metrics update

---

### 3.4 Service Layer

#### API Service ([api.ts](/home/jd/self-llm-client/src/services/api.ts))

| Function | Purpose |
|----------|---------|
| `fetchModels(endpoint)` | GET /v1/models - List available models |
| `streamChatCompletion(...)` | POST /v1/chat/completions with SSE streaming |
| `checkEndpointHealth(endpoint)` | Health check with 5s timeout |

**Streaming Flow:**
1. Build messages array (system prompt + conversation history)
2. Emit request info via `onRequestInfo` callback
3. Fetch with `stream: true`
4. Read response body via `getReader()`
5. Parse SSE data lines, extract `delta.content` and `delta.reasoning`
6. Call `onToken` / `onReasoning` callbacks for each chunk
7. Signal completion via `onComplete` or `onError`

#### Monitor Service ([monitor.ts](/home/jd/self-llm-client/src/services/monitor.ts))

| Function/Class | Purpose |
|----------------|---------||
| `fetchGpuMetrics(endpoint)` | GET /gpu-stats, parses amdgpu_top JSON to GpuMetrics |
| `checkMonitorHealth(endpoint)` | GET /health with 2s timeout |
| `GpuMonitorService` | Polling manager class with lifecycle control |

**GpuMonitorService Features:**
- Visibility-aware polling (pauses when tab hidden)
- Retry logic with maxRetries=3
- Dynamic config updates with auto-restart
- Proper cleanup via `destroy()` method

---

### 3.5 Type Definitions ([types/index.ts](/home/jd/self-llm-client/src/types/index.ts))

```typescript
// Core domain types
HttpRequestInfo { method, url, headers, body, timestamp }
Message { id, role, content, reasoning?, httpRequest?, timestamp }
Chat { id, title, messages, systemPrompt, createdAt, updatedAt }
Settings { endpoint, model, temperature, maxTokens, theme }

// API types
Model { id, object, created, owned_by }
ChatCompletionChunk { id, object, created, model, choices[] }
ApiError { message, code? }

// GPU Monitoring types
GpuMetrics { deviceName, pci, utilization, vram, sensors, timestamp }
VllmStats { tokensPerSecond?, queueDepth?, activeRequests? }
MonitorSettings { enabled, endpoint, pollingInterval }

// Metric history types
MetricType = 'gfx' | 'memory' | 'vram' | 'temp' | 'power' | 'fan'
MetricHistoryPoint { timestamp, gfx, memory, vram, vramTotal, temp, power, fan? }
```

---

### 3.6 Utilities

| File | Purpose |
|------|---------|
| [storage.ts](/home/jd/self-llm-client/src/utils/storage.ts) | LocalStorage persistence for chats |
| [export.ts](/home/jd/self-llm-client/src/utils/export.ts) | Export chats to JSON/Markdown |

---

### 3.7 External Tools

| File | Purpose |
|------|---------|
| [gpu-monitor-server.py](/home/jd/self-llm-client/tools/gpu-monitor-server.py) | Python HTTP proxy for amdgpu_top GPU metrics |

**Endpoints:**
- `GET /gpu-stats` - Returns amdgpu_top JSON
- `GET /health` - Health check

---

## 4. Data Flow

### 4.1 Chat Message Flow

```
User Input → InputArea → ChatWindow.handleSend()
    ↓
chatStore.addMessage(user) → LocalStorage
    ↓
chatStore.addMessage(assistant, empty) → Get assistantMsgId
    ↓
api.streamChatCompletion()
    ↓
SSE Stream → onToken() → chatStore.appendToMessage()
    ↓
onComplete() → chatStore.setGenerating(false) → LocalStorage
```

### 4.2 Theme Flow

```
System Preference / User Selection → settingsStore
    ↓
App.tsx useEffect → document.documentElement.classList.add/remove('dark')
    ↓
Tailwind dark: variants apply
```

---

## 5. Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------||
| react, react-dom | ^18.3.1 | UI framework |
| zustand | ^4.5.5 | State management |
| react-markdown | ^9.0.1 | Markdown rendering |
| remark-gfm | ^4.0.0 | GitHub Flavored Markdown |
| rehype-highlight | ^7.0.0 | Syntax highlighting |
| lucide-react | ^0.454.0 | Icons |
| nanoid | ^5.0.7 | ID generation |
| tailwindcss | ^3.4.14 | Styling |
| vite | ^5.4.10 | Build tool |
| typescript | ^5.6.3 | Type checking |

---

## 6. External API Contracts

### 6.1 vLLM/OpenAI Compatible API

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/models` | GET | List available models |
| `/v1/chat/completions` | POST | Streaming chat completion |

**Request Format:**
```json
{
  "model": "model-name",
  "messages": [{"role": "user", "content": "..."}],
  "stream": true,
  "temperature": 0.7,
  "max_tokens": 2048
}
```

**SSE Response Format:**
```
data: {"id":"...","choices":[{"delta":{"content":"token"}}]}

data: [DONE]
```

### 6.2 GPU Monitor Server

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/gpu-stats` | GET | GPU metrics from amdgpu_top |
| `/health` | GET | Health check |

---

## 7. File Index

```
src/
├── App.tsx                    # Root component, theme, keyboard shortcuts
├── main.tsx                   # Entry point
├── index.css                  # Tailwind + custom styles
├── components/
│   ├── ChatWindow.tsx         # Main chat orchestration
│   ├── Sidebar.tsx            # Chat list navigation
│   ├── MessageList.tsx        # Messages container with smart auto-scroll
│   ├── MessageItem.tsx        # Single message with actions
│   ├── InputArea.tsx          # User input + send/stop
│   ├── SettingsModal.tsx      # Settings panel
│   ├── MonitorPanel.tsx       # GPU metrics dashboard
│   ├── StatusBar.tsx          # Bottom status bar, manages polling
│   ├── MetricChart.tsx        # SVG line chart component
│   ├── ChartPopup.tsx         # Modal chart with stats
│   ├── MarkdownRenderer.tsx   # Markdown rendering
│   └── CodeBlock.tsx          # Code blocks with copy
├── stores/
│   ├── chatStore.ts           # Chat & message state (186 lines)
│   ├── settingsStore.ts       # Settings state (33 lines)
│   └── monitorStore.ts        # GPU monitor state + history (157 lines)
├── services/
│   ├── api.ts                 # vLLM API client (149 lines)
│   └── monitor.ts             # GPU monitor service + polling class (199 lines)
├── types/
│   └── index.ts               # TypeScript interfaces (109 lines)
└── utils/
    ├── storage.ts             # LocalStorage helpers (51 lines)
    └── export.ts              # Export utilities (50 lines)

tools/
└── gpu-monitor-server.py      # GPU metrics HTTP proxy (175 lines)
```

---

## 8. Hotspots & Extension Points

| Area | Extension Ideas |
|------|-----------------||
| MessageItem.tsx | Add message editing, reactions, threading |
| api.ts | Add retry logic, request interceptors, caching |
| chatStore.ts | Add conversation search, folders, tags |
| SettingsModal.tsx | Add custom headers, proxy settings |
| MonitorPanel.tsx | Add multi-GPU support |
| MetricChart.tsx | Add zoom, pan, export chart as image |
| monitor.ts | Add vLLM stats integration (tokens/s from server) |

---

## 9. Recent Additions (Since Initial Release)

| Feature | Files | Description |
|---------|-------|-------------|
| **Metric History Charts** | MetricChart.tsx, ChartPopup.tsx, monitorStore.ts | Time-series visualization with 5-min sliding window |
| **HTTP Request Inspector** | MessageItem.tsx, types/index.ts | Collapsible panel showing API request details per message |
| **Reasoning Block** | MessageItem.tsx, api.ts | Support for model reasoning/thinking tokens |
| **Smart Auto-Scroll** | MessageList.tsx | RAF-throttled scrolling, user scroll detection, scroll-to-bottom button |
| **Visibility-Aware Polling** | monitor.ts | Pauses GPU polling when browser tab is hidden |

---

*End of Codemap*
