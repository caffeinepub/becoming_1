import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import {
  useGetDailyActivityEntry,
  useGetHabitActivityType,
  useToggleCompletion,
} from "../api/queries";
import {
  type HabitWithCompletion,
  getMonthlyTotalVolume,
  getUnitType,
  getVolumeDisplayString,
  isHabitCompletedOnDay,
} from "../state/habitModel";
import {
  ACTIVITY_PRESETS,
  type ActivityType,
  extractPrimaryMetric,
} from "../types/activityTypes";
import { ActivityDayEntryModal } from "./ActivityDayEntryModal";
import { HabitEditModal } from "./HabitEditModal";
import { HabitRowActionsPopover } from "./HabitRowActionsPopover";
import { HABIT_INFO_WIDTH, getDayColumnClasses } from "./habitGridLayout";

interface HabitRowProps {
  habit: HabitWithCompletion;
  selectedMonth: number;
  daysInMonth: number;
  disabled?: boolean;
}

/** The set of activity types that trigger the multi-field popup (not freeform/null). */
const MULTI_FIELD_TYPES: ActivityType[] = [
  "running",
  "cycling",
  "strength",
  "swimming",
];

// ─── Day cell for activity habits ─────────────────────────────────────────────

interface ActivityDayCellProps {
  habitId: bigint;
  activityType: ActivityType;
  monthIndex: number;
  day: number;
  isCompleted: boolean;
  onClick: () => void;
}

function ActivityDayCell({
  habitId,
  activityType,
  monthIndex,
  day,
  isCompleted,
  onClick,
}: ActivityDayCellProps) {
  const { data: entry } = useGetDailyActivityEntry(habitId, monthIndex, day);

  let primaryLabel: string | null = null;
  if (entry) {
    const value = extractPrimaryMetric(entry);
    const unit = ACTIVITY_PRESETS[activityType]?.unit ?? "";
    if (activityType === "strength") {
      // e.g. "3×10"
      const data = entry.data as { sets?: number; reps?: number };
      const sets = data.sets ?? 0;
      const reps = data.reps ?? 0;
      primaryLabel =
        sets && reps ? `${sets}×${reps}` : value > 0 ? String(value) : null;
    } else if (value > 0) {
      primaryLabel = `${value}${unit}`;
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      data-ocid={`activity-day-cell-${day}`}
      className={`
        flex flex-col items-center justify-center gap-0.5 w-full h-full
        min-h-[44px] rounded-sm transition-colors duration-150
        hover:bg-primary/10 active:bg-primary/20
        ${isCompleted ? "text-primary" : "text-muted-foreground/50"}
      `}
      title={
        primaryLabel ??
        `Log ${ACTIVITY_PRESETS[activityType]?.label ?? activityType}`
      }
    >
      {/* Completion dot */}
      <span
        className={`
          block w-2.5 h-2.5 rounded-full border-2 transition-colors
          ${
            isCompleted
              ? "bg-primary border-primary"
              : "bg-transparent border-muted-foreground/30"
          }
        `}
      />
      {/* Primary metric label */}
      {primaryLabel && (
        <span className="text-[9px] leading-tight font-medium text-primary truncate max-w-full px-0.5">
          {primaryLabel}
        </span>
      )}
    </button>
  );
}

// ─── HabitRow ─────────────────────────────────────────────────────────────────

export function HabitRow({
  habit,
  selectedMonth,
  daysInMonth,
  disabled = false,
}: HabitRowProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [activityModalDay, setActivityModalDay] = useState<number | null>(null);

  const toggleCompletionMutation = useToggleCompletion();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const currentVolumeDisplay = getVolumeDisplayString(habit, selectedMonth);
  const currentUnit = getUnitType(habit);
  const monthlyTotal = getMonthlyTotalVolume(habit, selectedMonth);

  // Determine if this habit uses a multi-field activity type (localStorage-backed)
  const { data: storedActivityType } = useGetHabitActivityType(habit.id);
  const activityType =
    storedActivityType && MULTI_FIELD_TYPES.includes(storedActivityType)
      ? storedActivityType
      : null;

  const handleToggleDay = (day: number) => {
    if (disabled) return;
    const isCompleted = isHabitCompletedOnDay(habit, selectedMonth, day);
    toggleCompletionMutation.mutate({
      habitId: habit.id,
      monthIndex: selectedMonth,
      day,
      completed: !isCompleted,
    });
  };

  const handleActivityDayClick = (day: number) => {
    if (disabled) return;
    setActivityModalDay(day);
  };

  /** Called after activity data is saved — also mark the day as completed */
  const handleActivitySaved = () => {
    if (activityModalDay === null) return;
    const isCompleted = isHabitCompletedOnDay(
      habit,
      selectedMonth,
      activityModalDay,
    );
    if (!isCompleted) {
      toggleCompletionMutation.mutate({
        habitId: habit.id,
        monthIndex: selectedMonth,
        day: activityModalDay,
        completed: true,
      });
    }
  };

  const handleHabitInfoClick = () => {
    if (!disabled) setIsPopoverOpen(true);
  };

  const handleEditClick = () => setIsEditModalOpen(true);

  const isRepsOrTimeHabit = currentUnit === "reps" || currentUnit === "time";

  return (
    <>
      <div className="flex flex-col hover:bg-muted/30 transition-colors">
        <div className="flex">
          {/* Habit info cell */}
          <HabitRowActionsPopover
            open={isPopoverOpen}
            onOpenChange={setIsPopoverOpen}
            onEdit={handleEditClick}
          >
            <button
              type="button"
              className={`${HABIT_INFO_WIDTH} flex-shrink-0 px-3 py-3 border-r-2 border-border cursor-pointer hover:bg-muted/50 transition-colors sticky left-0 z-10 bg-background md:static md:z-auto text-left`}
              onClick={handleHabitInfoClick}
            >
              <div className="mb-2">
                <span className="text-sm font-medium">{habit.name}</span>
                {activityType && (
                  <span className="ml-1.5 text-[10px] font-medium text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded-full">
                    {ACTIVITY_PRESETS[activityType].label}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-muted-foreground w-10">
                  Unit:
                </span>
                <span className="text-xs">{currentUnit}</span>
              </div>

              {isRepsOrTimeHabit && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-muted-foreground w-10">
                    Volume:
                  </span>
                  <span className="text-xs">{currentVolumeDisplay}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 pt-2 border-t border-border/50">
                <span className="font-medium">Monthly total:</span>
                <span>{monthlyTotal}</span>
              </div>
            </button>
          </HabitRowActionsPopover>

          {/* Day cells */}
          <div className="flex">
            {days.map((day) => {
              const isCompleted = isHabitCompletedOnDay(
                habit,
                selectedMonth,
                day,
              );

              if (activityType) {
                return (
                  <div key={day} className={getDayColumnClasses()}>
                    <ActivityDayCell
                      habitId={habit.id}
                      activityType={activityType}
                      monthIndex={selectedMonth}
                      day={day}
                      isCompleted={isCompleted}
                      onClick={() => handleActivityDayClick(day)}
                    />
                  </div>
                );
              }

              return (
                <div key={day} className={getDayColumnClasses()}>
                  <Checkbox
                    checked={isCompleted}
                    onCheckedChange={() => handleToggleDay(day)}
                    disabled={disabled}
                    className="touch-optimized"
                    data-ocid={`checkbox-day-${day}`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <HabitEditModal
        habit={habit}
        selectedMonth={selectedMonth}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
      />

      {/* Activity day entry modal */}
      {activityType && activityModalDay !== null && (
        <ActivityDayEntryModal
          open={activityModalDay !== null}
          onOpenChange={(open) => {
            if (!open) setActivityModalDay(null);
          }}
          habitId={habit.id}
          habitName={habit.name}
          activityType={activityType}
          monthIndex={selectedMonth}
          day={activityModalDay}
          onSaved={handleActivitySaved}
        />
      )}
    </>
  );
}
