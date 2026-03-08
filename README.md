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
│   ├── MessageList.tsx  # Messages container
│   ├── MessageItem.tsx  # Single message with actions
│   ├── InputArea.tsx    # User input + send/stop
│   ├── MarkdownRenderer.tsx  # Markdown rendering
│   ├── CodeBlock.tsx    # Code with copy button
│   └── SettingsModal.tsx     # Settings panel
├── stores/              # Zustand state management
│   ├── chatStore.ts     # Chat & message state
│   └── settingsStore.ts # Settings state
├── services/
│   └── api.ts           # vLLM API client with streaming
├── types/
│   └── index.ts         # TypeScript interfaces
├── utils/
│   ├── storage.ts       # LocalStorage helpers
│   └── export.ts        # JSON/Markdown export
├── App.tsx              # Root component
├── main.tsx             # Entry point
└── index.css            # Tailwind + custom styles
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Build | Vite 5 |
| Framework | React 18 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 |
| State | Zustand |
| Markdown | react-markdown + remark-gfm + rehype-highlight |
| Icons | Lucide React |

## Scripts

```bash
npm run dev      # Start dev server with HMR
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## License

Apache-2.0