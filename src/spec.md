# Specification

## Summary
**Goal:** Fix habit monthly volume calculations and time-target rules so Plank progresses by +15 seconds per month after February, Squash stays fixed at 45:00, and monthly totals correctly sum only completed (ticked) days.

**Planned changes:**
- Correct Plank month-to-month progression: February is the base at 1:15, and each month after February increases the *daily* Plank target by +15 seconds (e.g., Mar 1:30, Apr 1:45), avoiding minutes-vs-seconds errors.
- Keep Squash daily target fixed at 45:00 for every month (no compounding), and ensure this fixed value persists and is used in calculations after refresh.
- Update monthly totals for all habits to compute as: (number of ticked days in the selected month) × (that habit’s per-day target for that month), including seconds-accurate aggregation/formatting for time-based habits and consistent totals in the Monthly Volume Summary.

**User-visible outcome:** When switching months and ticking days as completed, each habit’s Monthly total and the Monthly Volume Summary update to the correct totals; Plank shows a +15s-per-month daily target after February (e.g., 1:30 in March), and Squash remains 45:00 in every month.
