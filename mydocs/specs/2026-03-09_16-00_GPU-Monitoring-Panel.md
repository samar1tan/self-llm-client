# GPU Monitoring Panel Spec

## §0 Meta

| Field | Value |
|-------|-------|
| Task | GPU-Monitoring-Panel |
| Status | **Execute Complete → Review** |
| Created | 2026-03-09 |
| Author | Agent |
| Parent Spec | 2026-03-08_12-00_vLLM-Chat-Client.md |

### §0.1 Context Sources

- User requirement: "Add a panel for useful monitoring data from local AMDGPU"
- Reference: [amdgpu_top](https://github.com/Umio-Yasuno/amdgpu_top) - AMDGPU monitoring tool with JSON output
- User concern: "Adding more and more displayable elements - don't break the UI/UX"
- Additional requirement: Consider vLLM debugging log data

### §0.2 Codemap Used

- SearchAgent analysis of current UI architecture
- Existing specs: vLLM-Chat-Client, Streaming-Bug-Typewriter, HTTP-Request-Inspector

---

## §1 Goal & Scope

### §1.1 Objective

Add a GPU monitoring panel that displays real-time AMD GPU metrics (from `amdgpu_top`) and optionally vLLM inference statistics, while maintaining the clean, focused chat UI/UX.

### §1.2 In Scope

- Real-time GPU metrics display (utilization, VRAM, temperature, power)
- vLLM inference statistics (if available from logs/API)
- Non-intrusive UI that doesn't clutter the chat experience
- Toggleable/collapsible panel design
- Dark/light theme support

### §1.3 Out of Scope

- Multi-GPU selection (Phase 2)
- Historical graphs/charts (Phase 2)
- GPU control/overclocking
- Alerts/notifications

---

## §2 Research Findings

### §2.1 Data Sources

#### 2.1.1 amdgpu_top JSON Output

**Command**: `amdgpu_top --json -n 1` (single snapshot)
**Polling**: `amdgpu_top --json -s 1000` (1s interval)

**Sample Output Structure**:
```json
{
  "devices": [{
    "Info": {
      "DeviceName": "AMD Radeon RX 7900 XTX",
      "PCI": "0000:03:00.0"
    },
    "gpu_activity": {
      "GFX": {"value": 15, "unit": "%"},
      "MediaEngine": {"value": 0, "unit": "%"},
      "Memory": {"value": 5, "unit": "%"}
    },
    "VRAM": {
      "Total": {"value": 24576, "unit": "MiB"},
      "Used": {"value": 1234, "unit": "MiB"}
    },
    "Sensors": {
      "GPU Temperature": {"value": 45, "unit": "C"},
      "GPU Power": {"value": 120, "unit": "W"}
    }
  }]
}
```

**Key Metrics for LLM Inference**:
| Metric | Why Useful |
|--------|-----------|
| VRAM Used/Total | Critical for model loading, context length |
| GFX % | GPU compute utilization |
| GPU Power | Inference power draw |
| GPU Temp | Thermal throttling indicator |

#### 2.1.2 vLLM Statistics

**Potential Sources**:
1. **vLLM `/metrics` endpoint** (Prometheus format) - tokens/s, queue depth
2. **vLLM `/v1/models` response** - model info (already fetched)
3. **Inference response headers** - timing info (if present)

**Need to verify**: Does vLLM expose a metrics/stats endpoint?

### §2.2 Browser Limitation: No Shell Access

**Problem**: Browser JavaScript cannot directly execute `amdgpu_top`.

**Solutions**:

| Option | Pros | Cons |
|--------|------|------|
| A. Local proxy server | Full access, real-time | Requires separate server process |
| B. vLLM extension | Single server | Requires vLLM modification |
| C. Electron wrapper | Native access | Heavy, changes deployment model |
| D. Existing monitoring API | If vLLM has it | May not have GPU metrics |

**Recommended**: Option A - Small local HTTP server that wraps `amdgpu_top` output. Can be a simple Python/Node script that the user runs alongside vLLM.

### §2.3 UI/UX Design Analysis

**Current Layout**:
```
┌──────────────────────────────────────────────────┐
│ ┌─────────────┬─────────────────────────────────┐│
│ │   Sidebar   │         ChatWindow              ││
│ │   (256px)   │         (flex-1)                ││
│ │             │                                 ││
│ │ - New Chat  │ ┌─────────────────────────────┐ ││
│ │ - Chat 1    │ │      MessageList            │ ││
│ │ - Chat 2    │ │                             │ ││
│ │             │ └─────────────────────────────┘ ││
│ │             │ ┌─────────────────────────────┐ ││
│ │ - Settings  │ │      InputArea              │ ││
│ └─────────────┴─────────────────────────────────┘│
└──────────────────────────────────────────────────┘
```

**UI Options for Monitoring Panel**:

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| A. Bottom status bar | Fixed bar at bottom | Non-intrusive, always visible | Limited space |
| B. Sidebar footer section | Below Settings in sidebar | Grouped with settings | Sidebar already dense |
| C. Right panel (toggleable) | New panel on right | Full height, detailed | Reduces chat width |
| D. Floating widget | Draggable overlay | Flexible, optional | Can obstruct content |
| E. Header strip | Below app title area | Non-intrusive | No title area exists |

**Recommended**: Option A (Bottom status bar) with Option C (Right panel) as expansion

**Rationale**:
- Status bar shows critical metrics at a glance (VRAM, GPU%, Temp)
- Clicking expands to right panel for detailed view
- Maintains focus on chat while providing monitoring visibility
- Similar to IDE status bars (VS Code bottom bar → terminal/problems panel)

### §2.4 Growing UI Complexity Mitigation

**Current collapsible elements per message**:
1. HTTP Request block
2. Reasoning/Thinking block

**Design principles to avoid UX degradation**:
1. **Progressive disclosure**: Show summary, expand for details
2. **Consistent patterns**: Use same `<details>` component style
3. **User control**: All panels toggleable, state persisted
4. **Visual hierarchy**: Chat content primary, monitoring secondary
5. **Graceful degradation**: App works without monitoring server

---

## §3 Open Questions

- [ ] **Q1**: Does vLLM expose a `/metrics` or stats endpoint? → **To verify during execute**
- [x] **Q2**: Should monitoring server be bundled or separate? → **Separate Python script**
- [x] **Q3**: Polling interval preference? → **2 seconds (user confirmed)**
- [x] **Q4**: Should monitoring panel state be persisted? → **Yes, in localStorage**

---

## §4 Innovate (Options)

### Option A: Status Bar + Expandable Panel (Recommended ✓)

```
┌──────────────────────────────────────────────────┐
│ ┌─────────────┬────────────────────┬───────────┐│
│ │   Sidebar   │    ChatWindow      │  Monitor  ││ ← Toggle panel
│ │   (256px)   │    (flex-1)        │  Panel    ││
│ │             │                    │  (280px)  ││
│ │ - New Chat  │ ┌────────────────┐ │           ││
│ │ - Chat 1    │ │  MessageList   │ │ GPU: 45% ││
│ │ - Chat 2    │ │                │ │ VRAM: 8G ││
│ │             │ └────────────────┘ │ Temp: 65C││
│ │             │ ┌────────────────┐ │ Power:120W│
│ │ - Settings  │ │  InputArea     │ │           ││
│ └─────────────┴────────────────────┴───────────┘│
│ ┌───────────────────────────────────────────────┐│
│ │ 🖥 GPU: 45% │ VRAM: 8.2/24GB │ 🌡 65°C │ ⚡120W│ ← Status bar (collapsed)
│ └───────────────────────────────────────────────┘│
└──────────────────────────────────────────────────┘
```

**Pros**:
- Always-visible summary (status bar)
- Detailed view on demand (right panel)
- Doesn't reduce chat space by default
- Follows familiar IDE patterns

**Cons**:
- Two new components to build

### Option B: Sidebar Stats Section

Add collapsible stats section in sidebar above Settings.

**Pros**: No additional layout changes
**Cons**: Sidebar already dense, limited width for metrics

### Option C: Floating Widget

Draggable overlay with GPU stats.

**Pros**: Very flexible positioning
**Cons**: Can obstruct content, feels disconnected

**Decision**: Option A - provides best balance of visibility and non-intrusiveness.

---

## §5 Plan

### §5.1 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │ StatusBar   │  │ MonitorPanel│  │ monitorStore.ts │  │
│  │ (compact)   │  │ (detailed)  │  │ (Zustand)       │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
│           │              │                │             │
│           └──────────────┴────────────────┘             │
│                          │                              │
│                    ┌─────▼─────┐                        │
│                    │ api.ts    │                        │
│                    │ polling   │                        │
│                    └─────┬─────┘                        │
└──────────────────────────┼──────────────────────────────┘
                           │ HTTP GET /gpu-stats
                           │ (every N seconds)
┌──────────────────────────▼──────────────────────────────┐
│              Monitoring Proxy Server                    │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Python/Node script (runs alongside vLLM)        │    │
│  │ - Executes: amdgpu_top --json -n 1              │    │
│  │ - Optionally: fetches vLLM /metrics             │    │
│  │ - Exposes: GET /gpu-stats                       │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### §5.2 File Structure (New Files)

```
src/
├── components/
│   ├── StatusBar.tsx        # Bottom status bar (compact metrics)
│   └── MonitorPanel.tsx     # Right panel (detailed metrics)
├── stores/
│   └── monitorStore.ts      # GPU/vLLM metrics state
├── services/
│   └── monitor.ts           # Polling service for metrics
└── types/
    └── index.ts             # Add GpuMetrics, VllmStats types

tools/
└── gpu-monitor-server.py    # Simple proxy server script
```

### §5.3 Type Definitions

```typescript
// New types in src/types/index.ts

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
    fanSpeed?: number;    // RPM or %
  };
  timestamp: number;
}

export interface VllmStats {
  tokensPerSecond?: number;
  queueDepth?: number;
  activeRequests?: number;
}

export interface MonitorState {
  enabled: boolean;
  panelOpen: boolean;
  gpu: GpuMetrics | null;
  vllm: VllmStats | null;
  error: string | null;
  lastUpdate: number;
}
```

### §5.4 Implementation Checklist

#### Phase 1: Types & Store
- [ ] Add `GpuMetrics`, `VllmStats`, `MonitorState` types
- [ ] Create `monitorStore.ts` with Zustand
- [ ] Add monitor settings to `settingsStore.ts` (endpoint, polling interval, enabled)

#### Phase 2: Monitoring Service
- [ ] Create `services/monitor.ts` with polling logic
- [ ] Handle connection errors gracefully
- [ ] Auto-retry with backoff

#### Phase 3: Backend Proxy (Python)
- [ ] Create `tools/gpu-monitor-server.py`
- [ ] Execute `amdgpu_top --json -n 1` on request
- [ ] Expose `GET /gpu-stats` endpoint
- [ ] CORS headers for browser access

#### Phase 4: UI Components
- [ ] Create `StatusBar.tsx` (compact bottom bar)
- [ ] Create `MonitorPanel.tsx` (detailed right panel)
- [ ] Add toggle button to StatusBar
- [ ] Update `App.tsx` layout to include StatusBar and optional MonitorPanel

#### Phase 5: Integration
- [ ] Add monitoring settings to SettingsModal
- [ ] Persist panel open/close state
- [ ] Handle offline/unavailable gracefully (show "Not connected")

### §5.5 Acceptance Criteria

1. [ ] Status bar shows GPU %, VRAM usage, temperature at a glance
2. [ ] Clicking status bar toggles detailed MonitorPanel
3. [ ] MonitorPanel shows all metrics with labels and units
4. [ ] App functions normally if monitoring server unavailable
5. [ ] Polling interval configurable (default 2s)
6. [ ] Dark/light theme consistent with rest of app
7. [ ] Panel state persists across refresh

---

## §6 Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| User doesn't run proxy server | Medium | Clear "Not connected" state, setup instructions |
| amdgpu_top not installed | Medium | Detect and show helpful error |
| High polling frequency | Low | Default 2s, configurable, pause when tab hidden |
| Layout shift on panel toggle | Medium | Fixed panel width, smooth transition |

---

## §6.1 Execute Log

### Files Created (5 files)

| File | Purpose | Lines |
|------|---------|-------|
| `src/types/index.ts` | Added GpuMetrics, VllmStats, MonitorSettings types | +33 |
| `src/stores/monitorStore.ts` | Zustand store for GPU metrics state | 128 |
| `src/services/monitor.ts` | Polling service with GpuMonitorService class | 189 |
| `src/components/StatusBar.tsx` | Compact bottom status bar | 133 |
| `src/components/MonitorPanel.tsx` | Detailed right panel with metrics | 217 |
| `tools/gpu-monitor-server.py` | Python proxy server for amdgpu_top | 175 |

### Files Modified (2 files)

| File | Change |
|------|--------|
| `src/App.tsx` | Updated layout with StatusBar + MonitorPanel, flex-col structure |
| `src/components/SettingsModal.tsx` | Added GPU Monitor settings section with toggle, endpoint, interval |

### Build Status
- TypeScript: ✅ `tsc --noEmit` passed
- Vite Build: ✅ Production build successful
- All checklist items completed

### Bug Fixes Applied

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| VRAM, temp, power always zero | amdgpu_top JSON field names differ: `"Total VRAM"` not `Total`, `"Edge Temperature"` not `GPU Temperature` | Updated `monitor.ts` parsing to use correct field names |
| VRAM shows 0.5GB instead of ~100GB | APUs use GTT (system RAM) not dedicated VRAM. Was reading `Total VRAM` (512MB) instead of `Total GTT` (~112GB) | Auto-detect APU (VRAM < 16GB) and use GTT values |

---

## §7 Next Actions

1. ~~**User Decision Needed**: Confirm Option A (Status Bar + Panel) design~~ → **APPROVED**
2. **Research**: Check vLLM `/metrics` endpoint availability → **Phase 2**
3. ~~**Clarify**: Polling interval preference~~ → **2 seconds confirmed**
4. **Awaiting**: `Plan Approved` to proceed to Execute phase

---

## §8 Visual Mockups

### Status Bar (Collapsed Default)
```
┌─────────────────────────────────────────────────────────────┐
│ 🖥 RX 7900 XTX │ GPU: 45% │ VRAM: 8.2/24GB │ 🌡65°C │ ⚡120W │ ▲ │
└─────────────────────────────────────────────────────────────┘
```

### Monitor Panel (Expanded)
```
┌─────────────────────────┐
│ GPU Monitor        [×] │
├─────────────────────────┤
│ Device                  │
│ AMD Radeon RX 7900 XTX  │
│ PCI: 0000:03:00.0       │
├─────────────────────────┤
│ Utilization             │
│ ████████░░░░░░░░ 45%   │
│ GFX                     │
│                         │
│ ██░░░░░░░░░░░░░░  5%   │
│ Memory                  │
├─────────────────────────┤
│ VRAM                    │
│ ████████████░░░░        │
│ 8.2 GB / 24 GB (34%)    │
├─────────────────────────┤
│ Sensors                 │
│ Temperature:    65°C    │
│ Power:         120W     │
│ Fan:          1200 RPM  │
├─────────────────────────┤
│ vLLM Stats              │
│ Tokens/s:       45.2    │
│ Queue Depth:       2    │
└─────────────────────────┘
```

---

**Status**: Plan ready. Awaiting `Plan Approved` to proceed to Execute.
