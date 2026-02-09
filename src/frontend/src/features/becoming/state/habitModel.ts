import type { Habit, CompletionState, DayEntries, VolumeTracking, TimeVolumeEntry } from '../../../backend';
import { formatMinutesToTimeString, normalizeTimeString } from '../utils/timeVolume';

export interface HabitWithCompletion extends Habit {
  completionMap: Map<number, Map<number, boolean>>;
}

export const MONTH_KEYS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
] as const;

export type MonthKey = typeof MONTH_KEYS[number];

function getMonthArray(completion: CompletionState, monthIndex: number): DayEntries[] {
  const key = MONTH_KEYS[monthIndex];
  return completion[key] || [];
}

export function buildCompletionMap(habit: Habit): HabitWithCompletion {
  const completionMap = new Map<number, Map<number, boolean>>();
  
  for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
    const monthMap = new Map<number, boolean>();
    const monthArray = getMonthArray(habit.completion, monthIndex);
    
    monthArray.forEach((entry) => {
      if (entry.day > 0) {
        monthMap.set(Number(entry.day), entry.completed);
      }
    });
    
    completionMap.set(monthIndex, monthMap);
  }
  
  return {
    ...habit,
    completionMap,
  };
}

export function isHabitCompletedOnDay(
  habit: HabitWithCompletion,
  monthIndex: number,
  day: number
): boolean {
  return habit.completionMap.get(monthIndex)?.get(day) || false;
}

/**
 * Counts the number of completed days for a habit in a given month
 */
export function getCompletedDaysCount(habit: HabitWithCompletion, monthIndex: number): number {
  const monthMap = habit.completionMap.get(monthIndex);
  if (!monthMap) return 0;
  
  let count = 0;
  monthMap.forEach((completed) => {
    if (completed) count++;
  });
  
  return count;
}

/**
 * Gets the volume entry for a given month
 */
function getVolumeEntryForMonth(habit: Habit, monthIndex: number): TimeVolumeEntry | null {
  if (!habit.volumeTracking) return null;
  
  const key = MONTH_KEYS[monthIndex];
  return habit.volumeTracking[key] || null;
}

/**
 * Gets the display string for a volume entry based on unit type
 * For "time" unit: returns formatted M:SS string (normalized)
 * For other units: returns numeric string
 */
export function getVolumeDisplayString(habit: Habit, monthIndex: number): string {
  const entry = getVolumeEntryForMonth(habit, monthIndex);
  if (!entry) return '0';
  
  const unitType = getUnitType(habit);
  
  if (unitType === 'time') {
    // For time units, prefer timeString if available (normalized), otherwise format minutes
    if (entry.timeString) {
      // Normalize the stored timeString to M:SS format
      return normalizeTimeString(entry.timeString);
    }
    if (entry.minutes !== undefined && entry.minutes !== null) {
      return formatMinutesToTimeString(Number(entry.minutes));
    }
    return '0:00';
  } else {
    // For non-time units, return minutes as a number
    if (entry.minutes !== undefined && entry.minutes !== null) {
      return String(Number(entry.minutes));
    }
    return '0';
  }
}

/**
 * Computes the monthly total volume for a habit in a given month
 * Returns a formatted string based on unit type
 */
export function getMonthlyTotalVolume(habit: HabitWithCompletion, monthIndex: number): string {
  const completedDays = getCompletedDaysCount(habit, monthIndex);
  if (completedDays === 0) {
    const unitType = getUnitType(habit);
    return unitType === 'time' ? '0:00' : '0';
  }
  
  const entry = getVolumeEntryForMonth(habit, monthIndex);
  if (!entry || entry.minutes === undefined || entry.minutes === null) {
    const unitType = getUnitType(habit);
    return unitType === 'time' ? '0:00' : '0';
  }
  
  const perCompletionVolume = Number(entry.minutes);
  const totalVolume = perCompletionVolume * completedDays;
  
  const unitType = getUnitType(habit);
  if (unitType === 'time') {
    return formatMinutesToTimeString(totalVolume);
  } else {
    return String(totalVolume);
  }
}

/**
 * Gets the numeric volume for a given month (for backward compatibility)
 * @deprecated Use getVolumeDisplayString for display purposes
 */
export function getVolumeForMonth(habit: Habit, monthIndex: number): number {
  const entry = getVolumeEntryForMonth(habit, monthIndex);
  if (!entry || entry.minutes === undefined || entry.minutes === null) return 0;
  return Number(entry.minutes);
}

export function getUnitType(habit: Habit): string {
  return habit.volumeTracking?.unitType || 'reps';
}

export function getDefaultVolumeTracking(): VolumeTracking {
  const defaultEntry: TimeVolumeEntry = { timeString: undefined, minutes: BigInt(0) };
  return {
    unitType: 'reps',
    january: defaultEntry,
    february: defaultEntry,
    march: defaultEntry,
    april: defaultEntry,
    may: defaultEntry,
    june: defaultEntry,
    july: defaultEntry,
    august: defaultEntry,
    september: defaultEntry,
    october: defaultEntry,
    november: defaultEntry,
    december: defaultEntry,
  };
}

/**
 * Get the increment value for a given unit type
 */
function getMonthIncrement(unitType: string): number {
  switch (unitType) {
    case 'reps':
      return 5;
    case 'time':
      return 15;
    default:
      return 0;
  }
}

/**
 * Compute optimistic volume tracking with auto-compounding for future months.
 * Sets the selected month to the user-entered value, and auto-generates all future months
 * with increment +5 for unitType "reps", +15 for "time", +0 otherwise.
 * Preserves earlier months as-is when volumeTracking exists.
 */
export function computeCompoundedVolumeTracking(
  existingVolumeTracking: VolumeTracking | undefined,
  monthIndex: number,
  minutes: number,
  timeString?: string
): VolumeTracking {
  const unitType = existingVolumeTracking?.unitType || 'reps';
  const increment = getMonthIncrement(unitType);
  
  // Start with existing values or defaults
  const baseTracking = existingVolumeTracking || getDefaultVolumeTracking();
  
  // Build the new volume tracking object
  const newTracking: VolumeTracking = { ...baseTracking };
  
  // Normalize timeString to M:SS format if provided
  const normalizedTimeString = timeString ? normalizeTimeString(timeString) : undefined;
  
  // Update the selected month and all future months
  for (let i = 0; i < 12; i++) {
    const monthKey = MONTH_KEYS[i];
    
    if (i === monthIndex) {
      // Set the selected month to the user-entered value (normalized)
      newTracking[monthKey] = {
        minutes: BigInt(minutes),
        timeString: unitType === 'time' && normalizedTimeString ? normalizedTimeString : undefined,
      };
    } else if (i > monthIndex) {
      // Auto-generate future months with compounding
      const k = i - monthIndex;
      const compoundedMinutes = Math.max(0, minutes + (k * increment));
      newTracking[monthKey] = {
        minutes: BigInt(compoundedMinutes),
        timeString: unitType === 'time' ? formatMinutesToTimeString(compoundedMinutes) : undefined,
      };
    }
    // else: preserve earlier months (i < monthIndex) as-is
  }
  
  return newTracking;
}
