import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  type CompletionState = {
    january : [{ day : Nat; completed : Bool }];
    february : [{ day : Nat; completed : Bool }];
    march : [{ day : Nat; completed : Bool }];
    april : [{ day : Nat; completed : Bool }];
    may : [{ day : Nat; completed : Bool }];
    june : [{ day : Nat; completed : Bool }];
    july : [{ day : Nat; completed : Bool }];
    august : [{ day : Nat; completed : Bool }];
    september : [{ day : Nat; completed : Bool }];
    october : [{ day : Nat; completed : Bool }];
    november : [{ day : Nat; completed : Bool }];
    december : [{ day : Nat; completed : Bool }];
  };

  type Habit = {
    id : Nat;
    name : Text;
    description : Text;
    reminder : ?Int;
    completion : CompletionState;
    volumeTracking : ?{
      unitType : Text;
      january : { timeString : ?Text; minutes : ?Nat };
      february : { timeString : ?Text; minutes : ?Nat };
      march : { timeString : ?Text; minutes : ?Nat };
      april : { timeString : ?Text; minutes : ?Nat };
      may : { timeString : ?Text; minutes : ?Nat };
      june : { timeString : ?Text; minutes : ?Nat };
      july : { timeString : ?Text; minutes : ?Nat };
      august : { timeString : ?Text; minutes : ?Nat };
      september : { timeString : ?Text; minutes : ?Nat };
      october : { timeString : ?Text; minutes : ?Nat };
      november : { timeString : ?Text; minutes : ?Nat };
      december : { timeString : ?Text; minutes : ?Nat };
    };
  };

  type UserHabitsData = {
    nextHabitId : Nat;
    habits : [Habit];
  };

  public type OldActor = {
    userProfiles : Map.Map<Principal, { name : Text }>;
    persistentUserHabits : Map.Map<Principal, UserHabitsData>;
  };

  public type NewActor = {
    userProfiles : Map.Map<Principal, { name : Text }>;
    persistentUserHabits : Map.Map<Principal, UserHabitsData>;
  };

  func mapVolumeTracking(oldVolumeTracking : ?{ unitType : Text }) : ?{
    unitType : Text;
    january : { timeString : ?Text; minutes : ?Nat };
    february : { timeString : ?Text; minutes : ?Nat };
    march : { timeString : ?Text; minutes : ?Nat };
    april : { timeString : ?Text; minutes : ?Nat };
    may : { timeString : ?Text; minutes : ?Nat };
    june : { timeString : ?Text; minutes : ?Nat };
    july : { timeString : ?Text; minutes : ?Nat };
    august : { timeString : ?Text; minutes : ?Nat };
    september : { timeString : ?Text; minutes : ?Nat };
    october : { timeString : ?Text; minutes : ?Nat };
    november : { timeString : ?Text; minutes : ?Nat };
    december : { timeString : ?Text; minutes : ?Nat };
  } {
    switch (oldVolumeTracking) {
      case (null) { null };
      case (?tracking) {
        ?{
          unitType = tracking.unitType;
          january = { timeString = null; minutes = ?0 };
          february = { timeString = null; minutes = ?0 };
          march = { timeString = null; minutes = ?0 };
          april = { timeString = null; minutes = ?0 };
          may = { timeString = null; minutes = ?0 };
          june = { timeString = null; minutes = ?0 };
          july = { timeString = null; minutes = ?0 };
          august = { timeString = null; minutes = ?0 };
          september = { timeString = null; minutes = ?0 };
          october = { timeString = null; minutes = ?0 };
          november = { timeString = null; minutes = ?0 };
          december = { timeString = null; minutes = ?0 };
        };
      };
    };
  };

  public func run(old : OldActor) : NewActor {
    let newPersistentUserHabits = old.persistentUserHabits.map<Principal, UserHabitsData, UserHabitsData>(
      func(_principal, userHabitsData) {
        let newHabits = userHabitsData.habits.map(
          func(habit) {
            { habit with volumeTracking = mapVolumeTracking(habit.volumeTracking) };
          }
        );
        { userHabitsData with habits = newHabits };
      }
    );
    {
      old with
      persistentUserHabits = newPersistentUserHabits;
    };
  };
};
