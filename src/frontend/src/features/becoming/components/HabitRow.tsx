import { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useUpdateHabit,
  useUpdateHabitUnitType,
  useUpdateHabitVolume,
  useToggleCompletion,
} from '../api/queries';
import { getVolumeDisplayString, getUnitType, isHabitCompletedOnDay, getMonthlyTotalVolume, type HabitWithCompletion } from '../state/habitModel';
import { isValidTimeString, parseTimeStringToMinutes, getTimeValidationError, sanitizeTimeInput, sanitizePastedTimeInput, normalizeTimeString } from '../utils/timeVolume';
import { toast } from 'sonner';
import { HABIT_INFO_WIDTH, getDayColumnClasses } from './habitGridLayout';

interface HabitRowProps {
  habit: HabitWithCompletion;
  selectedMonth: number;
  daysInMonth: number;
  disabled?: boolean;
}

const PRESET_UNITS = ['reps', 'time', 'km'];

export function HabitRow({ habit, selectedMonth, daysInMonth, disabled = false }: HabitRowProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(habit.name);
  const [isEditingUnit, setIsEditingUnit] = useState(false);
  const [editedUnit, setEditedUnit] = useState(getUnitType(habit));
  const [isEditingVolume, setIsEditingVolume] = useState(false);
  const [editedVolume, setEditedVolume] = useState(getVolumeDisplayString(habit, selectedMonth));
  const [useCustomUnit, setUseCustomUnit] = useState(false);

  const updateNameMutation = useUpdateHabit();
  const updateUnitMutation = useUpdateHabitUnitType();
  const updateVolumeMutation = useUpdateHabitVolume();
  const toggleCompletionMutation = useToggleCompletion();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const currentVolumeDisplay = getVolumeDisplayString(habit, selectedMonth);
  const currentUnit = getUnitType(habit);
  const monthlyTotal = getMonthlyTotalVolume(habit, selectedMonth);

  const handleSaveNameEdit = async () => {
    if (disabled) return;
    
    if (editedName.trim() && editedName !== habit.name) {
      await updateNameMutation.mutateAsync({
        habitId: habit.id,
        name: editedName.trim(),
      });
    }
    setIsEditingName(false);
  };

  const handleCancelNameEdit = () => {
    setEditedName(habit.name);
    setIsEditingName(false);
  };

  const handleSaveUnitEdit = async () => {
    if (disabled) return;
    
    if (editedUnit.trim() && editedUnit !== currentUnit) {
      await updateUnitMutation.mutateAsync({
        habitId: habit.id,
        unitType: editedUnit.trim(),
      });
    }
    setIsEditingUnit(false);
    setUseCustomUnit(false);
  };

  const handleCancelUnitEdit = () => {
    setEditedUnit(currentUnit);
    setIsEditingUnit(false);
    setUseCustomUnit(false);
  };

  const handleSaveVolumeEdit = async () => {
    if (disabled) return;
    
    if (currentUnit === 'time') {
      // Validate and parse time string (accepts M or M:SS)
      if (!isValidTimeString(editedVolume)) {
        toast.error(getTimeValidationError(editedVolume));
        return;
      }
      
      const minutes = parseTimeStringToMinutes(editedVolume);
      if (minutes === null) {
        toast.error('Invalid time format');
        return;
      }
      
      // Normalize to M:SS format for storage
      const normalizedTimeString = normalizeTimeString(editedVolume);
      
      await updateVolumeMutation.mutateAsync({
        habitId: habit.id,
        monthIndex: selectedMonth,
        minutes,
        timeString: normalizedTimeString,
      });
    } else {
      // Handle numeric volume for non-time units
      const volumeNum = parseInt(editedVolume, 10);
      if (isNaN(volumeNum) || volumeNum < 0) {
        toast.error('Please enter a valid number');
        return;
      }
      
      await updateVolumeMutation.mutateAsync({
        habitId: habit.id,
        monthIndex: selectedMonth,
        minutes: volumeNum,
      });
    }
    
    setIsEditingVolume(false);
  };

  const handleCancelVolumeEdit = () => {
    setEditedVolume(currentVolumeDisplay);
    setIsEditingVolume(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter') {
      handleSaveNameEdit();
    } else if (e.key === 'Escape') {
      handleCancelNameEdit();
    }
  };

  const handleUnitKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter') {
      handleSaveUnitEdit();
    } else if (e.key === 'Escape') {
      handleCancelUnitEdit();
    }
  };

  const handleVolumeKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter') {
      handleSaveVolumeEdit();
    } else if (e.key === 'Escape') {
      handleCancelVolumeEdit();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    if (currentUnit === 'time') {
      // Sanitize time input to allow only digits and one colon
      const sanitized = sanitizeTimeInput(newValue);
      setEditedVolume(sanitized);
    } else {
      // For non-time units, allow normal numeric input
      setEditedVolume(newValue);
    }
  };

  const handleVolumePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (currentUnit === 'time') {
      e.preventDefault();
      const pastedText = e.clipboardData.getData('text');
      const sanitized = sanitizePastedTimeInput(pastedText);
      setEditedVolume(sanitized);
    }
  };

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

  const handleUnitSelectChange = (value: string) => {
    if (value === 'custom') {
      setUseCustomUnit(true);
      setEditedUnit('');
    } else {
      setEditedUnit(value);
    }
  };

  return (
    <div className="flex flex-col hover:bg-muted/30 transition-colors">
      <div className="flex">
        {/* Habit info cell */}
        <div className={`${HABIT_INFO_WIDTH} flex-shrink-0 px-3 py-3 border-r-2 border-border group`}>
          {/* Habit name */}
          <div className="flex items-center gap-2 mb-2">
            {isEditingName ? (
              <>
                <Input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={handleNameKeyDown}
                  autoFocus
                  className="h-7 text-sm touch-optimized"
                  disabled={disabled}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 flex-shrink-0 touch-optimized"
                  onClick={handleSaveNameEdit}
                  disabled={disabled}
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 flex-shrink-0 touch-optimized"
                  onClick={handleCancelNameEdit}
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </Button>
              </>
            ) : (
              <>
                <span className="text-sm font-medium flex-1 truncate">{habit.name}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100 touch-visible-edit transition-opacity touch-optimized"
                  onClick={() => !disabled && setIsEditingName(true)}
                  disabled={disabled}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>

          {/* Unit type */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-muted-foreground w-10">Unit:</span>
            {isEditingUnit ? (
              <>
                {useCustomUnit ? (
                  <Input
                    type="text"
                    value={editedUnit}
                    onChange={(e) => setEditedUnit(e.target.value)}
                    onKeyDown={handleUnitKeyDown}
                    autoFocus
                    placeholder="Custom unit"
                    className="h-6 text-xs flex-1 touch-optimized"
                    disabled={disabled}
                  />
                ) : (
                  <Select value={editedUnit} onValueChange={handleUnitSelectChange} disabled={disabled}>
                    <SelectTrigger className="h-6 text-xs flex-1 touch-optimized">
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRESET_UNITS.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">Custom...</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 flex-shrink-0 touch-optimized"
                  onClick={handleSaveUnitEdit}
                  disabled={disabled}
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 flex-shrink-0 touch-optimized"
                  onClick={handleCancelUnitEdit}
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </Button>
              </>
            ) : (
              <>
                <span className="text-xs flex-1">{currentUnit}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100 touch-visible-edit transition-opacity touch-optimized"
                  onClick={() => !disabled && setIsEditingUnit(true)}
                  disabled={disabled}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-10">Vol:</span>
            {isEditingVolume ? (
              <>
                <Input
                  type="text"
                  value={editedVolume}
                  onChange={handleVolumeChange}
                  onPaste={handleVolumePaste}
                  onKeyDown={handleVolumeKeyDown}
                  autoFocus
                  placeholder={currentUnit === 'time' ? 'M or M:SS' : '0'}
                  className="h-6 text-xs flex-1 touch-optimized"
                  disabled={disabled}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 flex-shrink-0 touch-optimized"
                  onClick={handleSaveVolumeEdit}
                  disabled={disabled}
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 flex-shrink-0 touch-optimized"
                  onClick={handleCancelVolumeEdit}
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </Button>
              </>
            ) : (
              <>
                <span className="text-xs flex-1">{currentVolumeDisplay}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100 touch-visible-edit transition-opacity touch-optimized"
                  onClick={() => !disabled && setIsEditingVolume(true)}
                  disabled={disabled}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Day checkboxes - now aligned with header */}
        <div className="flex">
          {days.map((day) => {
            const isCompleted = isHabitCompletedOnDay(habit, selectedMonth, day);
            return (
              <div
                key={day}
                className={`${getDayColumnClasses()} py-3`}
              >
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

      {/* Monthly total volume row */}
      <div className="flex border-t border-border/50">
        <div className={`${HABIT_INFO_WIDTH} flex-shrink-0 px-3 py-2 border-r-2 border-border`}>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Monthly total:</span>
            <span className="text-xs font-semibold text-primary">
              {monthlyTotal} {currentUnit}
            </span>
          </div>
        </div>
        <div className="flex-1 px-2 py-2"></div>
      </div>
    </div>
  );
}
