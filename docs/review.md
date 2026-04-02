# Codebase Review (Performance, UX, and General Quality)

Date: 2026-04-02

## Executive Summary

This codebase has a strong foundation: clear separation between UI (`views`/`components`), orchestration (`agents`), and service adapters (`services`). The app concept and interaction model are cohesive.

The biggest opportunities are around:

1. **Client-side performance under interaction-heavy usage** (many RPC calls and audio layer updates).
2. **UX resilience** for async operations (loading/error feedback and state consistency).
3. **Data correctness/security modeling** in scene ownership and indexing.

## Priority Findings

### P0 / High Impact

1. **Potential ownership/indexing bug in `user_scenes` schema and upsert strategy.**
   - `userScenes` uses `sceneId` as a **primary key**, which allows only one row per scene globally.
   - Current behavior appears to model ownership transfer (`claimScene`) which may be intentional, but this schema prevents keeping historical ownership or collaborative access later.
   - If scene indexing should be strictly per-user, consider composite PK/unique key (`sceneId`, `userId`) and query changes.

2. **Unbounded per-layer update RPC frequency can degrade responsiveness.**
   - Volume/pan sliders call `agent.call("updateLayer", ...)` on every input event.
   - For rapid dragging this can produce many DO writes and websocket messages.
   - Add debounce/throttle (e.g., 50–100ms) or local optimistic updates with periodic flush.

3. **`SceneMixer` has several fire-and-forget async calls without robust failure UX.**
   - Critical user actions (`publish`, `unpublish`, `claimScene`, layer ops) generally swallow errors.
   - This can lead to mismatches between perceived and actual server state.
   - Introduce action-scoped pending/error state and explicit retry affordances.

### P1 / Medium Impact

4. **Playback lifecycle edge cases can desynchronize UI and engine state.**
   - `playing` is UI-local; layer mutations and navigation events can occur while audio operations are in-flight.
   - Consider deriving play status from engine state plus guardrails for route transitions.

5. **Route handling is manual and mostly correct, but brittle as app scope grows.**
   - Path parsing is repeated and state transitions are ad hoc.
   - Introduce a tiny centralized router utility or React Router if feature scope expands.

6. **`decomposeScene` fallback may violate requested layer count.**
   - On parse failure it returns one fallback layer, regardless of `layerCount`.
   - Better fallback: deterministic synthetic layers up to requested count or explicit user error state.

7. **No explicit cancellation for long-running generation tasks.**
   - User can navigate away mid-generation; work continues server-side.
   - Add cancel tokens/task IDs or background job metadata to improve perceived control.

### P2 / Nice-to-have

8. **Repeated `localStorage` parse/write patterns could be batched.**
   - `getOwnedScenes` is called frequently in some flows.
   - Cache in-memory per tab and flush changes to reduce synchronous storage cost.

9. **Accessibility polish opportunities.**
   - Some clickable cards are `div`/`Card` with `onClick`; keyboard/ARIA semantics can be improved.
   - Add focus-visible styles and keyboard interaction consistency for non-button elements.

10. **Minor cleanup opportunities.**
   - Duplicate comment in `regenerateLayer` method.
   - Temporary `forkAgent` Promise wrapper in `handleFork` is unnecessary complexity.

## Detailed Notes by Area

### Frontend performance

- **High-frequency RPC from sliders:**
  - `LayerCard` slider `onChange` directly triggers `onVolumeChange` / `onPanChange`.
  - `SceneMixer` forwards each call to durable object.
  - Recommendation: keep instantaneous WebAudio response local, batch network sync.

- **Potential avoidable re-renders:**
  - `SceneMixer` is large and manages many concerns in one component.
  - Recommendation: split into subcomponents (`SceneHeader`, `LayerList`, `AddLayerPanel`) and memoize stable props.

- **Audio fetch/decode behavior:**
  - `PlaybackEngine.loadLayer` fetches/decode per layer; okay for current sizes.
  - Recommendation: add preloading progress and timeout/error handling for individual layers.

### UX

- **Loading and error affordances are uneven.**
  - Good loading spinner in `MyScenesView`, but many async actions have no feedback.
  - Recommendation: toast/snackbar + inline status for publish/regenerate/add/remove operations.

- **Share UX is solid but could provide persistent confirmation.**
  - `Copied!` appears via `shareUrl` presence; could stale.
  - Recommendation: explicit ephemeral toast and separate "isPublic" indicator.

- **Scene creation flow is smooth.**
  - Prompt presets and animated progressive reveal are positive.
  - Recommendation: support Enter/Cmd+Enter submission for faster keyboard flow.

### Backend / data quality

- **API validation is minimal.**
  - `/api/my-scenes` POST checks existence but not shape/length constraints.
  - `/api/claim-scenes` checks array but not max size.
  - Recommendation: validate payloads with Zod and enforce bounds.

- **Public audio endpoint uses wildcard CORS.**
  - Likely acceptable for public assets, but decide intentionally.
  - Recommendation: if private scenes/audio emerge, gate by signed URLs or ownership checks.

- **State update granularity in agent methods.**
  - Many methods clone full state objects repeatedly.
  - Recommendation: helper utilities to reduce repetition and mutation risk.

## Suggested Next Iteration Plan

1. Add a lightweight action state system in `SceneMixer` for pending/error notifications.
2. Debounce slider-to-DO writes while keeping immediate local audio updates.
3. Harden API payload validation (`/api/my-scenes`, `/api/claim-scenes`).
4. Revisit `user_scenes` key strategy based on intended ownership model.
5. Refactor `SceneMixer` into focused subcomponents and add tests around critical flows.

## Strengths Worth Keeping

- Clean conceptual architecture (Agent orchestration + service adapters).
- Good use of local ownership cache to reduce login friction.
- Audio engine abstraction is clear and self-contained.
- UI style and interaction consistency are already strong for hackathon-level velocity.
