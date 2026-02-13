# Specification

## Summary
**Goal:** Use a single user-defined fixed time zone (persisted per user) to deterministically rotate the daily quote at the user’s local midnight.

**Planned changes:**
- Add backend methods for logged-in users to set and fetch a persisted fixed time zone value (stored per Principal and preserved across upgrades).
- Implement backend deterministic quote-of-the-day rotation using the static list of 50 quotes, advancing at midnight in the user’s saved fixed time zone and remaining stable throughout the day.
- Update the frontend daily quote feature to fetch the quote from the backend and, when no time zone is configured, show an inline English prompt to set a time zone (instead of an error/unavailable state), updating without a full page reload after setting.
- Add upgrade-safe backend state migration (as needed) to ensure existing stored data is preserved and new time zone/quote state initializes safely.

**User-visible outcome:** Users can set a fixed time zone and then see a stable daily quote that changes at their local midnight, with quote rotation continuing correctly across app upgrades.
