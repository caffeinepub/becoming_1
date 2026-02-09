import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { useToggleCompletion } from '../api/queries';
import { getVolumeDisplayString, getUnitType, isHabitCompletedOnDay, getMonthlyTotalVolume, type HabitWithCompletion } from '../state/habitModel';
import { HABIT_INFO_WIDTH, getDayColumnClasses } from './habitGridLayout';
import { HabitEditModal } from './HabitEditModal';
import { HabitRowActionsPopover } from './HabitRowActionsPopover';

interface HabitRowProps {
  habit: HabitWithCompletion;
  selectedMonth: number;
  daysInMonth: number;
  disabled?: boolean;
}

export function HabitRow({ habit, selectedMonth, daysInMonth, disabled = false }: HabitRowProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const toggleCompletionMutation = useToggleCompletion();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const currentVolumeDisplay = getVolumeDisplayString(habit, selectedMonth);
  const currentUnit = getUnitType(habit);
  const monthlyTotal = getMonthlyTotalVolume(habit, selectedMonth);

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

  const handleHabitInfoClick = () => {
    if (!disabled) {
      setIsPopoverOpen(true);
    }
  };

  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  // Determine if this is a reps/time habit (shows volume per completion)
  const isRepsOrTimeHabit = currentUnit === 'reps' || currentUnit === 'time';

  return (
    <>
      <div className="flex flex-col hover:bg-muted/30 transition-colors">
        <div className="flex">
          {/* Habit info cell - clickable to open actions popover */}
          <HabitRowActionsPopover
            open={isPopoverOpen}
            onOpenChange={setIsPopoverOpen}
            onEdit={handleEditClick}
          >
            <div 
              className={`${HABIT_INFO_WIDTH} flex-shrink-0 px-3 py-3 border-r-2 border-border cursor-pointer hover:bg-muted/50 transition-colors`}
              onClick={handleHabitInfoClick}
            >
              {/* Habit name */}
              <div className="mb-2">
                <span className="text-sm font-medium">{habit.name}</span>
              </div>

              {/* Unit type */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-muted-foreground w-10">Unit:</span>
                <span className="text-xs">{currentUnit}</span>
              </div>

              {/* Volume display - only for reps/time habits */}
              {isRepsOrTimeHabit && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-muted-foreground w-10">Volume:</span>
                  <span className="text-xs">{currentVolumeDisplay}</span>
                </div>
              )}

              {/* Monthly total display */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 pt-2 border-t border-border/50">
                <span className="font-medium">Monthly total:</span>
                <span>{monthlyTotal}</span>
              </div>
            </div>
          </HabitRowActionsPopover>

          {/* Day checkboxes */}
          <div className="flex overflow-x-auto">
            {days.map((day) => {
              const isCompleted = isHabitCompletedOnDay(habit, selectedMonth, day);
              return (
                <div key={day} className={getDayColumnClasses()}>
                  <Checkbox
                    checked={isCompleted}
                    onCheckedChange={() => handleToggleDay(day)}
                    disabled={disabled}
                    className="touch-optimized"
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
    </>
  );
}
