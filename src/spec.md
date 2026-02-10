# Specification

## Summary
**Goal:** Correct monthly progression/compounding for time-based habits so Plank increases by +15 seconds per month, Squash stays constant, and all other habits continue using the existing behavior.

**Planned changes:**
- Backend: Adjust monthly compounding logic so habit named "Plank" (unitType="time") compounds future months by exactly +15 seconds per month (seconds-accurate), while habit named "Squash" (unitType="time") does not compound and remains constant across future months.
- Backend: Fix unitType initialization during volume updates so that when a habit has no volumeTracking and an incoming entry includes a timeString, volumeTracking.unitType is initialized to "time" (preventing accidental "reps" compounding rules).
- Frontend: Ensure time volume display reflects backend-returned seconds-accurate values for Plank across months and constant values for Squash, without changing display/progression behavior for other habits.

**User-visible outcome:** When users set Plank to a time value in a given month, future months increase by 15 seconds each month (e.g., 1:00 → 1:15 → 1:30). When users set Squash to a time value, all months show the same time (e.g., 45:00). All other habits behave as they did before.
