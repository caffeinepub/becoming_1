import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
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
export type Time = bigint;
export interface DayEntries {
    day: bigint;
    completed: boolean;
}
export interface Habit {
    id: bigint;
    completion: CompletionState;
    volumeTracking?: VolumeTracking;
    reminder?: Time;
    name: string;
    description: string;
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
export interface UserProfile {
    name: string;
}
export interface TimeVolumeEntry {
    minutes?: bigint;
    timeString?: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addHabit(name: string, description: string, reminder: Time | null): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getHabits(): Promise<Array<Habit>>;
    getTotalHabitsCount(): Promise<bigint>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    toggleCompletion(habitId: bigint, month: bigint, day: bigint, completed: boolean): Promise<void>;
    updateHabit(habitId: bigint, name: string, description: string, reminder: Time | null): Promise<void>;
    updateHabitUnitType(habitId: bigint, unitType: string): Promise<void>;
    updateHabitVolume(habitId: bigint, monthIndex: bigint, entry: TimeVolumeEntry): Promise<void>;
}
