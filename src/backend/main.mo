import Map "mo:core/Map";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";



actor {
  var _initialized : Bool = false;
  var accessControlState : AccessControl.AccessControlState = AccessControl.initState();

  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Habit tracking

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

  type DayEntries = {
    day : Nat;
    completed : Bool;
  };

  // Time Entries

  public type TimeVolumeEntry = {
    timeString : ?Text;
    minutes : ?Nat;
  };

  public type VolumeTracking = {
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

  type Habit = {
    id : Nat;
    name : Text;
    description : Text;
    reminder : ?Time.Time;
    completion : CompletionState;
    volumeTracking : ?VolumeTracking;
  };

  type UserHabitsData = {
    nextHabitId : Nat;
    habits : [Habit];
  };

  module Habit {
    public func create(name : Text, description : Text, reminder : ?Time.Time, nextId : Nat) : (Habit, Nat) {
      let id = nextId + 1;

      (
        {
          id;
          name;
          description;
          reminder;
          completion = initializeCompletionState();
          volumeTracking = null;
        },
        id,
      );
    };

    func initializeCompletionState() : CompletionState {
      let emptyMonth = Array.tabulate(
        31,
        func(i) {
          { day = (i + 1); completed = false };
        },
      );
      {
        january = emptyMonth;
        february = emptyMonth;
        march = emptyMonth;
        april = emptyMonth;
        may = emptyMonth;
        june = emptyMonth;
        july = emptyMonth;
        august = emptyMonth;
        september = emptyMonth;
        october = emptyMonth;
        november = emptyMonth;
        december = emptyMonth;
      };
    };

    public func markComplete(month : Nat, day : Nat, completed : Bool, habit : Habit) : Habit {
      var currentMonth = habit.completion.january;
      if (month >= 1 and month <= 12) {
        currentMonth := switch (month) {
          case (1) { habit.completion.february };
          case (2) { habit.completion.march };
          case (3) { habit.completion.april };
          case (4) { habit.completion.may };
          case (5) { habit.completion.june };
          case (6) { habit.completion.july };
          case (7) { habit.completion.august };
          case (8) { habit.completion.september };
          case (9) { habit.completion.october };
          case (10) { habit.completion.november };
          case (11) { habit.completion.december };
          case (_) { habit.completion.january };
        };
      };

      let newMonth = currentMonth.map(
        func(dayEntry) {
          if (dayEntry.day == day) {
            { day = dayEntry.day; completed };
          } else {
            dayEntry;
          };
        }
      );

      var newCompletion = habit.completion;
      switch (month) {
        case (0) { newCompletion := { newCompletion with january = newMonth } };
        case (1) { newCompletion := { newCompletion with february = newMonth } };
        case (2) { newCompletion := { newCompletion with march = newMonth } };
        case (3) { newCompletion := { newCompletion with april = newMonth } };
        case (4) { newCompletion := { newCompletion with may = newMonth } };
        case (5) { newCompletion := { newCompletion with june = newMonth } };
        case (6) { newCompletion := { newCompletion with july = newMonth } };
        case (7) { newCompletion := { newCompletion with august = newMonth } };
        case (8) { newCompletion := { newCompletion with september = newMonth } };
        case (9) { newCompletion := { newCompletion with october = newMonth } };
        case (10) { newCompletion := { newCompletion with november = newMonth } };
        case (11) { newCompletion := { newCompletion with december = newMonth } };
        case (_) {};
      };

      {
        habit with
        completion = newCompletion;
      };
    };

    func updateMonthEntry(volumeTracking : VolumeTracking, month : Nat, entry : TimeVolumeEntry) : VolumeTracking {
      switch (month) {
        case (0) { { volumeTracking with january = entry } };
        case (1) { { volumeTracking with february = entry } };
        case (2) { { volumeTracking with march = entry } };
        case (3) { { volumeTracking with april = entry } };
        case (4) { { volumeTracking with may = entry } };
        case (5) { { volumeTracking with june = entry } };
        case (6) { { volumeTracking with july = entry } };
        case (7) { { volumeTracking with august = entry } };
        case (8) { { volumeTracking with september = entry } };
        case (9) { { volumeTracking with october = entry } };
        case (10) { { volumeTracking with november = entry } };
        case (11) { { volumeTracking with december = entry } };
        case (_) { volumeTracking };
      };
    };

    public func updateVolumeTracking(habit : Habit, month : Nat, entry : TimeVolumeEntry) : Habit {
      let updatedVolumeTracking = switch (habit.volumeTracking) {
        case (null) {
          let newTracking : VolumeTracking = {
            unitType = "reps";
            january = if (month == 0) { entry } else { defaultVolumeEntry() };
            february = if (month == 1) { entry } else { defaultVolumeEntry() };
            march = if (month == 2) { entry } else { defaultVolumeEntry() };
            april = if (month == 3) { entry } else { defaultVolumeEntry() };
            may = if (month == 4) { entry } else { defaultVolumeEntry() };
            june = if (month == 5) { entry } else { defaultVolumeEntry() };
            july = if (month == 6) { entry } else { defaultVolumeEntry() };
            august = if (month == 7) { entry } else { defaultVolumeEntry() };
            september = if (month == 8) { entry } else { defaultVolumeEntry() };
            october = if (month == 9) { entry } else { defaultVolumeEntry() };
            november = if (month == 10) { entry } else { defaultVolumeEntry() };
            december = if (month == 11) { entry } else { defaultVolumeEntry() };
          };
          newTracking;
        };
        case (?existingVolumeTracking) { updateMonthEntry(existingVolumeTracking, month, entry) };
      };
      { habit with volumeTracking = ?updatedVolumeTracking };
    };

    public func updateUnitType(habit : Habit, unitType : Text) : Habit {
      let updatedVolumeTracking = switch (habit.volumeTracking) {
        case (null) {
          {
            unitType;
            january = defaultVolumeEntry();
            february = defaultVolumeEntry();
            march = defaultVolumeEntry();
            april = defaultVolumeEntry();
            may = defaultVolumeEntry();
            june = defaultVolumeEntry();
            july = defaultVolumeEntry();
            august = defaultVolumeEntry();
            september = defaultVolumeEntry();
            october = defaultVolumeEntry();
            november = defaultVolumeEntry();
            december = defaultVolumeEntry();
          };
        };
        case (?existingVolumeTracking) { { existingVolumeTracking with unitType } };
      };
      { habit with volumeTracking = ?updatedVolumeTracking };
    };

    func updateForTimeUnit(
      habit : Habit,
      monthIndex : Nat,
      entry : TimeVolumeEntry,
      compound : Bool,
    ) : Habit {
      let updatedHabit = if (habit.volumeTracking == null) {
        let baseVolumeTracking = {
          unitType = "time";
          january = if (monthIndex == 0) { entry } else { defaultVolumeEntry() };
          february = if (monthIndex == 1) { entry } else { defaultVolumeEntry() };
          march = if (monthIndex == 2) { entry } else { defaultVolumeEntry() };
          april = if (monthIndex == 3) { entry } else { defaultVolumeEntry() };
          may = if (monthIndex == 4) { entry } else { defaultVolumeEntry() };
          june = if (monthIndex == 5) { entry } else { defaultVolumeEntry() };
          july = if (monthIndex == 6) { entry } else { defaultVolumeEntry() };
          august = if (monthIndex == 7) { entry } else { defaultVolumeEntry() };
          september = if (monthIndex == 8) { entry } else { defaultVolumeEntry() };
          october = if (monthIndex == 9) { entry } else { defaultVolumeEntry() };
          november = if (monthIndex == 10) { entry } else { defaultVolumeEntry() };
          december = if (monthIndex == 11) { entry } else { defaultVolumeEntry() };
        };
        { habit with volumeTracking = ?baseVolumeTracking };
      } else {
        habit;
      };

      let newVolumeTracking = switch (updatedHabit.volumeTracking) {
        case (null) { defaultVolumeTracking() };
        case (?volumeTracking) {
          if (compound) {
            compoundVolumesFromMonthIndex(volumeTracking, updatedHabit.name, monthIndex, entry, "time");
          } else {
            updateMonthEntry(volumeTracking, monthIndex, entry);
          };
        };
      };

      { updatedHabit with volumeTracking = ?newVolumeTracking };
    };

    func getUnderlyingUnitType(habit : Habit, entry : TimeVolumeEntry) : Text {
      switch (habit.volumeTracking, entry.timeString) {
        case (null, null) { "reps" };
        case (null, ?_value) { "time" };
        case (?volumeTracking, _) { volumeTracking.unitType };
      };
    };

    public func updateAndCompoundVolumeTracking(
      habit : Habit,
      monthIndex : Nat,
      entry : TimeVolumeEntry,
    ) : Habit {
      let unitType = getUnderlyingUnitType(habit, entry);
      switch (unitType, entry.timeString) {
        case ("time", ?_value) {
          updateForTimeUnit(
            habit,
            monthIndex,
            entry,
            true,
          );
        };
        case ("time", _) {
          updateForTimeUnit(
            habit,
            monthIndex,
            entry,
            false,
          );
        };
        case (_, _) {
          let updatedVolumeTracking = switch (habit.volumeTracking) {
            case (null) {
              let baseVolumeTracking = {
                unitType;
                january = if (monthIndex == 0) { entry } else { defaultVolumeEntry() };
                february = if (monthIndex == 1) { entry } else { defaultVolumeEntry() };
                march = if (monthIndex == 2) { entry } else { defaultVolumeEntry() };
                april = if (monthIndex == 3) { entry } else { defaultVolumeEntry() };
                may = if (monthIndex == 4) { entry } else { defaultVolumeEntry() };
                june = if (monthIndex == 5) { entry } else { defaultVolumeEntry() };
                july = if (monthIndex == 6) { entry } else { defaultVolumeEntry() };
                august = if (monthIndex == 7) { entry } else { defaultVolumeEntry() };
                september = if (monthIndex == 8) { entry } else { defaultVolumeEntry() };
                october = if (monthIndex == 9) { entry } else { defaultVolumeEntry() };
                november = if (monthIndex == 10) { entry } else { defaultVolumeEntry() };
                december = if (monthIndex == 11) { entry } else { defaultVolumeEntry() };
              };
              compoundVolumesFromMonthIndex(baseVolumeTracking, habit.name, monthIndex, entry, unitType);
            };
            case (?existingVolumeTracking) {
              let noCompoundingVolumeTracking = updateMonthEntry(existingVolumeTracking, monthIndex, entry);
              compoundVolumesFromMonthIndex(
                noCompoundingVolumeTracking,
                habit.name,
                monthIndex,
                entry,
                unitType,
              );
            };
          };
          { habit with volumeTracking = ?updatedVolumeTracking };
        };
      };
    };

    func updateMonthOnly(habit : Habit, monthIndex : Nat, entry : TimeVolumeEntry) : Habit {
      let updatedVolumeTracking = switch (habit.volumeTracking) {
        case (null) {
          let baseVolumeTracking = {
            unitType = "time";
            january = if (monthIndex == 0) { entry } else { defaultVolumeEntry() };
            february = if (monthIndex == 1) { entry } else { defaultVolumeEntry() };
            march = if (monthIndex == 2) { entry } else { defaultVolumeEntry() };
            april = if (monthIndex == 3) { entry } else { defaultVolumeEntry() };
            may = if (monthIndex == 4) { entry } else { defaultVolumeEntry() };
            june = if (monthIndex == 5) { entry } else { defaultVolumeEntry() };
            july = if (monthIndex == 6) { entry } else { defaultVolumeEntry() };
            august = if (monthIndex == 7) { entry } else { defaultVolumeEntry() };
            september = if (monthIndex == 8) { entry } else { defaultVolumeEntry() };
            october = if (monthIndex == 9) { entry } else { defaultVolumeEntry() };
            november = if (monthIndex == 10) { entry } else { defaultVolumeEntry() };
            december = if (monthIndex == 11) { entry } else { defaultVolumeEntry() };
          };
          baseVolumeTracking;
        };
        case (?existingVolumeTracking) { updateMonthEntry(existingVolumeTracking, monthIndex, entry) };
      };
      { habit with volumeTracking = ?updatedVolumeTracking };
    };

    func compoundVolumesFromMonthIndex(
      tracking : VolumeTracking,
      habitName : Text,
      startIndex : Nat,
      startEntry : TimeVolumeEntry,
      unitType : Text,
    ) : VolumeTracking {
      let increment = getMonthIncrement(habitName, unitType);
      let monthsArray = [
        tracking.january,
        tracking.february,
        tracking.march,
        tracking.april,
        tracking.may,
        tracking.june,
        tracking.july,
        tracking.august,
        tracking.september,
        tracking.october,
        tracking.november,
        tracking.december,
      ];
      let updatedMonthsArray = Array.tabulate(
        monthsArray.size(),
        func(i) {
          switch (startEntry.minutes) {
            case (null) {
              monthsArray[i];
            };
            case (?minutes_value) {
              if (i == startIndex) {
                startEntry;
              } else if (i > startIndex) {
                let compoundedMinutes = Nat.max(0, minutes_value) + (i - startIndex) * increment;
                {
                  timeString = null;
                  minutes = ?compoundedMinutes;
                };
              } else {
                monthsArray[i];
              };
            };
          };
        }
      );

      {
        tracking with
        january = updatedMonthsArray[0];
        february = updatedMonthsArray[1];
        march = updatedMonthsArray[2];
        april = updatedMonthsArray[3];
        may = updatedMonthsArray[4];
        june = updatedMonthsArray[5];
        july = updatedMonthsArray[6];
        august = updatedMonthsArray[7];
        september = updatedMonthsArray[8];
        october = updatedMonthsArray[9];
        november = updatedMonthsArray[10];
        december = updatedMonthsArray[11];
      };
    };

    func getMonthIncrement(habitName : Text, unitType : Text) : Nat {
      switch (unitType, habitName.toLower().trim(#char ' ')) {
        case ("reps", _) { 5 };
        case ("time", "plank") { 15 };
        case ("time", "squash") { 0 };
        case ("time", _) { 30 };
        case (_, _) { 0 };
      };
    };

    func defaultVolumeEntry() : TimeVolumeEntry {
      { timeString = null; minutes = ?0 };
    };

    func defaultVolumeTracking() : VolumeTracking {
      {
        unitType = "reps";
        january = defaultVolumeEntry();
        february = defaultVolumeEntry();
        march = defaultVolumeEntry();
        april = defaultVolumeEntry();
        may = defaultVolumeEntry();
        june = defaultVolumeEntry();
        july = defaultVolumeEntry();
        august = defaultVolumeEntry();
        september = defaultVolumeEntry();
        october = defaultVolumeEntry();
        november = defaultVolumeEntry();
        december = defaultVolumeEntry();
      };
    };
  };

  let persistentUserHabits = Map.empty<Principal, UserHabitsData>();

  public shared ({ caller }) func addHabit(
    name : Text,
    description : Text,
    reminder : ?Time.Time,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add habits");
    };

    let currentUserData = switch (persistentUserHabits.get(caller)) {
      case (null) { { nextHabitId = 0; habits = [] } };
      case (?existingData) { existingData };
    };

    let (newHabit, newHabitId) = Habit.create(name, description, reminder, currentUserData.nextHabitId);
    let updatedHabits = currentUserData.habits.concat([newHabit]);
    let updatedUserHabitsData = {
      nextHabitId = newHabitId;
      habits = updatedHabits;
    };
    persistentUserHabits.add(caller, updatedUserHabitsData);
  };

  public shared ({ caller }) func updateHabit(
    habitId : Nat,
    name : Text,
    description : Text,
    reminder : ?Time.Time,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update habits");
    };

    let currentUserData = switch (persistentUserHabits.get(caller)) {
      case (null) { { nextHabitId = 0; habits = [] } };
      case (?existingData) { existingData };
    };

    let updatedHabits = currentUserData.habits.map(
      func(habit) {
        if (habit.id == habitId) {
          {
            habit with
            name;
            description;
            reminder;
          };
        } else {
          habit;
        };
      }
    );
    let updatedUserHabitsData = {
      currentUserData with
      habits = updatedHabits;
    };
    persistentUserHabits.add(caller, updatedUserHabitsData);
  };

  public shared ({ caller }) func toggleCompletion(
    habitId : Nat,
    month : Nat,
    day : Nat,
    completed : Bool,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can toggle completion");
    };

    let currentUserData = switch (persistentUserHabits.get(caller)) {
      case (null) { { nextHabitId = 0; habits = [] } };
      case (?existingData) { existingData };
    };

    let updatedHabits = currentUserData.habits.map(
      func(habit) {
        if (habit.id == habitId) {
          Habit.markComplete(month, day, completed, habit);
        } else {
          habit;
        };
      }
    );
    let updatedUserHabitsData = {
      currentUserData with
      habits = updatedHabits;
    };
    persistentUserHabits.add(caller, updatedUserHabitsData);
  };

  public shared ({ caller }) func updateHabitVolume(
    habitId : Nat,
    monthIndex : Nat,
    entry : TimeVolumeEntry,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update volume");
    };

    let currentUserData = switch (persistentUserHabits.get(caller)) {
      case (null) { { nextHabitId = 0; habits = [] } };
      case (?existingData) { existingData };
    };

    let updatedHabits = currentUserData.habits.map(
      func(habit) {
        if (habit.id == habitId) {
          Habit.updateAndCompoundVolumeTracking(habit, monthIndex, entry);
        } else {
          habit;
        };
      }
    );
    let updatedUserHabitsData = {
      currentUserData with
      habits = updatedHabits;
    };
    persistentUserHabits.add(caller, updatedUserHabitsData);
  };

  public shared ({ caller }) func updateHabitUnitType(
    habitId : Nat,
    unitType : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update unit type");
    };

    let currentUserData = switch (persistentUserHabits.get(caller)) {
      case (null) { { nextHabitId = 0; habits = [] } };
      case (?existingData) { existingData };
    };

    let updatedHabits = currentUserData.habits.map(
      func(habit) {
        if (habit.id == habitId) {
          Habit.updateUnitType(habit, unitType);
        } else {
          habit;
        };
      }
    );
    let updatedUserHabitsData = {
      currentUserData with
      habits = updatedHabits;
    };
    persistentUserHabits.add(caller, updatedUserHabitsData);
  };

  public query ({ caller }) func getHabits() : async [Habit] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view habits");
    };

    switch (persistentUserHabits.get(caller)) {
      case (null) { [] };
      case (?userData) { userData.habits };
    };
  };

  public query ({ caller }) func getTotalHabitsCount() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view aggregate statistics");
    };

    var totalCount = 0;
    for ((_, userData) in persistentUserHabits.entries()) {
      totalCount += userData.habits.size();
    };
    totalCount;
  };
};
