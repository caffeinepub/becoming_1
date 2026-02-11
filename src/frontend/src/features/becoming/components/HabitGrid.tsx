import { HabitRow } from './HabitRow';
import { getDaysInMonth } from '../constants/months2026';
import type { HabitWithCompletion } from '../state/habitModel';
import { HABIT_INFO_WIDTH, getDayColumnClasses } from './habitGridLayout';

interface HabitGridProps {
  habits: HabitWithCompletion[];
  selectedMonth: number;
  disabled?: boolean;
}

export function HabitGrid({ habits, selectedMonth, disabled = false }: HabitGridProps) {
  const daysInMonth = getDaysInMonth(selectedMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  if (habits.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">No habits yet</p>
        <p className="text-sm mt-2">Add your first habit to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        {/* Header row with day numbers */}
        <div className="flex border-b-2 border-border bg-muted/50">
          <div className={`${HABIT_INFO_WIDTH} flex-shrink-0 px-4 py-3 font-semibold text-sm border-r-2 border-border sticky left-0 z-10 bg-muted/50 md:static md:z-auto`}>
            Habit
          </div>
          <div className="flex">
            {days.map((day) => (
              <div
                key={day}
                className={`${getDayColumnClasses()} py-3 font-medium text-sm border-r border-border`}
              >
                {day}
              </div>
            ))}
          </div>
        </div>

        {/* Habit rows */}
        <div className="divide-y divide-border">
          {habits.map((habit) => (
            <HabitRow
              key={habit.id.toString()}
              habit={habit}
              selectedMonth={selectedMonth}
              daysInMonth={daysInMonth}
              disabled={disabled}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
