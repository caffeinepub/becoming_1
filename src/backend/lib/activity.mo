// lib/activity.mo
// Domain logic for multi-field fitness activity tracking.
// Stateless module — all state is injected by the caller.

import Array "mo:core/Array";
import ActivityTypes "../types/activity";

module {
  public type ActivityType        = ActivityTypes.ActivityType;
  public type ActivityDayEntry    = ActivityTypes.ActivityDayEntry;
  public type ActivityData        = ActivityTypes.ActivityData;
  public type MonthActivityLog    = ActivityTypes.MonthActivityLog;
  public type MonthlyActivityAggregate = ActivityTypes.MonthlyActivityAggregate;
  public type RunningEntry        = ActivityTypes.RunningEntry;
  public type CyclingEntry        = ActivityTypes.CyclingEntry;
  public type StrengthEntry       = ActivityTypes.StrengthEntry;
  public type SwimmingEntry       = ActivityTypes.SwimmingEntry;

  /// Returns an empty ActivityData record (all 12 months empty).
  public func emptyActivityData() : ActivityData {
    {
      january   = [];
      february  = [];
      march     = [];
      april     = [];
      may       = [];
      june      = [];
      july      = [];
      august    = [];
      september = [];
      october   = [];
      november  = [];
      december  = [];
    };
  };

  /// Returns the MonthActivityLog for the given 0-based month index (0 = January).
  public func getMonthLog(data : ActivityData, month : Nat) : MonthActivityLog {
    switch (month) {
      case (0)  { data.january };
      case (1)  { data.february };
      case (2)  { data.march };
      case (3)  { data.april };
      case (4)  { data.may };
      case (5)  { data.june };
      case (6)  { data.july };
      case (7)  { data.august };
      case (8)  { data.september };
      case (9)  { data.october };
      case (10) { data.november };
      case (11) { data.december };
      case (_)  { [] };
    };
  };

  /// Returns a new ActivityData with the given entry set for (month, day).
  /// Replaces any existing entry for that day.
  public func setDayEntry(
    data  : ActivityData,
    month : Nat,
    day   : Nat,
    entry : ActivityDayEntry,
  ) : ActivityData {
    let currentLog = getMonthLog(data, month);
    // Remove any existing entry for the day, then append the new one
    let filtered = currentLog.filter(func(pair) {
      let (d, _) = pair;
      d != day
    });
    let newLog : MonthActivityLog = filtered.concat<(Nat, ActivityDayEntry)>([(day, entry)]);
    replaceMonthLog(data, month, newLog);
  };

  /// Returns the ActivityDayEntry for (month, day), or null if absent.
  public func getDayEntry(
    data  : ActivityData,
    month : Nat,
    day   : Nat,
  ) : ?ActivityDayEntry {
    let log = getMonthLog(data, month);
    switch (log.find<(Nat, ActivityDayEntry)>(func(pair) {
      let (d, _) = pair;
      d == day
    })) {
      case (?(_, entry)) { ?entry };
      case null { null };
    };
  };

  /// Aggregates a MonthActivityLog into distance km and total reps.
  public func aggregateMonth(log : MonthActivityLog) : MonthlyActivityAggregate {
    var totalDistanceKm : Float = 0.0;
    var totalReps : Nat = 0;

    for (pair in log.vals()) {
      let (_, entry) = pair;
      switch (entry) {
        case (#running(r))   { totalDistanceKm += r.distance };
        case (#cycling(c))   { totalDistanceKm += c.distance };
        case (#swimming(s))  { totalDistanceKm += s.distance };
        case (#strength(st)) { totalReps += st.sets * st.reps };
      };
    };

    { totalDistanceKm; totalReps };
  };

  // Helper: replace the month log at the given 0-based index
  func replaceMonthLog(data : ActivityData, month : Nat, newLog : MonthActivityLog) : ActivityData {
    switch (month) {
      case (0)  { { data with january   = newLog } };
      case (1)  { { data with february  = newLog } };
      case (2)  { { data with march     = newLog } };
      case (3)  { { data with april     = newLog } };
      case (4)  { { data with may       = newLog } };
      case (5)  { { data with june      = newLog } };
      case (6)  { { data with july      = newLog } };
      case (7)  { { data with august    = newLog } };
      case (8)  { { data with september = newLog } };
      case (9)  { { data with october   = newLog } };
      case (10) { { data with november  = newLog } };
      case (11) { { data with december  = newLog } };
      case (_)  { data };
    };
  };
};
