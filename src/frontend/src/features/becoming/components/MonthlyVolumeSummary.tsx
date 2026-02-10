import { formatSecondsToTimeString } from '../utils/timeVolume';
import { type HabitWithCompletion, getMonthlyTotalRaw } from '../state/habitModel';

interface MonthlyVolumeSummaryProps {
  habits: HabitWithCompletion[];
  selectedMonth: number;
}

export function MonthlyVolumeSummary({ habits, selectedMonth }: MonthlyVolumeSummaryProps) {
  // Aggregate totals by category
  let totalReps = 0;
  let totalTimeSeconds = 0;

  habits.forEach((habit) => {
    const raw = getMonthlyTotalRaw(habit, selectedMonth);
    
    if (raw.type === 'reps') {
      totalReps += raw.value;
    } else if (raw.type === 'time') {
      totalTimeSeconds += raw.value;
    }
  });

  const hasReps = habits.some((h) => h.volumeTracking?.unitType === 'reps');
  const hasTime = habits.some((h) => h.volumeTracking?.unitType === 'time');

  // Don't render if no habits have volume tracking
  if (!hasReps && !hasTime) {
    return null;
  }

  return (
    <div className="glass-surface rounded-lg p-4 mb-6">
      <h3 className="text-sm font-semibold mb-3 text-foreground">Monthly Volume Summary</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {hasReps && (
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground mb-1">Total Reps</span>
            <span className="text-lg font-bold text-primary">{totalReps}</span>
          </div>
        )}
        {hasTime && (
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground mb-1">Total Time</span>
            <span className="text-lg font-bold text-primary">{formatSecondsToTimeString(totalTimeSeconds)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
