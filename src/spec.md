# Specification

## Summary
**Goal:** Correct calendar-month time progression for the “Plank” and “Squash” habits so monthly volumes display, persist, and optimistically update as intended.

**Planned changes:**
- Fix backend monthly progression logic so “Plank” increases by exactly +15 seconds per calendar month and “Squash” stays constant at 45:00 for every month, without affecting other habits.
- Ensure backend time-based volume updates correctly set/preserve `unitType` as `"time"` when a `timeString` is provided, preventing time habits from using default “reps” compounding rules.
- Update frontend optimistic compounding during volume edits to match the corrected calendar-month rules for “Plank” (+15s/month) and “Squash” (constant 45:00), leaving other habits unchanged.

**User-visible outcome:** When editing or viewing monthly volumes, Plank progresses by +15 seconds each calendar month (e.g., Feb 1:15 → Mar 1:30 → Apr 1:45), Squash remains 45:00 across Jan–Dec, and values remain consistent after saving and refreshing.
