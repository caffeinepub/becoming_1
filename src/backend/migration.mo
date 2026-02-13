import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import AccessControl "authorization/access-control";

module {
  type Badge = {
    name : Text;
    description : Text;
    points : Nat;
    earnedTimestamp : ?Time.Time;
  };

  type DayEntries = {
    day : Nat;
    completed : Bool;
  };

  type CompletionState = {
    january : [DayEntries];
    february : [DayEntries];
    march : [DayEntries];
    april : [DayEntries];
    may : [DayEntries];
    june : [DayEntries];
    july : [DayEntries];
    august : [DayEntries];
    september : [DayEntries];
    october : [DayEntries];
    november : [DayEntries];
    december : [DayEntries];
  };

  type VolumeTracking = {
    unitType : Text;
    january : TimeVolumeEntry;
    february : TimeVolumeEntry;
    march : TimeVolumeEntry;
    april : TimeVolumeEntry;
    may : TimeVolumeEntry;
    june : TimeVolumeEntry;
    july : TimeVolumeEntry;
    august : TimeVolumeEntry;
    september : TimeVolumeEntry;
    october : TimeVolumeEntry;
    november : TimeVolumeEntry;
    december : TimeVolumeEntry;
  };

  type TimeVolumeEntry = {
    timeString : ?Text;
    minutes : ?Nat;
  };

  type Habit = {
    id : Nat;
    name : Text;
    description : Text;
    reminder : ?Time.Time;
    completion : CompletionState;
    volumeTracking : ?VolumeTracking;
  };

  type TimeZone = {
    utcOffsetMinutes : Int;
    name : Text;
  };

  type UserHabitsData = {
    nextHabitId : Nat;
    habits : [Habit];
  };

  type UserProfile = {
    name : Text;
  };

  type OldActor = {
    _initialized : Bool;
    userProfiles : Map.Map<Principal, UserProfile>;
    persistentUserHabits : Map.Map<Principal, UserHabitsData>;
    accessControlState : AccessControl.AccessControlState;
  };

  type NewActor = {
    _initialized : Bool;
    habitQuoteUserProfiles : Map.Map<Principal, UserProfile>;
    persistentUserHabits : Map.Map<Principal, UserHabitsData>;
    userTimeZones : Map.Map<Principal, TimeZone>;
    accessControlState : AccessControl.AccessControlState;
  };

  public func run(old : OldActor) : NewActor {
    {
      _initialized = old._initialized;
      habitQuoteUserProfiles = old.userProfiles;
      persistentUserHabits = old.persistentUserHabits;
      accessControlState = old.accessControlState;
      userTimeZones = Map.empty<Principal, TimeZone>();
    };
  };
};
