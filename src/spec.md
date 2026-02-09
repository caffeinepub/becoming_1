# Specification

## Summary
**Goal:** Fix monthly total calculations for non-reps/time habits (showing totals and goals) and simplify habit editing so edit controls aren’t visible on the main grid.

**Planned changes:**
- Update monthly total calculation for habits with unitType not equal to "reps" and not equal to "time" so the monthly total equals the count of checked days for the selected month.
- In the existing monthly totals/volumes area for each habit row, display both "Monthly total" and "Goal" for non-(reps/time) habits, where the goal is the configured monthly volume value for the selected month.
- Ensure the "16/8 fasting" habit follows the same non-(reps/time) monthly total behavior when its unitType is not "reps" or "time".
- Remove inline per-field edit buttons (name/unit/volume) from the main habit grid (including hover/touch behavior).
- Make clicking/tapping a habit row open a small contextual pop-up with a single pencil/edit action.
- Open a full habit edit modal from that pencil action, allowing edits to all currently editable habit details (including name, unit type, and the selected month’s volume/goal), using existing save/cancel behavior and validations.

**User-visible outcome:** Monthly totals for checkbox-style habits (including 16/8 fasting when not reps/time) match the number of checked days and show the goal next to the total; editing is cleaner, with a single edit entry point via a pop-up and a full edit modal instead of multiple inline edit buttons.
