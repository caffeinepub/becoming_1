// types/activity.mo
// Domain-specific types for multi-field fitness activity tracking.
// Extends existing habit model with structured per-activity data.

module {
  /// Identifies the category of a fitness habit.
  public type ActivityType = {
    #running;
    #cycling;
    #strengthTraining;
    #swimming;
    #freeform;
  };

  /// Per-day entry for a Running session.
  public type RunningEntry = {
    distance : Float;         // km
    duration : ?Text;         // optional M:SS
    pace     : ?Text;         // optional, e.g. "5:30/km" — derived or user-supplied
  };

  /// Per-day entry for a Cycling session.
  public type CyclingEntry = {
    distance  : Float;        // km
    duration  : ?Text;        // optional M:SS
    intensity : ?Text;        // "Easy" | "Moderate" | "Hard" | "Max"
  };

  /// Per-day entry for a Strength Training session.
  public type StrengthEntry = {
    exerciseName : Text;
    sets         : Nat;
    reps         : Nat;
    weight       : Float;     // numeric value
    unit         : Text;      // "kg" | "lbs"
  };

  /// Per-day entry for a Swimming session.
  public type SwimmingEntry = {
    distance   : Float;       // km
    duration   : ?Text;       // optional M:SS
    strokeType : ?Text;       // "Freestyle" | "Breaststroke" | "Backstroke" | "Butterfly" | "Mixed"
  };

  /// Discriminated union covering all multi-field activity entry types.
  public type ActivityDayEntry = {
    #running  : RunningEntry;
    #cycling  : CyclingEntry;
    #strength : StrengthEntry;
    #swimming : SwimmingEntry;
  };

  /// Per-month activity log stored as (day → entry) mapping.
  /// Represented as a flat array of (day, entry) pairs for shareability.
  public type MonthActivityLog = [(Nat, ActivityDayEntry)];

  /// 12-month activity data container for a single habit.
  public type ActivityData = {
    january   : MonthActivityLog;
    february  : MonthActivityLog;
    march     : MonthActivityLog;
    april     : MonthActivityLog;
    may       : MonthActivityLog;
    june      : MonthActivityLog;
    july      : MonthActivityLog;
    august    : MonthActivityLog;
    september : MonthActivityLog;
    october   : MonthActivityLog;
    november  : MonthActivityLog;
    december  : MonthActivityLog;
  };

  /// Monthly aggregate for a habit — distance-based (Running/Cycling/Swimming)
  /// or rep-based (Strength).
  public type MonthlyActivityAggregate = {
    totalDistanceKm  : Float;  // Running / Cycling / Swimming
    totalReps        : Nat;    // Strength (sets × reps summed)
  };
};
