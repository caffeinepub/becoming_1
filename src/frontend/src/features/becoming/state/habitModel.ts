import type { Habit, CompletionState, DayEntries, VolumeTracking, TimeVolumeEntry } from '../../../backend';
import { formatMinutesToTimeString, normalizeTimeString, parseTimeStringToSeconds, formatSecondsToTimeString } from '../utils/timeVolume';

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
 * 
 * For "reps": monthly total = (per-completion volume) × (completed days count)
 * For "time": monthly total = (per-completion minutes) × (completed days count), formatted as M:SS
 *   - Special case for "Plank": uses seconds-accurate multiplication (M:SS × count)
 * For other units: monthly total = completed days count (each checked day = +1)
 */
export function getMonthlyTotalVolume(habit: HabitWithCompletion, monthIndex: number): string {
  const completedDays = getCompletedDaysCount(habit, monthIndex);
  const unitType = getUnitType(habit);
  
  if (unitType === 'reps') {
    // For reps: multiply per-completion volume by completed days
    if (completedDays === 0) return '0';
    
    const entry = getVolumeEntryForMonth(habit, monthIndex);
    if (!entry || entry.minutes === undefined || entry.minutes === null) return '0';
    
    const perCompletionVolume = Number(entry.minutes);
    const totalVolume = perCompletionVolume * completedDays;
    return String(totalVolume);
  } else if (unitType === 'time') {
    // For time: multiply per-completion by completed days
    if (completedDays === 0) return '0:00';
    
    const entry = getVolumeEntryForMonth(habit, monthIndex);
    if (!entry || entry.minutes === undefined || entry.minutes === null) return '0:00';
    
    // Special case: "Plank" habit uses seconds-accurate multiplication
    if (habit.name === 'Plank') {
      // Try to parse timeString first (if available), otherwise fall back to minutes
      let perCompletionSeconds = 0;
      
      if (entry.timeString) {
        const parsed = parseTimeStringToSeconds(entry.timeString);
        perCompletionSeconds = parsed !== null ? parsed : Number(entry.minutes) * 60;
      } else {
        perCompletionSeconds = Number(entry.minutes) * 60;
      }
      
      const totalSeconds = perCompletionSeconds * completedDays;
      return formatSecondsToTimeString(totalSeconds);
    } else {
      // All other time habits: use minutes-only multiplication
      const perCompletionVolume = Number(entry.minutes);
      const totalVolume = perCompletionVolume * completedDays;
      return formatMinutesToTimeString(totalVolume);
    }
  } else {
    // For all other unit types: return completed days count (each checked day = +1)
    return String(completedDays);
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
 * Get the increment value for a given habit name and unit type
 * Applies habit-specific progression rules:
 * - Squash: 0 (constant volume)
 * - Plank (time): 15 seconds
 * - Other time habits: 30 minutes
 * - Reps: 5
 */
function getMonthIncrement(habitName: string, unitType: string): { minutes: number; seconds: number } {
  const normalizedName = habitName.toLowerCase().trim();
  
  if (normalizedName === 'squash') {
    // Squash: no increment (constant volume)
    return { minutes: 0, seconds: 0 };
  } else if (normalizedName === 'plank' && unitType === 'time') {
    // Plank: +15 seconds per month
    return { minutes: 0, seconds: 15 };
  } else if (unitType === 'time') {
    // Other time habits: +30 minutes per month
    return { minutes: 30, seconds: 0 };
  } else if (unitType === 'reps') {
    // Reps: +5 per month
    return { minutes: 5, seconds: 0 };
  } else {
    // Default: no increment
    return { minutes: 0, seconds: 0 };
  }
}

/**
 * Compute optimistic volume tracking with auto-compounding based on calendar months.
 * 
 * Habit-specific progression rules:
 * - Squash: constant volume across ALL 12 months (Jan-Dec)
 * - Plank (time): +15 seconds per calendar month from January
 *   (Jan = base, Feb = base+15s, Mar = base+30s, etc.)
 * - Other time habits: +30 minutes per calendar month from the edited month
 * - Reps: +5 per calendar month from the edited month
 * 
 * For Squash: all months are set to the same value
 * For Plank: progression is based on absolute calendar month position
 * For others: only future months (after edited month) are updated
 */
export function computeCompoundedVolumeTracking(
  existingVolumeTracking: VolumeTracking | undefined,
  monthIndex: number,
  minutes: number,
  habitName: string,
  timeString?: string
): VolumeTracking {
  // Infer unitType: if timeString is provided, it's "time", otherwise use existing or default to "reps"
  const unitType = existingVolumeTracking?.unitType || (timeString ? 'time' : 'reps');
  const increment = getMonthIncrement(habitName, unitType);
  
  // Start with existing values or defaults
  const baseTracking = existingVolumeTracking || getDefaultVolumeTracking();
  
  // Build the new volume tracking object
  const newTracking: VolumeTracking = { ...baseTracking, unitType };
  
  // Normalize timeString to M:SS format if provided
  const normalizedTimeString = timeString ? normalizeTimeString(timeString) : undefined;
  
  const normalizedName = habitName.toLowerCase().trim();
  
  // Special case: Squash - set ALL months to the same value
  if (normalizedName === 'squash') {
    const constantEntry: TimeVolumeEntry = {
      minutes: BigInt(minutes),
      timeString: unitType === 'time' && normalizedTimeString ? normalizedTimeString : undefined,
    };
    
    for (let i = 0; i < 12; i++) {
      const monthKey = MONTH_KEYS[i];
      newTracking[monthKey] = constantEntry;
    }
    
    return newTracking;
  }
  
  // Special case: Plank - progression based on calendar month position
  if (normalizedName === 'plank' && unitType === 'time') {
    // Parse the edited month's value to seconds
    let editedMonthSeconds = 0;
    if (normalizedTimeString) {
      const parsed = parseTimeStringToSeconds(normalizedTimeString);
      editedMonthSeconds = parsed !== null ? parsed : minutes * 60;
    } else {
      editedMonthSeconds = minutes * 60;
    }
    
    // Calculate what January's value should be based on the edited month
    // If editing February (index 1), and it's 1:15 (75s), then January should be 75 - 15 = 60s (1:00)
    const januarySeconds = editedMonthSeconds - (monthIndex * increment.seconds);
    
    // Now set all 12 months based on calendar position from January
    for (let i = 0; i < 12; i++) {
      const monthKey = MONTH_KEYS[i];
      const monthSeconds = januarySeconds + (i * increment.seconds);
      const monthMinutes = Math.floor(monthSeconds / 60);
      const monthTimeString = formatSecondsToTimeString(monthSeconds);
      
      newTracking[monthKey] = {
        minutes: BigInt(monthMinutes),
        timeString: monthTimeString,
      };
    }
    
    return newTracking;
  }
  
  // Default behavior for other habits: update selected month and future months only
  for (let i = 0; i < 12; i++) {
    const monthKey = MONTH_KEYS[i];
    
    if (i === monthIndex) {
      // Set the selected month to the user-entered value (normalized)
      newTracking[monthKey] = {
        minutes: BigInt(minutes),
        timeString: unitType === 'time' && normalizedTimeString ? normalizedTimeString : undefined,
      };
    } else if (i > monthIndex) {
      // Auto-generate future months with habit-specific compounding
      const k = i - monthIndex;
      const compoundedMinutes = Math.max(0, minutes + (k * increment.minutes));
      
      newTracking[monthKey] = {
        minutes: BigInt(compoundedMinutes),
        timeString: unitType === 'time' ? formatMinutesToTimeString(compoundedMinutes) : undefined,
      };
    }
    // else: preserve earlier months (i < monthIndex) as-is
  }
  
  return newTracking;
}
