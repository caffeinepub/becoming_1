# Specification

## Summary
**Goal:** Stop the mobile app from getting stuck indefinitely on the loading/skeleton screen after Version 18 by surfacing actor/initialization failures (including timeouts) as a clear error state with a retry path.

**Planned changes:**
- Add bounded-time actor initialization (actor creation + `_initializeAccessControlWithSecret(...)`) so it cannot hang indefinitely; propagate deterministic timeout/initialization errors up to the frontend.
- Update frontend loading-state logic so skeleton UI is only shown during an active, bounded loading attempt, and error states take precedence (especially for authenticated users).
- Add a user-visible error screen/banner in English with a primary **Retry** action that re-attempts actor initialization (if needed) and refetches habits, without requiring a tab/app restart.

**User-visible outcome:** On mobile, the app no longer stays stuck on the skeleton forever; if loading fails, the user sees an error message with a Retry button, and if loading succeeds the UI transitions to the authenticated habit/monthly totals view without manual refresh.
