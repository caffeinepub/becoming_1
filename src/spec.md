# Specification

## Summary
**Goal:** On mobile, keep the left “Habit” info column visible (sticky) while horizontally scrolling the habit day columns, including during loading/skeleton state.

**Planned changes:**
- Update the mobile habit grid layout so the first column (header “Habit” cell and each habit row’s left info cell) uses sticky positioning during horizontal scroll.
- Ensure the sticky column has an opaque background and appropriate z-index so scrolling day columns don’t show through underneath it.
- Apply the same sticky-first-column behavior to the grid loading/skeleton state on mobile.
- Preserve existing behavior on tablet/desktop (no sticky first column).

**User-visible outcome:** On a phone-sized screen, users can horizontally scroll through days while the left Habit details remain pinned on the left (including while the grid is loading), with no visual bleed-through from the scrolling columns.
