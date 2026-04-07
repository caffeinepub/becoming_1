// mixins/activity-api.mo
// Type re-exports for the activity API surface.
// The 4 public functions (setDailyActivityEntry, getDailyActivityEntry,
// updateHabitActivityType, getMonthlyActivityAggregate) are implemented
// directly in main.mo to share the existing per-user habit state.

import ActivityTypes "../types/activity";

module {
  public type ActivityType          = ActivityTypes.ActivityType;
  public type ActivityDayEntry      = ActivityTypes.ActivityDayEntry;
  public type MonthlyActivityAggregate = ActivityTypes.MonthlyActivityAggregate;

  /// Result type for mutating activity operations.
  public type Result = { #ok; #err : Text };
};
