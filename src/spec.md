# Specification

## Summary
**Goal:** Remove the “Total Volume” item from the Monthly Volume Summary UI while keeping other monthly summary items unchanged.

**Planned changes:**
- Update `frontend/src/features/becoming/components/MonthlyVolumeSummary.tsx` to never render the “Total Volume” label/value tile/row.
- Preserve existing rendering behavior for “Total Reps” (when reps-based habits exist) and “Total Time” (when time-based habits exist).
- Make no changes to other parts of the app (habit rows, edit modal, other summaries) and no backend/logic changes.

**User-visible outcome:** The Monthly Volume Summary section will only show “Total Reps” and/or “Total Time” when applicable, and will no longer display any “Total Volume” entry.
