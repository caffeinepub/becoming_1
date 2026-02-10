# Specification

## Summary
**Goal:** Correct monthly total volume calculations for all habit types and add an accurate selected-month aggregate total volume summary.

**Planned changes:**
- Fix per-habit monthly total volume calculations for the selected month:
  - Numeric workout-style volumes: (per-completion volume) × (number of completed days)
  - Reps habits: (per-completion reps) × (number of completed days)
  - Time habits: (per-completion time) × (number of completed days), computed in seconds (using timeString when available) and formatted as M:SS, without relying on special-cased habit names
- Ensure monthly totals update correctly immediately after toggling completion checkboxes and React Query-driven re-renders.
- Add a selected-month aggregate total volume summary that sums across all habits and displays at minimum:
  - Total reps (sum of all reps habits’ monthly totals)
  - Total time (sum of all time habits’ monthly totals in seconds, formatted as M:SS)
  - Total workout numeric volume (sum of all workout-style numeric monthly totals, if present)
- Update aggregate totals when the selected month changes, and show 0 (or 0:00) when a category has no habits.

**User-visible outcome:** Monthly totals shown per habit (reps, time, and numeric workout volume) are accurate for the selected month and update immediately when completions change, and the UI also shows an aggregate selected-month summary for total reps, total time, and total workout volume.
