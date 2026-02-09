# Specification

## Summary
**Goal:** Ensure each day number in the habit tracker header aligns perfectly with its corresponding checkbox column for any month length, on both mobile and desktop.

**Planned changes:**
- Update the habit tracker grid layout so header day cells and checkbox cells share the same fixed column width and padding strategy across HabitGrid and HabitRow.
- Ensure header and body use the same column sizing mechanism so horizontal scrolling (when present) keeps day numbers and checkboxes aligned without drift across all visible and off-screen day columns.

**User-visible outcome:** When viewing any month (28–31 days), day numbers appear centered directly above the matching daily checkboxes on mobile and desktop, and remain aligned while horizontally scrolling.
