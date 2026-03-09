# GPU Metrics History Charts

> **Spec Version**: 1.0 | **Status**: Execute Complete → Review  
> **Parent Spec**: `2026-03-09_16-00_GPU-Monitoring-Panel.md`

## §1 Context & Goal

### 1.1 Context Sources
- Existing GPU monitoring implementation (MonitorPanel, monitorStore, monitor.ts)
- User request: make metric cards clickable to show time-series charts

### 1.2 Goal
Add interactive time-series charts to the GPU Monitor panel. Users can click any metric card (VRAM, GPU utilization, temperature, power) to view a popup showing the historical trend over time.

### 1.3 Scope
- **In Scope**: History tracking, clickable metrics, chart popup, simple line chart visualization
- **Out of Scope**: Exporting data, complex chart interactions (zoom/pan), persisting history across sessions

---

## §2 Research Findings

### 2.1 Current Architecture
| Component | Role |
|-----------|------|
| `monitorStore.ts` | Zustand store with current GPU metrics (no history) |
| `MonitorPanel.tsx` | Displays metrics via `MetricCard` components |
| `StatusBar.tsx` | Runs polling service, updates store |
| `monitor.ts` | Service that fetches from GPU monitor server |

### 2.2 Key Metrics to Track
| Metric | Key | Unit | Range |
|--------|-----|------|-------|
| GPU Utilization | `utilization.gfx` | % | 0-100 |
| Memory Controller | `utilization.memory` | % | 0-100 |
| VRAM Usage | `vram.used` | MiB | 0-total |
| Temperature | `sensors.temperature` | °C | 0-100+ |
| Power | `sensors.power` | W | 0-500 |
| Fan Speed | `sensors.fanSpeed` | RPM | 0-10000 |

### 2.3 Design Decisions

**Chart Library**: Pure SVG (no external dependency)
- Simple line charts are easy to implement with SVG path
- Keeps bundle size minimal
- Full control over styling (dark mode support)

**History Window**: 5 minutes (150 data points at 2s polling)
- Enough to see trends without excessive memory usage
- Configurable via constant

**Popup Behavior**: Click to open, click outside or X to close
- Standard popover/modal pattern
- Position relative to clicked card

---

## §3 Acceptance Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| AC1 | Each MetricCard in MonitorPanel is clickable | Click card → popup appears |
| AC2 | Popup shows SVG line chart with last 5 min of data | Visual inspection |
| AC3 | Chart updates in real-time while popup is open | Watch values change |
| AC4 | Chart shows time axis (relative, e.g., "-5m" to "now") | Visual inspection |
| AC5 | Chart adapts to dark/light mode | Toggle theme |
| AC6 | Click outside popup or X button closes it | Interaction test |
| AC7 | No external chart library added | Check package.json |

---

## §4 Plan

### 4.1 Files to Modify/Create

| File | Action | Purpose |
|------|--------|---------|
| `src/stores/monitorStore.ts` | Modify | Add history tracking |
| `src/types/index.ts` | Modify | Add MetricHistoryPoint type |
| `src/components/MetricChart.tsx` | Create | SVG line chart component |
| `src/components/ChartPopup.tsx` | Create | Popup wrapper for chart |
| `src/components/MonitorPanel.tsx` | Modify | Make cards clickable, show popup |

### 4.2 Implementation Checklist

#### Phase 1: Types & Store
- [ ] Add `MetricHistoryPoint` type to `types/index.ts`
- [ ] Add `MetricType` enum (gfx, memory, vram, temp, power, fan)
- [ ] Add history array to monitorStore (max 150 points)
- [ ] Modify `setGpuMetrics` to append to history with timestamp

#### Phase 2: Chart Component
- [ ] Create `MetricChart.tsx` with pure SVG implementation
- [ ] Support props: `data: {timestamp, value}[]`, `label`, `unit`, `color`
- [ ] Render line path, area fill, axes, current value
- [ ] Support dark mode via Tailwind classes

#### Phase 3: Popup Component
- [ ] Create `ChartPopup.tsx` wrapper component
- [ ] Position below/beside clicked element
- [ ] Handle click-outside to close
- [ ] Header with metric name and close button

#### Phase 4: Integration
- [ ] Modify `MetricCard` to accept `onClick` prop
- [ ] Add state for selected metric in `MonitorPanel`
- [ ] Wire up click handlers to show `ChartPopup`
- [ ] Extract correct history slice based on metric type

#### Phase 5: Verification
- [ ] TypeScript check passes
- [ ] Visual test: click each metric, verify chart shows
- [ ] Verify dark mode styling

---

## §5 Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Memory growth with long history | Medium | Cap at 150 points, use sliding window |
| Chart performance with many points | Low | SVG handles 150 points easily; could downsample if needed |
| Popup positioning edge cases | Low | Use simple below-right positioning; adjust if needed |

---

## §6 Open Questions

None - requirements are clear. Proceeding to Plan approval.

---

## §7 Review Log

### Execute Summary

| Phase | Status | Notes |
|-------|--------|-------|
| Types & Store | DONE | Added `MetricHistoryPoint` type, history array with 150-point sliding window |
| MetricChart | DONE | Pure SVG line chart with gradient fill, dark mode support |
| ChartPopup | DONE | Modal with click-outside/ESC close, min/avg/max stats |
| Integration | DONE | MetricCards now clickable with hover effect |
| Verification | DONE | tsc + build pass |

### Files Changed
- `src/types/index.ts` - Added `MetricType`, `MetricHistoryPoint`
- `src/stores/monitorStore.ts` - Added history tracking with sliding window
- `src/components/MetricChart.tsx` - NEW: SVG line chart component
- `src/components/ChartPopup.tsx` - NEW: Modal popup with chart
- `src/components/MonitorPanel.tsx` - Made MetricCards clickable
