# Specification

## Summary
**Goal:** Update the Monthly Volume Summary to display Plank and Squash as separate time-based metrics (in minutes) while leaving all other metrics and charts unchanged.

**Planned changes:**
- Add a "Total Plank Time" metric to the Monthly Volume Summary, showing the total plank duration for the selected month in minutes (e.g., "42 min").
- Add a "Total Squash Time" metric to the Monthly Volume Summary, showing the total squash duration for the selected month in minutes.
- Display 0 min for Plank or Squash if no data exists for the selected month.
- Ensure time-based metrics update when the selected month tab changes.
- Leave Press-ups and Squats "Total Reps" counters completely unchanged.
- Leave the Yearly Progress chart (YearlyProgressChartSection) completely unchanged.

**User-visible outcome:** The Monthly Volume Summary now shows individual "Total Plank Time" and "Total Squash Time" counters in minutes alongside the existing rep-based counters for Press-ups and Squats.
