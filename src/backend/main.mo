import Map "mo:core/Map";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Text "mo:core/Text";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
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

    public func updateVolumeVolumeTracking(habit : Habit, month : Nat, entry : TimeVolumeEntry) : Habit {
      let updatedVolumeTracking = switch (habit.volumeTracking) {
        case (null) {
          let newVehicle : VolumeTracking = {
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
          newVehicle;
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

    public func updateAndCompoundVolumeVolumeTracking(
      habit : Habit,
      month_index : Nat,
      entry : TimeVolumeEntry,
    ) : Habit {
      let updatedVolumeTracking = switch (habit.volumeTracking) {
        case (null) {
          let baseVolumeTracking = {
            unitType = "reps";
            january = if (month_index == 0) { entry } else { defaultVolumeEntry() };
            february = if (month_index == 1) { entry } else { defaultVolumeEntry() };
            march = if (month_index == 2) { entry } else { defaultVolumeEntry() };
            april = if (month_index == 3) { entry } else { defaultVolumeEntry() };
            may = if (month_index == 4) { entry } else { defaultVolumeEntry() };
            june = if (month_index == 5) { entry } else { defaultVolumeEntry() };
            july = if (month_index == 6) { entry } else { defaultVolumeEntry() };
            august = if (month_index == 7) { entry } else { defaultVolumeEntry() };
            september = if (month_index == 8) { entry } else { defaultVolumeEntry() };
            october = if (month_index == 9) { entry } else { defaultVolumeEntry() };
            november = if (month_index == 10) { entry } else { defaultVolumeEntry() };
            december = if (month_index == 11) { entry } else { defaultVolumeEntry() };
          };
          compoundVolumesFromMonthIndex(baseVolumeTracking, month_index, entry, "reps");
        };
        case (?existingVolumeTracking) {
          let noCompoundingVolumeTracking = updateMonthEntry(existingVolumeTracking, month_index, entry);
          compoundVolumesFromMonthIndex(
            noCompoundingVolumeTracking,
            month_index,
            entry,
            existingVolumeTracking.unitType,
          );
        };
      };
      { habit with volumeTracking = ?updatedVolumeTracking };
    };

    func compoundVolumesFromMonthIndex(
      tracking : VolumeTracking,
      startIndex : Nat,
      startEntry : TimeVolumeEntry,
      unitType : Text,
    ) : VolumeTracking {
      let increment = getMonthIncrement(unitType);
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
            case (?minutesValue) {
              if (i == startIndex) {
                startEntry;
              } else if (i > startIndex) {
                let compoundedMinutes = Nat.max(0, minutesValue) + (i - startIndex) * increment;
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

    func getMonthIncrement(unitType : Text) : Nat {
      switch (unitType) {
        case ("reps") { 5 };
        case ("time") { 15 };
        case (_) { 0 };
      };
    };

    func defaultVolumeEntry() : TimeVolumeEntry {
      { timeString = null; minutes = ?0 };
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
          Habit.updateAndCompoundVolumeVolumeTracking(habit, monthIndex, entry);
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
