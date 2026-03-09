# Response Metrics Display

## §0 Meta

| Field | Value |
|-------|-------|
| Task | Response-Metrics-Display |
| Status | Review |
| Created | 2026-03-09 19:00 |
| Updated | 2026-03-09 19:30 |

## §1 Context Sources

- **User Request**: Add monitoring data like token generation speed and time duration under the response
- **Codemap**: `mydocs/codemap/2026-03-09_18-30_vLLM-Chat-Client-Project-Map.md`
- **Related Specs**: GPU monitoring panel implementation exists

## §2 Research Findings

### §2.1 Current Architecture

**Message Flow:**
1. `ChatWindow.handleSend()` creates empty assistant message
2. `streamChatCompletion()` streams tokens via callbacks
3. `onToken()` appends content incrementally
4. `onComplete()` finalizes the message

**Existing Patterns (reusable):**
- Collapsible `<details>` sections in `MessageItem.tsx` for HTTP Request and Reasoning
- Message metadata stored via dedicated store methods (`setMessageHttpRequest`)
- Types extended in `src/types/index.ts`

### §2.2 Data Available for Metrics

| Metric | Source | How to Capture |
|--------|--------|----------------|
| Total Tokens | Count in `onToken` callback | Increment counter on each token chunk |
| Duration (ms) | `startTime` before call, `endTime` in `onComplete` | Calculate difference |
| Tokens/sec | Calculated | `totalTokens / (duration / 1000)` |
| First Token Latency | Time until first `onToken` fires | Track first token timestamp |

### §2.3 Extension Points

1. **Types** (`src/types/index.ts`): Add `MessageMetrics` interface and `metrics?: MessageMetrics` to `Message`
2. **Store** (`src/stores/chatStore.ts`): Add `setMessageMetrics()` method
3. **API** (`src/services/api.ts`): Extend `StreamCallbacks` with `onMetrics?` callback
4. **ChatWindow** (`src/components/ChatWindow.tsx`): Track timing/tokens, call metrics callback
5. **MessageItem** (`src/components/MessageItem.tsx`): Add collapsible metrics display section

## §3 Goal & Scope

### §3.1 Objective
Display token generation metrics (token count, duration, tokens/sec, first token latency) under each assistant response in a collapsible section.

### §3.2 In Scope
- Add `MessageMetrics` type with: `tokenCount`, `durationMs`, `tokensPerSecond`, `firstTokenLatencyMs`
- Capture metrics during streaming in `ChatWindow`
- Store metrics per message via `setMessageMetrics`
- Display metrics in `MessageItem` as collapsible section (similar to HTTP Request)
- Persist metrics with message history

### §3.3 Out of Scope
- Server-side vLLM metrics integration
- Real-time streaming metrics display (only show after completion)
- Export/analytics of metrics history

## §4 Plan

### §4.1 Files to Modify

| File | Changes |
|------|---------|
| `src/types/index.ts` | Add `MessageMetrics` interface, extend `Message` type |
| `src/stores/chatStore.ts` | Add `setMessageMetrics()` action |
| `src/components/ChatWindow.tsx` | Track timing/tokens during streaming, call setMessageMetrics |
| `src/components/MessageItem.tsx` | Add collapsible metrics display section |

### §4.2 Implementation Checklist

- [x] **Step 1**: Add `MessageMetrics` interface to types
- [x] **Step 2**: Add `metrics?: MessageMetrics` field to `Message` interface
- [x] **Step 3**: Add `setMessageMetrics` to chatStore interface and implementation
- [x] **Step 4**: Update `ChatWindow.handleSend` to track timing and token count
- [x] **Step 5**: Add metrics display section to `MessageItem` component
- [x] **Step 6**: Build verification passed

### §4.3 Type Definitions

```typescript
// src/types/index.ts
export interface MessageMetrics {
  tokenCount: number;
  durationMs: number;
  tokensPerSecond: number;
  firstTokenLatencyMs: number;
}
```

### §4.4 Store Method Signature

```typescript
// src/stores/chatStore.ts
setMessageMetrics: (chatId: string, messageId: string, metrics: MessageMetrics) => void;
```

## §5 Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Token counting may be inaccurate (chunks vs actual tokens) | Low | Display is approximate, acceptable for UX |
| Storage size increase | Low | Metrics are small (~40 bytes per message) |

## §6 Review

### §6.1 Review Matrix

| Axis | Item | Status | Evidence |
|------|------|--------|----------|
| **1. Spec Quality** | Goals clear | PASS | Display token metrics under response |
| | Scope defined | PASS | 4 files, specific metrics |
| | Acceptance criteria | PASS | Metrics visible after streaming |
| **2. Spec-Code Consistency** | Files modified | PASS | types, chatStore, ChatWindow, MessageItem |
| | Signatures match | PASS | `MessageMetrics`, `setMessageMetrics` |
| | Checklist complete | PASS | All 6 steps done |
| **3. Code Quality** | Correctness | PASS | Build passes, metrics calculated correctly |
| | Robustness | PASS | Handles edge cases (no metrics yet, streaming) |
| | Maintainability | PASS | Follows existing patterns |

### §6.2 Overall Verdict

**PASS** - All implementation steps completed, build verified.

### §6.3 Plan-Execution Diff

No deviations from plan.

### §6.4 Post-Review Enhancement

**FAST track**: Added reasoning/thinking token counting to metrics.
- `onReasoning` callback now increments `tokenCount`
- First token latency tracks whichever comes first (reasoning or content)

### §6.5 Accurate Token Counts (v2)

**Enhancement**: Use vLLM's `stream_options.include_usage` for accurate token counts.

**Changes:**
- `MessageMetrics` now includes: `promptTokens`, `completionTokens`, `totalTokens`
- API adds `stream_options: { include_usage: true }` to request
- New `onUsage` callback captures real token counts from API
- Display shows: `prompt/completion/total tokens` format
- `tokensPerSecond` calculated from actual `completionTokens`

**Files modified:**
- `src/types/index.ts` - Updated `MessageMetrics` and `ChatCompletionChunk` types
- `src/services/api.ts` - Added `stream_options` and `onUsage` callback
- `src/components/ChatWindow.tsx` - Handle usage data from API
- `src/components/MessageItem.tsx` - Display prompt/completion/total tokens

---

**Next Action**: Await `Plan Approved` to proceed to Execute phase.
