# Specification

## Summary
**Goal:** Rotate the app’s daily motivational quote once per day at 08:00 UK time for all users, and ensure the quote banner displays and updates correctly without relying on a user-set time zone.

**Planned changes:**
- Update backend quote selection so `getTodaysQuote()` returns a single shared “UK quote-day” quote for all users, rotating daily at 08:00 Europe/London time (respecting GMT/BST) using the existing stored quotes list in `backend/main.mo`.
- Update the quote banner (DailyMotivationalQuote) to remove the time zone prompt requirement and load/display the daily quote for authenticated users regardless of whether they have saved a time zone.
- Add frontend logic to automatically refresh the displayed quote shortly after the next 08:00 UK time rollover while the app remains open, without excessive polling.

**User-visible outcome:** All users see the same motivational quote each UK quote-day, it changes at 08:00 UK time year-round, the quote displays without prompting for a time zone, and it updates automatically if the app stays open across the rollover.
