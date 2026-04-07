import {
  type HabitWithCompletion,
  aggregateMonthlyTotals,
} from "../state/habitModel";

interface MonthlyVolumeSummaryProps {
  habits: HabitWithCompletion[];
  selectedMonth: number;
}

export function MonthlyVolumeSummary({
  habits,
  selectedMonth,
}: MonthlyVolumeSummaryProps) {
  const { totalReps, totalTimeMinutes } = aggregateMonthlyTotals(
    habits,
    selectedMonth,
  );

  const hasReps = habits.some((h) => h.volumeTracking?.unitType === "reps");
  const hasTime = habits.some((h) => h.volumeTracking?.unitType === "time");

  // Don't render if no habits have volume tracking
  if (!hasReps && !hasTime) {
    return null;
  }

  return (
    <div className="glass-surface rounded-lg p-4 mb-6">
      <h3 className="text-sm font-semibold mb-3 text-foreground">
        Monthly Volume Summary
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {hasReps && (
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              Total Reps
            </span>
            <span className="text-2xl font-bold text-primary">
              {totalReps.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground mt-0.5">reps</span>
          </div>
        )}
        {hasTime && (
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              Total Time
            </span>
            <span className="text-2xl font-bold text-accent-foreground">
              {totalTimeMinutes}
            </span>
            <span className="text-xs text-muted-foreground mt-0.5">min</span>
          </div>
        )}
      </div>
    </div>
  );
}
