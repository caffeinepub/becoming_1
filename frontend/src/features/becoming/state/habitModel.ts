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
 * For "time": monthly total = (per-completion seconds) × (completed days count), formatted as M:SS
 *   - Uses seconds-accurate calculation when timeString is available
 * For other numeric units: monthly total = (per-completion volume) × (completed days count)
 */
export function getMonthlyTotalVolume(habit: HabitWithCompletion, monthIndex: number): string {
  const completedDays = getCompletedDaysCount(habit, monthIndex);
  const unitType = getUnitType(habit);
  
  if (completedDays === 0) {
    return unitType === 'time' ? '0:00' : '0';
  }
  
  const entry = getVolumeEntryForMonth(habit, monthIndex);
  if (!entry || entry.minutes === undefined || entry.minutes === null) {
    return unitType === 'time' ? '0:00' : '0';
  }
  
  if (unitType === 'reps') {
    // For reps: multiply per-completion volume by completed days
    const perCompletionVolume = Number(entry.minutes);
    const totalVolume = perCompletionVolume * completedDays;
    return String(totalVolume);
  } else if (unitType === 'time') {
    // For time: multiply per-completion by completed days (seconds-accurate when timeString exists)
    let perCompletionSeconds = 0;
    
    if (entry.timeString) {
      // Use timeString for seconds-accurate calculation
      const parsed = parseTimeStringToSeconds(entry.timeString);
      perCompletionSeconds = parsed !== null ? parsed : Number(entry.minutes) * 60;
    } else {
      // Fallback to minutes
      perCompletionSeconds = Number(entry.minutes) * 60;
    }
    
    const totalSeconds = perCompletionSeconds * completedDays;
    return formatSecondsToTimeString(totalSeconds);
  } else {
    // For all other numeric unit types: multiply per-completion volume by completed days
    const perCompletionVolume = Number(entry.minutes);
    const totalVolume = perCompletionVolume * completedDays;
    return String(totalVolume);
  }
}

/**
 * Helper to get raw monthly total values for aggregate calculations
 * Returns numeric values: reps/workout as number, time as seconds
 */
export function getMonthlyTotalRaw(habit: HabitWithCompletion, monthIndex: number): { type: string; value: number } {
  const completedDays = getCompletedDaysCount(habit, monthIndex);
  const unitType = getUnitType(habit);
  
  if (completedDays === 0) {
    return { type: unitType, value: 0 };
  }
  
  const entry = getVolumeEntryForMonth(habit, monthIndex);
  if (!entry || entry.minutes === undefined || entry.minutes === null) {
    return { type: unitType, value: 0 };
  }
  
  if (unitType === 'reps') {
    const perCompletionVolume = Number(entry.minutes);
    const totalVolume = perCompletionVolume * completedDays;
    return { type: 'reps', value: totalVolume };
  } else if (unitType === 'time') {
    let perCompletionSeconds = 0;
    
    if (entry.timeString) {
      const parsed = parseTimeStringToSeconds(entry.timeString);
      perCompletionSeconds = parsed !== null ? parsed : Number(entry.minutes) * 60;
    } else {
      perCompletionSeconds = Number(entry.minutes) * 60;
    }
    
    const totalSeconds = perCompletionSeconds * completedDays;
    return { type: 'time', value: totalSeconds };
  } else {
    const perCompletionVolume = Number(entry.minutes);
    const totalVolume = perCompletionVolume * completedDays;
    return { type: 'numeric', value: totalVolume };
  }
}

/**
 * Aggregates monthly totals for the Monthly Volume Summary.
 * Returns:
 * - totalReps: sum of all rep-based habit totals
 * - totalPlankMinutes: total plank time in whole minutes
 * - totalSquashMinutes: total squash time in whole minutes
 */
export function aggregateMonthlyTotals(
  habits: HabitWithCompletion[],
  monthIndex: number
): {
  totalReps: number;
  totalPlankMinutes: number;
  totalSquashMinutes: number;
} {
  let totalReps = 0;
  let totalPlankSeconds = 0;
  let totalSquashSeconds = 0;

  habits.forEach((habit) => {
    const normalizedName = habit.name.toLowerCase().trim();
    const raw = getMonthlyTotalRaw(habit, monthIndex);

    if (raw.type === 'reps') {
      totalReps += raw.value;
    } else if (raw.type === 'time') {
      if (normalizedName === 'plank') {
        totalPlankSeconds += raw.value;
      } else if (normalizedName === 'squash') {
        totalSquashSeconds += raw.value;
      }
    }
  });

  return {
    totalReps,
    totalPlankMinutes: Math.floor(totalPlankSeconds / 60),
    totalSquashMinutes: Math.floor(totalSquashSeconds / 60),
  };
}

/**
 * Aggregates yearly totals across all habits for the chart
 * Returns arrays of 12 values (one per month) for reps and time (in hours)
 */
export function aggregateYearlyTotals(habits: HabitWithCompletion[]): {
  reps: number[];
  timeHours: number[];
} {
  const reps: number[] = new Array(12).fill(0);
  const timeHours: number[] = new Array(12).fill(0);
  
  habits.forEach((habit) => {
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const raw = getMonthlyTotalRaw(habit, monthIndex);
      
      if (raw.type === 'reps') {
        reps[monthIndex] += raw.value;
      } else if (raw.type === 'time') {
        // Convert seconds to hours (fractional)
        timeHours[monthIndex] += raw.value / 3600;
      }
    }
  });
  
  // Round time hours to 2 decimal places for cleaner display
  const roundedTimeHours = timeHours.map(hours => Math.round(hours * 100) / 100);
  
  return { reps, timeHours: roundedTimeHours };
}

/**
 * Aggregates yearly totals for specific habits by name
 * Returns arrays of 12 values (one per month) for each of the four habits:
 * - Press-ups (reps)
 * - Squats (reps)
 * - Plank (hours, converted from seconds)
 * - Squash (hours, converted from seconds)
 */
export function aggregateYearlyTotalsByHabit(habits: HabitWithCompletion[]): {
  pressUps: number[];
  squats: number[];
  plankHours: number[];
  squashHours: number[];
} {
  const pressUps: number[] = new Array(12).fill(0);
  const squats: number[] = new Array(12).fill(0);
  const plankHours: number[] = new Array(12).fill(0);
  const squashHours: number[] = new Array(12).fill(0);
  
  habits.forEach((habit) => {
    const normalizedName = habit.name.toLowerCase().trim();
    
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const raw = getMonthlyTotalRaw(habit, monthIndex);
      
      if (normalizedName === 'press-ups' && raw.type === 'reps') {
        pressUps[monthIndex] += raw.value;
      } else if (normalizedName === 'squats' && raw.type === 'reps') {
        squats[monthIndex] += raw.value;
      } else if (normalizedName === 'plank' && raw.type === 'time') {
        // Convert seconds to hours (fractional)
        plankHours[monthIndex] += raw.value / 3600;
      } else if (normalizedName === 'squash' && raw.type === 'time') {
        // Convert seconds to hours (fractional)
        squashHours[monthIndex] += raw.value / 3600;
      }
    }
  });
  
  // Round hours to 2 decimal places for cleaner display
  const roundedPlankHours = plankHours.map(hours => Math.round(hours * 100) / 100);
  const roundedSquashHours = squashHours.map(hours => Math.round(hours * 100) / 100);
  
  return {
    pressUps,
    squats,
    plankHours: roundedPlankHours,
    squashHours: roundedSquashHours,
  };
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
 * - Plank (time): 15 seconds per month after February
 * - Other time habits: 30 minutes
 * - Reps: 5
 */
function getMonthIncrement(habitName: string, unitType: string): { minutes: number; seconds: number } {
  const normalizedName = habitName.toLowerCase().trim();
  
  if (normalizedName === 'squash') {
    // Squash: no increment (constant volume)
    return { minutes: 0, seconds: 0 };
  } else if (normalizedName === 'plank' && unitType === 'time') {
    // Plank: +15 seconds per month after February
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
 * - Plank (time): February is the base month; +15 seconds per month after February
 *   (Feb = base, Mar = base+15s, Apr = base+30s, etc.)
 * - Other time habits: +30 minutes per calendar month from the edited month
 * - Reps: +5 per calendar month from the edited month
 * 
 * For Squash: all months are set to the same value
 * For Plank: February (month index 1) is the base; progression applies to months after February
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
  
  // Special case: Plank - February (month index 1) is the base month
  if (normalizedName === 'plank' && unitType === 'time') {
    // Parse the edited month's value to seconds
    let editedMonthSeconds = 0;
    if (normalizedTimeString) {
      const parsed = parseTimeStringToSeconds(normalizedTimeString);
      editedMonthSeconds = parsed !== null ? parsed : minutes * 60;
    } else {
      editedMonthSeconds = minutes * 60;
    }
    
    // Calculate what February's value should be based on the edited month
    // February is month index 1 (the base month)
    const februaryIndex = 1;
    let februarySeconds: number;
    
    if (monthIndex === februaryIndex) {
      // If editing February directly, use that value as the base
      februarySeconds = editedMonthSeconds;
    } else if (monthIndex < februaryIndex) {
      // If editing a month before February (e.g., January)
      // February should be editedValue + (Feb - editedMonth) * 15s
      februarySeconds = editedMonthSeconds + ((februaryIndex - monthIndex) * increment.seconds);
    } else {
      // If editing a month after February (e.g., March, April)
      // February should be editedValue - (editedMonth - Feb) * 15s
      februarySeconds = editedMonthSeconds - ((monthIndex - februaryIndex) * increment.seconds);
    }
    
    // Now set all 12 months based on their position relative to February
    for (let i = 0; i < 12; i++) {
      const monthKey = MONTH_KEYS[i];
      let monthSeconds: number;
      
      if (i <= februaryIndex) {
        // For months up to and including February, calculate backwards from February
        monthSeconds = februarySeconds - ((februaryIndex - i) * increment.seconds);
      } else {
        // For months after February, add 15s per month
        monthSeconds = februarySeconds + ((i - februaryIndex) * increment.seconds);
      }
      
      // Ensure non-negative values
      monthSeconds = Math.max(0, monthSeconds);
      
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
