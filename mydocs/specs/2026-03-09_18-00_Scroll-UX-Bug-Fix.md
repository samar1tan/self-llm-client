# Scroll UX Bug Fix Spec

## §0 Meta

| Field | Value |
|-------|-------|
| Task | Scroll-UX-Bug-Fix |
| Status | **Execute** |
| Created | 2026-03-09 |
| Author | Agent |
| Parent Spec | 2026-03-09_12-00_Streaming-Bug-Typewriter.md |

### §0.1 Context Sources

- User report: "scrolling ux still problematic, especially when opening thinking box and the generated content is long"
- Issues: button disappears, scroll bar freezes, logo flashing
- Memory: "Long-Output Chat Scroll UX Pattern" - floating button with smart auto-scroll, CSS containment for performance
- Memory: "Global scroll-to-bottom button positioning" - must be globally positioned, not confined to subcomponents

### §0.2 Codemap Used

- `src/components/MessageList.tsx` - Main scroll container with auto-scroll logic
- `src/components/MessageItem.tsx` - Collapsible thinking box using `<details>`
- `src/index.css` - Scrollbar and animation styles

---

## §1 Goal & Scope

### §1.1 Objective

Fix three scroll UX bugs:
1. Scroll-to-bottom button disappearing when thinking box expands or content grows
2. Browser scroll bar freezing during long streaming output
3. Logo/empty state flashing during message updates

### §1.2 In Scope

- Fix button positioning to remain visible and clickable at all times
- Optimize scroll performance during streaming
- Eliminate empty state flash
- Maintain auto-scroll behavior (smart: respects user manual scroll)

### §1.3 Out of Scope

- New scroll features
- Scroll position persistence across sessions
- Virtual scrolling (future optimization)

---

## §2 Research Findings

### §2.1 Bug Root Cause Analysis

#### Bug 1: Button Disappears

**Current Implementation** (`MessageList.tsx` L82-90):
```tsx
{showScrollButton && (
  <button
    onClick={() => scrollToBottom('smooth')}
    className="sticky bottom-6 float-right mr-6 p-3 bg-zinc-700..."
  >
```

**Problem**: 
- `sticky` positioning + `float-right` inside a scrollable container with CSS containment
- When thinking box expands, the layout recalculates and the sticky element can get "pushed out"
- `float-right` with `sticky` is a known problematic combination
- Button is INSIDE the scroll content wrapper with `contain: 'content'`

**Solution**: 
- Move button OUTSIDE the scrollable content area
- Use `absolute` positioning relative to the scroll container
- Position at `bottom-6 right-6` consistently

#### Bug 2: Scroll Bar Freezes

**Current Implementation**:
```tsx
// L66: Container has contain: 'layout style'
// L68: Inner wrapper has contain: 'content'
// L44-47: Auto-scroll on every message change
useEffect(() => {
  if (!userScrolled) {
    scrollToBottom('smooth');
  }
}, [messages, userScrolled, scrollToBottom]);
```

**Problem**:
- `contain: 'content'` is too aggressive - it creates a new stacking context AND prevents scroll calculations from propagating
- `scrollIntoView` called on every token during streaming (messages array updates frequently)
- No throttling on scroll calculations

**Solution**:
- Remove `contain: 'content'` - it's overkill for this use case
- Keep `contain: 'layout style'` which is sufficient for performance
- Throttle auto-scroll using `requestAnimationFrame`
- Only auto-scroll on message count changes, not content changes

#### Bug 3: Logo Flashing

**Current Implementation** (`MessageList.tsx` L50-58):
```tsx
if (displayMessages.length === 0) {
  return (
    <div className="flex-1 flex items-center justify-center...">
      <h2>vLLM Chat</h2>
```

**Problem**:
- During rapid re-renders, `displayMessages` can briefly be empty (race condition)
- Filter `messages.filter((m) => m.role !== 'system')` can yield empty during state transitions

**Solution**:
- Use a ref to track if messages were ever present in this session
- Don't show empty state if we had messages before (prevents flash-back)
- Or simply always render the message list container, just make it empty

### §2.2 Memory Guideline Compliance

From memory "Long-Output Chat Scroll UX Pattern":
> "floating scroll-to-bottom button that appears only when scrolled >200px from bottom, with smart auto-scroll behavior that respects manual scroll position"

✅ Current threshold (200px) is correct
✅ Smart auto-scroll (userScrolled flag) is implemented
❌ Button positioning needs fix (should be floating/absolute, not sticky+float)

From memory "Global scroll-to-bottom button positioning":
> "must be globally positioned within the entire chat viewport, not confined to subcomponents"

❌ Current implementation confines button inside scroll content wrapper
✅ Fix: Move button outside inner wrapper, use absolute positioning

---

## §3 Open Questions

- [x] Should we use `requestAnimationFrame` or `setTimeout` for throttle? → **RAF for smooth sync with paint**
- [x] Keep userScrolled threshold at 50px? → **Yes, works well**
- [x] Remove both containment rules or just inner one? → **Remove inner `contain: 'content'` only**

---

## §4 Plan

### §4.1 File Changes

#### 1. `src/components/MessageList.tsx`

**Change 1**: Fix button positioning
- Remove `sticky bottom-6 float-right` 
- Add `absolute bottom-6 right-6`
- Move button outside the inner content wrapper but inside the container

**Change 2**: Optimize auto-scroll
- Add RAF-based throttle for scroll calls
- Track message count (not content) for auto-scroll trigger
- Use `useRef` to prevent scroll-on-every-render

**Change 3**: Fix CSS containment
- Remove `contain: 'content'` from inner wrapper
- Keep `contain: 'layout style'` on outer container

**Change 4**: Fix empty state flash
- Add `hadMessages` ref to track if messages were ever shown
- Only show empty state on initial load, not during flash-backs

### §4.2 Implementation Details

```tsx
// BEFORE (buggy)
<div ref={containerRef} style={{ contain: 'layout style' }}>
  <div style={{ contain: 'content' }}>
    {messages...}
    <div ref={bottomRef} />
  </div>
  {showScrollButton && (
    <button className="sticky bottom-6 float-right mr-6...">
  )}
</div>

// AFTER (fixed)
<div ref={containerRef} className="relative" style={{ contain: 'layout style' }}>
  <div>
    {messages...}
    <div ref={bottomRef} />
  </div>
  {showScrollButton && (
    <button className="absolute bottom-6 right-6...">
  )}
</div>
```

### §4.3 Acceptance Criteria

1. [ ] Scroll-to-bottom button remains visible when thinking box is expanded
2. [ ] Scroll-to-bottom button remains visible during long streaming output
3. [ ] Scroll bar does not freeze during streaming
4. [ ] Logo/empty state does not flash during message updates
5. [ ] Auto-scroll still works correctly (scrolls to bottom on new messages unless user scrolled up)
6. [ ] Manual scroll detection still works (button appears when >200px from bottom)
7. [ ] Click scroll button scrolls smoothly to bottom

---

## §5 Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Absolute positioning doesn't respect scroll | Low | Test thoroughly, fallback to portal if needed |
| RAF throttle too slow | Low | Ensure responsive feel, adjust if needed |
| Empty state flash workaround too aggressive | Low | Only prevent flash-back, allow initial empty state |

---

## §6 Execute Log

### Files Modified

| File | Change |
|------|--------|
| `src/components/MessageList.tsx` | Fixed button positioning (sticky+float → absolute), added RAF throttling, removed contain:content, added hadMessages ref |
| `src/stores/monitorStore.ts` | Removed unused import (unrelated cleanup) |

### Key Changes in MessageList.tsx

1. **Button positioning**: Changed from `sticky bottom-6 float-right mr-6` to `absolute bottom-6 right-6`
2. **Auto-scroll optimization**: 
   - Added `prevMessageCountRef` to track message count changes (not content)
   - Separate useEffect for streaming auto-scroll with 100ms throttle
   - RAF wrapper for smooth scroll sync with paint
3. **CSS containment**: Removed `contain: 'content'` from inner wrapper (kept `contain: 'layout style'` on outer)
4. **Empty state flash fix**: Added `hadMessagesRef` to prevent logo flash-back after messages were shown

---

## §7 Next Actions

1. **Implement Plan** → Modify `MessageList.tsx` with all four fixes
2. **Test** → Verify all 7 acceptance criteria
3. **Review** → Execute `review_execute` for three-axis evaluation

---

**Status**: Research complete. Plan ready. Proceeding to Execute.
