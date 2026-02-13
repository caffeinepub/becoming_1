# Specification

## Summary
**Goal:** Add a responsive “Yearly Progress” grouped bar chart (current year only) above the existing Monthly Volume Summary in the Becoming view.

**Planned changes:**
- Add a new “Yearly Progress” section above “Monthly Volume Summary” in the Becoming view, shown under the same general visibility conditions as the existing summary (when habits are available).
- Compute Jan–Dec monthly aggregates from existing saved daily habit data: (1) Total Reps (sum across all habits) and (2) Total Time converted from seconds to hours (sum across all habits).
- Render a responsive grouped bar chart with Jan–Dec on the x-axis and an automatically scaling y-axis based on computed totals, including a clear legend for “Total Reps” and “Total Time (hours)”.
- Style the new chart section to match the current UI using existing components/tokens with blue and gray tones; keep the existing Monthly Volume Summary unchanged below it.

**User-visible outcome:** In the Becoming view, users see a new Yearly Progress chart for the current year that updates automatically as they record daily habit completions, while the Monthly Volume Summary remains as-is beneath it.
