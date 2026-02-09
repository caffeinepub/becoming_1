# Specification

## Summary
**Goal:** Remove all goal-related UI from habit tracking and editing so the app shows only monthly totals (no goals).

**Planned changes:**
- Update habit row rendering to remove any “Goal” line from the habit info cell and remove the “/ Goal: …” segment from the monthly total area (monthly total shows only its value).
- Update the habit edit modal to remove any “Monthly Goal” UI and prevent editing/storing a per-month goal value via the UI.
- Adjust modal inputs so “Volume per completion” is shown only for unit types “reps” and “time”, and hidden for all other unit types.
- Perform a pass across habit-related screens/components to ensure no goal-related copy (e.g., “Goal:”, “Monthly Goal”) renders anywhere, including empty/zero values, while keeping monthly totals visible as they are today.

**User-visible outcome:** Habit rows and month views display only “Monthly total: <value>” with no goal labels/values, and the habit edit modal contains no goal fields (while still supporting volume per completion for reps/time habits).
