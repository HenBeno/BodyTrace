# Performance checklist (BodyTrace)

Follow **measure → optimize → re-measure**. See [.cursor/skills/agent-skills/skills/react-native-best-practices/SKILL.md](../.cursor/skills/agent-skills/skills/react-native-best-practices/SKILL.md).

## Baseline (record before/after when tuning)

- **Scroll / timeline:** React Native DevTools (Metro `j` or in-app dev menu). Target the timeline scroll, not raw component counts.
- **Startup:** Time to interactive after splash; note if fonts in `app/_layout.tsx` dominate.
- **JS bundle (optional):** Metro production bundle size; `source-map-explorer` on the output if you need bundle-level insight (see skill `bundle-analyze-js` reference).

## This codebase

- **Timeline:** `components/timeline/TimelineList.tsx` uses `FlatList` with conservative `initialNumToRender`, `windowSize`, and `maxToRenderPerBatch`. Variable-height rows avoid `removeClippedSubviews` unless profiling shows a safe win. If entries grow very large and profiling shows list cost, evaluate **FlashList** (`@shopify/flash-list`) and measure again.
- **Fonts / splash:** `app/_layout.tsx` — only change loading strategy if TTI metrics justify it.
- **Contexts:** `contexts/` — split or narrow values only if the profiler shows avoidable re-renders.

## When not to optimize

Do not add `useMemo`/`useCallback` for theoretical wins. Do not treat tree depth as primary evidence; use profiler timelines and re-render counts.
