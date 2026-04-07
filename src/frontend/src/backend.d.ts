import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface DayEntries {
    day: bigint;
    completed: boolean;
}
export type ActivityDayEntry = {
    __kind__: "swimming";
    swimming: SwimmingEntry;
} | {
    __kind__: "strength";
    strength: StrengthEntry;
} | {
    __kind__: "cycling";
    cycling: CyclingEntry;
} | {
    __kind__: "running";
    running: RunningEntry;
};
export interface CyclingEntry {
    duration?: string;
    distance: number;
    intensity?: string;
}
export interface Habit {
    id: bigint;
    completion: CompletionState;
    volumeTracking?: VolumeTracking;
    reminder?: Time;
    name: string;
    description: string;
}
export interface RunningEntry {
    duration?: string;
    pace?: string;
    distance: number;
}
export interface VolumeTracking {
    unitType: string;
    may: TimeVolumeEntry;
    march: TimeVolumeEntry;
    april: TimeVolumeEntry;
    november: TimeVolumeEntry;
    july: TimeVolumeEntry;
    june: TimeVolumeEntry;
    february: TimeVolumeEntry;
    september: TimeVolumeEntry;
    august: TimeVolumeEntry;
    january: TimeVolumeEntry;
    october: TimeVolumeEntry;
    december: TimeVolumeEntry;
}
export interface MonthlyActivityAggregate {
    totalDistanceKm: number;
    totalReps: bigint;
}
export interface CompletionState {
    may: Array<DayEntries>;
    march: Array<DayEntries>;
    april: Array<DayEntries>;
    november: Array<DayEntries>;
    july: Array<DayEntries>;
    june: Array<DayEntries>;
    february: Array<DayEntries>;
    september: Array<DayEntries>;
    august: Array<DayEntries>;
    january: Array<DayEntries>;
    october: Array<DayEntries>;
    december: Array<DayEntries>;
}
export interface TimeVolumeEntry {
    minutes?: bigint;
    timeString?: string;
}
export interface TimeZone {
    name: string;
    utcOffsetMinutes: bigint;
}
export interface SwimmingEntry {
    duration?: string;
    distance: number;
    strokeType?: string;
}
export interface UserProfile {
    name: string;
}
export interface StrengthEntry {
    weight: number;
    reps: bigint;
    sets: bigint;
    unit: string;
    exerciseName: string;
}
export enum ActivityType {
    swimming = "swimming",
    freeform = "freeform",
    cycling = "cycling",
    running = "running",
    strengthTraining = "strengthTraining"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addHabit(name: string, description: string, reminder: Time | null): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getCallerTimeZone(): Promise<TimeZone | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    /**
     * / Get the multi-field activity entry for a specific habit/month/day.
     */
    getDailyActivityEntry(habitId: bigint, month: bigint, day: bigint): Promise<ActivityDayEntry | null>;
    /**
     * / Get the activityType for a specific habit (null if not set).
     */
    getHabitActivityType(habitId: bigint): Promise<ActivityType | null>;
    getHabits(): Promise<Array<Habit>>;
    /**
     * / Get monthly aggregate stats (total distance km + total reps) for a habit.
     */
    getMonthlyActivityAggregate(habitId: bigint, month: bigint): Promise<MonthlyActivityAggregate | null>;
    getTodaysQuote(): Promise<string>;
    getTotalHabitsCount(): Promise<bigint>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    /**
     * / Set or replace a multi-field activity entry for a specific habit/month/day.
     */
    setDailyActivityEntry(habitId: bigint, month: bigint, day: bigint, entry: ActivityDayEntry): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    setUserTimeZone(timeZone: TimeZone): Promise<void>;
    toggleCompletion(habitId: bigint, month: bigint, day: bigint, completed: boolean): Promise<void>;
    updateHabit(habitId: bigint, name: string, description: string, reminder: Time | null): Promise<void>;
    /**
     * / Update the activityType tag on a habit (nil to clear).
     */
    updateHabitActivityType(habitId: bigint, activityType: ActivityType | null): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateHabitUnitType(habitId: bigint, unitType: string): Promise<void>;
    updateHabitVolume(habitId: bigint, monthIndex: bigint, entry: TimeVolumeEntry): Promise<void>;
}
