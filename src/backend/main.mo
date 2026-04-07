import Map "mo:core/Map";
import Int "mo:core/Int";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";

import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import AccessControl "mo:caffeineai-authorization/access-control";

import ActivityTypes "types/activity";
import ActivityLib "lib/activity";



actor {
  public type UserProfile = {
    name : Text;
  };

  type TimeZone = {
    utcOffsetMinutes : Int;
    name : Text;
  };

  let QUOTES : [Text] = [
    "The unexamined life is not worth living. - Socrates",
    "He who has a why to live can bear almost any how. - Friedrich Nietzsche",
    "Life is what happens when you're busy making other plans. - John Lennon",
    "We are what we repeatedly do. Excellence, then, is not an act, but a habit. - Aristotle",
    "Life is really simple, but we insist on making it complicated. - Confucius",
    "The only constant in life is change. - Heraclitus",
    "To be is to be perceived. - George Berkeley",
    "Man is condemned to be free. - Jean-Paul Sartre",
    "Life can only be understood backwards; but it must be lived forwards. - Soren Kierkegaard",
    "In the midst of winter, I found there was, within me, an invincible summer. - Albert Camus",
    "I think, therefore I am. - Rene Descartes",
    "The only thing I know is that I know nothing. - Socrates",
    "Yesterday I was clever, so I wanted to change the world. Today I am wise, so I am changing myself. - Rumi",
    "The mind is its own place, and in itself can make a heaven of hell, a hell of heaven. - John Milton",
    "Whatever is begun in anger ends in shame. - Benjamin Franklin",
    "The greatest discovery of my generation is that a human being can alter his life by altering his attitudes. - William James",
    "Everything that irritates us about others can lead us to an understanding of ourselves. - Carl Jung",
    "Knowledge is power. - Francis Bacon",
    "The wound is the place where the Light enters you. - Rumi",
    "Your visions will become clear only when you can look into your own heart. - Carl Jung",
    "Be the change that you wish to see in the world. - Mahatma Gandhi",
    "Darkness cannot drive out darkness; only light can do that. Hate cannot drive out hate; only love can do that. - Martin Luther King Jr.",
    "Those who do not remember the past are condemned to repeat it. - George Santayana",
    "Man is by nature a political animal. - Aristotle",
    "The measure of a man is what he does with power. - Plato",
    "Injustice anywhere is a threat to justice everywhere. - Martin Luther King Jr.",
    "Freedom is what you do with what's been done to you. - Jean-Paul Sartre",
    "Government of the people, by the people, for the people, shall not perish from the earth. - Abraham Lincoln",
    "The secret of freedom lies in educating people, whereas the secret of tyranny is in keeping them ignorant. - Maximilien Robespierre",
    "The best way to predict the future is to create it. - Peter Drucker",
    "What does not kill me makes me stronger. - Friedrich Nietzsche",
    "Waste no more time arguing about what a good man should be. Be one. - Marcus Aurelius",
    "The journey of a thousand miles begins with one step. - Lao Tzu",
    "It is not death that a man should fear, but he should fear never beginning to live. - Marcus Aurelius",
    "Character is destiny. - Heraclitus",
    "Integrity is doing the right thing, even when no one is watching. - C.S. Lewis",
    "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
    "Do what you can, with what you have, where you are. - Theodore Roosevelt",
    "Happiness depends upon ourselves. - Aristotle",
    "Amor Fati: Love your fate, which is in fact your life. - Friedrich Nietzsche",
    "Man is the measure of all things. - Protagoras",
    "The privilege of a lifetime is to become who you truly are. - Carl Jung",
    "Whereof one cannot speak, thereof one must be silent. - Ludwig Wittgenstein",
    "The heart has its reasons which reason knows nothing of. - Blaise Pascal",
    "Hell is other people. - Jean-Paul Sartre",
    "Two things are infinite: the universe and human stupidity; and I'm not sure about the universe. - Albert Einstein",
    "Out of the crooked timber of humanity, no straight thing was ever made. - Immanuel Kant",
    "Science is what you know, philosophy is what you don't know. - Bertrand Russell",
    "If you want to know what a man's like, take a good look at how he treats his inferiors, not his equals. - J.K. Rowling",
    "God is dead. God remains dead. And we have killed him. - Friedrich Nietzsche",
  ];

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

  let habitQuoteUserProfiles = Map.empty<Principal, UserProfile>();
  let userTimeZones = Map.empty<Principal, TimeZone>();
  let persistentUserHabits = Map.empty<Principal, UserHabitsData>();
  // Separate stable maps for new activity fields (keeps Habit type backward-compatible)
  let persistentActivityTypes = Map.empty<Principal, [(Nat, ActivityTypes.ActivityType)]>();
  let persistentActivityData  = Map.empty<Principal, [(Nat, ActivityTypes.ActivityData)]>();

  let accessControlState = AccessControl.initState();

  include MixinAuthorization(accessControlState);

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    habitQuoteUserProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    habitQuoteUserProfiles.get(user);
  };

  public shared ({ caller }) func setUserTimeZone(timeZone : TimeZone) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set time zones");
    };
    userTimeZones.add(caller, timeZone);
  };

  public query ({ caller }) func getCallerTimeZone() : async ?TimeZone {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view time zones");
    };
    userTimeZones.get(caller);
  };

  func getUKAdjustedDayIndex(currentTime : Int) : Nat {
    let nanosPerDay = 24 * 60 * 60 * 1_000_000_000;
    let nanosAt8amDaily = 8 * 60 * 60 * 1_000_000_000;

    let localTime = currentTime + nanosAt8amDaily;
    let localDay = (localTime / nanosPerDay : Int);

    Int.abs(localDay);
  };

  public query ({ caller }) func getTodaysQuote() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can access motivational quotes");
    };

    let currentTime = Time.now();
    let ukDay = getUKAdjustedDayIndex(currentTime);

    if (ukDay == 0) {
      return QUOTES[0];
    };
    let quoteIndex = (ukDay - 1) % QUOTES.size();

    QUOTES[quoteIndex];
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    habitQuoteUserProfiles.add(caller, profile);
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

    // Converts a timeString like "1:15" (mm:ss) to total seconds.
    // "1:15" -> 75 seconds. "45" -> 45 * 60 = 2700 seconds (45 minutes).
    public func timeStringToSeconds(ts : Text) : Nat {
      let parts = ts.split(#char ':').toArray();
      switch (parts.size()) {
        case (2) {
          let m = switch (Nat.fromText(parts[0])) { case (?v) v; case null 0 };
          let s = switch (Nat.fromText(parts[1])) { case (?v) v; case null 0 };
          m * 60 + s;
        };
        case (_) {
          let m = switch (Nat.fromText(ts)) { case (?v) v; case null 0 };
          m * 60;
        };
      };
    };

    // Converts total seconds to "mm:ss" timeString.
    public func secondsToTimeString(totalSeconds : Nat) : Text {
      let mins = totalSeconds / 60;
      let secs = totalSeconds % 60;
      if (secs < 10) {
        mins.toText() # ":0" # secs.toText();
      } else {
        mins.toText() # ":" # secs.toText();
      };
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

      // For time habits, work in seconds using timeString as the source of truth.
      // For reps/other habits, work in the integer minutes/reps field.
      let startValueInSeconds : ?Nat = if (unitType == "time") {
        switch (startEntry.timeString) {
          case (?ts) { ?timeStringToSeconds(ts) };
          case null {
            switch (startEntry.minutes) {
              case (?m) { ?(m * 60) };
              case null null;
            };
          };
        };
      } else { null };

      let updatedMonthsArray = Array.tabulate(
        monthsArray.size(),
        func(i) {
          if (unitType == "time") {
            switch (startValueInSeconds) {
              case (null) { monthsArray[i] };
              case (?baseSeconds) {
                if (i == startIndex) {
                  // Regenerate the start entry with a canonical timeString from seconds
                  let ts = secondsToTimeString(baseSeconds);
                  { timeString = ?ts; minutes = ?(baseSeconds / 60) };
                } else if (i > startIndex) {
                  // Each month adds `increment` seconds
                  let compoundedSeconds = baseSeconds + (i - startIndex) * increment;
                  let ts = secondsToTimeString(compoundedSeconds);
                  { timeString = ?ts; minutes = ?(compoundedSeconds / 60) };
                } else {
                  monthsArray[i];
                };
              };
            };
          } else {
            switch (startEntry.minutes) {
              case (null) { monthsArray[i] };
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
        // Plank: +15 seconds per month. Increment is in SECONDS (matching time storage unit).
        // Feb=1:15 (75s), Mar=1:30 (90s), Apr=1:45 (105s), etc.
        case ("time", "plank") { 15 };
        // Squash: always fixed, no increment.
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

  // ── Activity tracking functions ─────────────────────────────────────────────

  // Helper: look up habit activity data for a caller by habitId
  func getHabitActivityData(caller : Principal, habitId : Nat) : ActivityTypes.ActivityData {
    switch (persistentActivityData.get(caller)) {
      case (null) { ActivityLib.emptyActivityData() };
      case (?pairs) {
        switch (pairs.find<(Nat, ActivityTypes.ActivityData)>(func(p) { let (id, _) = p; id == habitId })) {
          case (null) { ActivityLib.emptyActivityData() };
          case (?(_, d)) { d };
        };
      };
    };
  };

  // Helper: set habit activity data for a caller by habitId
  func setHabitActivityData(caller : Principal, habitId : Nat, data : ActivityTypes.ActivityData) {
    let existing = switch (persistentActivityData.get(caller)) {
      case (null) { [] };
      case (?p) { p };
    };
    let filtered = existing.filter(func(p) { let (id, _) = p; id != habitId });
    persistentActivityData.add(caller, filtered.concat<(Nat, ActivityTypes.ActivityData)>([(habitId, data)]));
  };

  /// Set or replace a multi-field activity entry for a specific habit/month/day.
  public shared ({ caller }) func setDailyActivityEntry(
    habitId : Nat,
    month   : Nat,
    day     : Nat,
    entry   : ActivityTypes.ActivityDayEntry,
  ) : async { #ok; #err : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #err("Unauthorized: Only users can set activity entries");
    };
    // Verify the habit exists
    switch (persistentUserHabits.get(caller)) {
      case (null) { return #err("No habits found") };
      case (?userData) {
        switch (userData.habits.find(func(h) { h.id == habitId })) {
          case (null) { return #err("Habit not found") };
          case (_) {};
        };
      };
    };
    let existingData = getHabitActivityData(caller, habitId);
    setHabitActivityData(caller, habitId, ActivityLib.setDayEntry(existingData, month, day, entry));
    #ok;
  };

  /// Get the multi-field activity entry for a specific habit/month/day.
  public query ({ caller }) func getDailyActivityEntry(
    habitId : Nat,
    month   : Nat,
    day     : Nat,
  ) : async ?ActivityTypes.ActivityDayEntry {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view activity entries");
    };
    let data = getHabitActivityData(caller, habitId);
    ActivityLib.getDayEntry(data, month, day);
  };

  /// Update the activityType tag on a habit (nil to clear).
  public shared ({ caller }) func updateHabitActivityType(
    habitId      : Nat,
    activityType : ?ActivityTypes.ActivityType,
  ) : async { #ok; #err : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #err("Unauthorized: Only users can update activity type");
    };
    // Verify the habit exists
    switch (persistentUserHabits.get(caller)) {
      case (null) { return #err("No habits found") };
      case (?userData) {
        switch (userData.habits.find(func(h) { h.id == habitId })) {
          case (null) { return #err("Habit not found") };
          case (_) {};
        };
      };
    };
    let existing = switch (persistentActivityTypes.get(caller)) {
      case (null) { [] };
      case (?p) { p };
    };
    let filtered = existing.filter(func(p) { let (id, _) = p; id != habitId });
    switch (activityType) {
      case (null) {
        persistentActivityTypes.add(caller, filtered);
      };
      case (?at) {
        persistentActivityTypes.add(caller, filtered.concat<(Nat, ActivityTypes.ActivityType)>([(habitId, at)]));
      };
    };
    #ok;
  };

  /// Get the activityType for a specific habit (null if not set).
  public query ({ caller }) func getHabitActivityType(
    habitId : Nat,
  ) : async ?ActivityTypes.ActivityType {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view activity type");
    };
    switch (persistentActivityTypes.get(caller)) {
      case (null) { null };
      case (?pairs) {
        switch (pairs.find<(Nat, ActivityTypes.ActivityType)>(func(p) { let (id, _) = p; id == habitId })) {
          case (null) { null };
          case (?(_, at)) { ?at };
        };
      };
    };
  };

  /// Get monthly aggregate stats (total distance km + total reps) for a habit.
  public query ({ caller }) func getMonthlyActivityAggregate(
    habitId : Nat,
    month   : Nat,
  ) : async ?ActivityTypes.MonthlyActivityAggregate {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view activity aggregates");
    };
    let data = getHabitActivityData(caller, habitId);
    ?ActivityLib.aggregateMonth(ActivityLib.getMonthLog(data, month));
  };
};
