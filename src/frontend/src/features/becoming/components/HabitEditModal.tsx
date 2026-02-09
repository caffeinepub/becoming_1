import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
} from '../api/queries';
import { getVolumeDisplayString, getUnitType, type HabitWithCompletion } from '../state/habitModel';
import { isValidTimeString, parseTimeStringToMinutes, getTimeValidationError, sanitizeTimeInput, sanitizePastedTimeInput, normalizeTimeString } from '../utils/timeVolume';
import { toast } from 'sonner';

interface HabitEditModalProps {
  habit: HabitWithCompletion;
  selectedMonth: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRESET_UNITS = ['reps', 'time', 'km'];

export function HabitEditModal({ habit, selectedMonth, open, onOpenChange }: HabitEditModalProps) {
  const [editedName, setEditedName] = useState(habit.name);
  const [editedUnit, setEditedUnit] = useState(getUnitType(habit));
  const [editedVolume, setEditedVolume] = useState(getVolumeDisplayString(habit, selectedMonth));
  const [useCustomUnit, setUseCustomUnit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const updateNameMutation = useUpdateHabit();
  const updateUnitMutation = useUpdateHabitUnitType();
  const updateVolumeMutation = useUpdateHabitVolume();

  // Reset form when habit or month changes
  useEffect(() => {
    setEditedName(habit.name);
    setEditedUnit(getUnitType(habit));
    setEditedVolume(getVolumeDisplayString(habit, selectedMonth));
    setUseCustomUnit(!PRESET_UNITS.includes(getUnitType(habit)));
  }, [habit, selectedMonth]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update name if changed
      if (editedName.trim() && editedName !== habit.name) {
        await updateNameMutation.mutateAsync({
          habitId: habit.id,
          name: editedName.trim(),
        });
      }

      // Update unit type if changed
      const currentUnit = getUnitType(habit);
      if (editedUnit.trim() && editedUnit !== currentUnit) {
        await updateUnitMutation.mutateAsync({
          habitId: habit.id,
          unitType: editedUnit.trim(),
        });
      }

      // Update volume if changed
      const currentVolumeDisplay = getVolumeDisplayString(habit, selectedMonth);
      if (editedVolume !== currentVolumeDisplay) {
        if (editedUnit === 'time') {
          // Validate and parse time string (accepts M or M:SS)
          if (!isValidTimeString(editedVolume)) {
            toast.error(getTimeValidationError(editedVolume));
            setIsSaving(false);
            return;
          }
          
          const minutes = parseTimeStringToMinutes(editedVolume);
          if (minutes === null) {
            toast.error('Invalid time format');
            setIsSaving(false);
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
            setIsSaving(false);
            return;
          }
          
          await updateVolumeMutation.mutateAsync({
            habitId: habit.id,
            monthIndex: selectedMonth,
            minutes: volumeNum,
          });
        }
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Error saving habit:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedName(habit.name);
    setEditedUnit(getUnitType(habit));
    setEditedVolume(getVolumeDisplayString(habit, selectedMonth));
    setUseCustomUnit(false);
    onOpenChange(false);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    if (editedUnit === 'time') {
      // Sanitize time input to allow only digits and one colon
      const sanitized = sanitizeTimeInput(newValue);
      setEditedVolume(sanitized);
    } else {
      // For non-time units, allow normal numeric input
      setEditedVolume(newValue);
    }
  };

  const handleVolumePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (editedUnit === 'time') {
      e.preventDefault();
      const pastedText = e.clipboardData.getData('text');
      const sanitized = sanitizePastedTimeInput(pastedText);
      setEditedVolume(sanitized);
    }
  };

  const handleUnitSelectChange = (value: string) => {
    if (value === 'custom') {
      setUseCustomUnit(true);
      setEditedUnit('');
    } else {
      setUseCustomUnit(false);
      setEditedUnit(value);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Habit</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Habit Name</Label>
            <Input
              id="name"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              placeholder="Enter habit name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="unit">Unit Type</Label>
            {useCustomUnit ? (
              <Input
                id="unit"
                value={editedUnit}
                onChange={(e) => setEditedUnit(e.target.value)}
                placeholder="Custom unit"
              />
            ) : (
              <Select value={editedUnit} onValueChange={handleUnitSelectChange}>
                <SelectTrigger id="unit">
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
          </div>
          <div className="grid gap-2">
            <Label htmlFor="volume">
              {editedUnit === 'reps' || editedUnit === 'time' ? 'Volume per completion' : 'Monthly Goal'}
            </Label>
            <Input
              id="volume"
              value={editedVolume}
              onChange={handleVolumeChange}
              onPaste={handleVolumePaste}
              placeholder={editedUnit === 'time' ? 'M:SS or M' : '0'}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
