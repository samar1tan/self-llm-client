# vLLM Chat Client

A lightweight, modern, ChatGPT-like web client for local vLLM deployments.

![React](https://img.shields.io/badge/React-18-61dafb?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)
![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite)

## Features

- **Streaming Responses** - Real-time token-by-token output via SSE
- **Multi-turn Conversations** - Full context preserved across messages
- **Chat Management** - Create, rename, delete, and switch between chats
- **Markdown Rendering** - Full GFM support with syntax highlighting
- **Code Blocks** - Copy button and language detection
- **System Prompts** - Customizable per conversation
- **Model Selection** - Auto-fetches available models from `/v1/models`
- **Export Chats** - Save as JSON or Markdown
- **Stop Generation** - Abort streaming mid-response
- **Dark/Light/System Theme** - Automatic theme detection
- **Keyboard Shortcuts** - `Ctrl+N` new chat, `Ctrl+,` settings
- **LocalStorage Persistence** - Chat history survives refresh
- **GPU Monitoring** - Real-time AMD GPU metrics with history charts
- **HTTP Request Inspector** - View API request details per message
- **Reasoning Support** - Collapsible thinking/reasoning blocks

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173)

## Configuration

1. Click the **Settings** icon (or press `Ctrl+,`)
2. Enter your vLLM endpoint (default: `http://localhost:8000`)
3. Select a model from the dropdown
4. Start chatting!

## vLLM Setup

Make sure your vLLM server is running with the OpenAI-compatible API:

```bash
# Example vLLM server startup
python -m vllm.entrypoints.openai.api_server \
  --model your-model-name \
  --host 0.0.0.0 \
  --port 8000
```

The client uses these endpoints:
- `GET /v1/models` - List available models
- `POST /v1/chat/completions` - Chat completion with streaming

## Project Structure

```
src/
├── components/          # React UI components
│   ├── Sidebar.tsx      # Chat list navigation
│   ├── ChatWindow.tsx   # Main chat orchestration
│   ├── MessageList.tsx  # Messages container with smart auto-scroll
│   ├── MessageItem.tsx  # Single message with actions
│   ├── InputArea.tsx    # User input + send/stop
│   ├── MarkdownRenderer.tsx  # Markdown rendering
│   ├── CodeBlock.tsx    # Code with copy button
│   ├── SettingsModal.tsx     # Settings panel
│   ├── MonitorPanel.tsx      # GPU monitoring dashboard
│   ├── StatusBar.tsx         # Bottom status bar
│   ├── MetricChart.tsx       # SVG line chart for metrics
│   └── ChartPopup.tsx        # Modal chart with stats
├── stores/              # Zustand state management
│   ├── chatStore.ts     # Chat & message state
│   ├── settingsStore.ts # Settings state
│   └── monitorStore.ts  # GPU monitor state + history
├── services/
│   ├── api.ts           # vLLM API client with streaming
│   └── monitor.ts       # GPU monitoring service + polling
├── types/
│   └── index.ts         # TypeScript interfaces
├── utils/
│   ├── storage.ts       # LocalStorage helpers
│   └── export.ts        # JSON/Markdown export
├── App.tsx              # Root component
├── main.tsx             # Entry point
└── index.css            # Tailwind + custom styles

tools/
└── gpu-monitor-server.py # GPU metrics HTTP proxy
```

## Architecture

The project follows a layered architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────┐
│  UI Layer (React Components)                │
│  Sidebar | ChatWindow | MonitorPanel | ...  │
├─────────────────────────────────────────────┤
│  State Layer (Zustand)                      │
│  chatStore | settingsStore | monitorStore   │
├─────────────────────────────────────────────┤
│  Service Layer                              │
│  api.ts (vLLM) | monitor.ts (GPU)           │
├─────────────────────────────────────────────┤
│  External APIs                              │
│  vLLM Server | GPU Monitor Server           │
└─────────────────────────────────────────────┘
```

### Code Map

A detailed project codemap is available at:
- **[mydocs/codemap/2026-03-09_18-30_vLLM-Chat-Client-Project-Map.md](/home/jd/self-llm-client/mydocs/codemap/2026-03-09_18-30_vLLM-Chat-Client-Project-Map.md)**

The codemap includes:
- Complete module breakdown with file references
- Architecture diagrams (Mermaid)
- Data flow documentation
- API contracts
- Extension points and hotspots

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------||
| Build | Vite | 5.4.10 |
| Framework | React | 18.3.1 |
| Language | TypeScript | 5.6.3 |
| Styling | Tailwind CSS | 3.4.14 |
| State | Zustand | 4.5.5 |
| Markdown | react-markdown + remark-gfm + rehype-highlight | 9.0.1 / 4.0.0 / 7.0.0 |
| Icons | Lucide React | 0.454.0 |

## GPU Monitoring

The client includes a built-in GPU monitoring panel for AMD GPUs:

```bash
# Start the GPU monitor server
python3 tools/gpu-monitor-server.py
```

**Features:**
- Real-time GPU utilization, VRAM, temperature, power, fan speed
- 5-minute metric history with interactive charts
- Click any metric card to view detailed chart with min/avg/max stats
- Visibility-aware polling (pauses when tab is hidden)
- Configurable polling interval (1-10 seconds)

**Requirements:**
- `amdgpu_top` installed (`cargo install amdgpu_top` or package manager)
- Python 3.8+

## Scripts

```bash
npm run dev      # Start dev server with HMR
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## License

Apache-2.0