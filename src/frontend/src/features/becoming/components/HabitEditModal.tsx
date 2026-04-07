import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useUpdateHabit,
  useUpdateHabitUnitType,
  useUpdateHabitVolume,
} from "../api/queries";
import {
  type HabitWithCompletion,
  getUnitType,
  getVolumeDisplayString,
} from "../state/habitModel";
import type { ActivityType } from "../types/activityTypes";
import {
  getTimeValidationError,
  isValidTimeString,
  normalizeTimeString,
  parseTimeStringToMinutes,
  sanitizePastedTimeInput,
  sanitizeTimeInput,
} from "../utils/timeVolume";

interface HabitEditModalProps {
  habit: HabitWithCompletion;
  selectedMonth: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRESET_UNITS = ["reps", "time", "km"];

type ActivityOption = {
  type: ActivityType;
  label: string;
  emoji: string;
  description: string;
};

const ACTIVITY_OPTIONS: ActivityOption[] = [
  {
    type: "running",
    label: "Running",
    emoji: "🏃",
    description: "Track distance (km), time & auto-calculated pace",
  },
  {
    type: "cycling",
    label: "Cycling",
    emoji: "🚴",
    description: "Track distance, duration & intensity level",
  },
  {
    type: "strength",
    label: "Strength",
    emoji: "🏋️",
    description: "Log sets, reps & weight per day",
  },
  {
    type: "swimming",
    label: "Swimming",
    emoji: "🏊",
    description: "Track distance, duration & stroke type",
  },
  {
    type: "freeform",
    label: "Custom",
    emoji: "✏️",
    description: "Choose your own unit — reps, time, km or custom",
  },
];

const INTENSITY_OPTIONS = ["Easy", "Moderate", "Hard", "Max"];
const STROKE_OPTIONS = [
  "Freestyle",
  "Breaststroke",
  "Backstroke",
  "Butterfly",
  "Mixed",
];

function ActivityTypeSelector({
  selected,
  onChange,
}: {
  selected: ActivityType;
  onChange: (type: ActivityType) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {ACTIVITY_OPTIONS.map((opt) => {
        const isSelected = selected === opt.type;
        return (
          <button
            key={opt.type}
            type="button"
            onClick={() => onChange(opt.type)}
            className={cn(
              "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all duration-200",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              isSelected
                ? "border-primary bg-primary/10 shadow-sm"
                : "border-border bg-card hover:border-primary/40 hover:bg-primary/5",
            )}
            data-ocid={`activity-type-btn-${opt.type}`}
          >
            <span className="text-xl leading-none">{opt.emoji}</span>
            <span
              className={cn(
                "text-sm font-semibold",
                isSelected ? "text-primary" : "text-foreground",
              )}
            >
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ActivityContextInfo({ type }: { type: ActivityType }) {
  if (type === "freeform") return null;

  const option = ACTIVITY_OPTIONS.find((o) => o.type === type);
  if (!option) return null;

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
      <p className="text-xs font-medium text-primary">{option.description}</p>
    </div>
  );
}

export function HabitEditModal({
  habit,
  selectedMonth,
  open,
  onOpenChange,
}: HabitEditModalProps) {
  const [editedName, setEditedName] = useState(habit.name);
  const [editedUnit, setEditedUnit] = useState(getUnitType(habit));
  const [editedVolume, setEditedVolume] = useState(
    getVolumeDisplayString(habit, selectedMonth),
  );
  const [useCustomUnit, setUseCustomUnit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activityType, setActivityType] = useState<ActivityType>("freeform");

  // Contextual fields for specific activity types
  const [intensity, setIntensity] = useState<string>("Moderate");
  const [strokeType, setStrokeType] = useState<string>("Freestyle");

  const updateNameMutation = useUpdateHabit();
  const updateUnitMutation = useUpdateHabitUnitType();
  const updateVolumeMutation = useUpdateHabitVolume();

  // Reset form when habit or month changes
  useEffect(() => {
    setEditedName(habit.name);
    setEditedUnit(getUnitType(habit));
    setEditedVolume(getVolumeDisplayString(habit, selectedMonth));
    setUseCustomUnit(!PRESET_UNITS.includes(getUnitType(habit)));

    // Derive activity type from existing habit data
    const unitType = getUnitType(habit);
    if (unitType === "km") {
      setActivityType("running");
    } else {
      setActivityType("freeform");
    }
    setIntensity("Moderate");
    setStrokeType("Freestyle");
  }, [habit, selectedMonth]);

  // When activity type changes, set appropriate unit
  const handleActivityTypeChange = (type: ActivityType) => {
    setActivityType(type);
    if (type === "running" || type === "cycling" || type === "swimming") {
      setEditedUnit("km");
      setUseCustomUnit(false);
    } else if (type === "strength") {
      setEditedUnit("reps");
      setUseCustomUnit(false);
    }
    // freeform keeps whatever was set
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (editedName.trim() && editedName !== habit.name) {
        await updateNameMutation.mutateAsync({
          habitId: habit.id,
          name: editedName.trim(),
        });
      }

      const currentUnit = getUnitType(habit);
      if (editedUnit.trim() && editedUnit !== currentUnit) {
        await updateUnitMutation.mutateAsync({
          habitId: habit.id,
          unitType: editedUnit.trim(),
        });
      }

      if (editedUnit === "reps" || editedUnit === "time") {
        const currentVolumeDisplay = getVolumeDisplayString(
          habit,
          selectedMonth,
        );
        if (editedVolume !== currentVolumeDisplay) {
          if (editedUnit === "time") {
            if (!isValidTimeString(editedVolume)) {
              toast.error(getTimeValidationError(editedVolume));
              setIsSaving(false);
              return;
            }

            const minutes = parseTimeStringToMinutes(editedVolume);
            if (minutes === null) {
              toast.error("Invalid time format");
              setIsSaving(false);
              return;
            }

            const normalizedTimeString = normalizeTimeString(editedVolume);
            await updateVolumeMutation.mutateAsync({
              habitId: habit.id,
              monthIndex: selectedMonth,
              minutes,
              timeString: normalizedTimeString,
            });
          } else {
            const volumeNum = Number.parseInt(editedVolume, 10);
            if (Number.isNaN(volumeNum) || volumeNum < 0) {
              toast.error("Please enter a valid number");
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
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error saving habit:", error);
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
    if (editedUnit === "time") {
      setEditedVolume(sanitizeTimeInput(newValue));
    } else {
      setEditedVolume(newValue);
    }
  };

  const handleVolumePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (editedUnit === "time") {
      e.preventDefault();
      const pastedText = e.clipboardData.getData("text");
      setEditedVolume(sanitizePastedTimeInput(pastedText));
    }
  };

  const handleUnitSelectChange = (value: string) => {
    if (value === "custom") {
      setUseCustomUnit(true);
      setEditedUnit("");
    } else {
      setUseCustomUnit(false);
      setEditedUnit(value);
    }
  };

  const showVolumeInput = editedUnit === "reps" || editedUnit === "time";
  const isFreeform = activityType === "freeform";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Edit Habit</DialogTitle>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          {/* Activity Type Section */}
          <div className="grid gap-3">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-semibold">Activity Type</Label>
              <Badge variant="secondary" className="text-xs">
                {ACTIVITY_OPTIONS.find((o) => o.type === activityType)?.label ??
                  "Custom"}
              </Badge>
            </div>
            <ActivityTypeSelector
              selected={activityType}
              onChange={handleActivityTypeChange}
            />
            <ActivityContextInfo type={activityType} />
          </div>

          {/* Cycling: Intensity selector */}
          {activityType === "cycling" && (
            <div className="grid gap-2">
              <Label htmlFor="intensity">Intensity Level</Label>
              <Select value={intensity} onValueChange={setIntensity}>
                <SelectTrigger
                  id="intensity"
                  data-ocid="cycling-intensity-select"
                >
                  <SelectValue placeholder="Select intensity" />
                </SelectTrigger>
                <SelectContent>
                  {INTENSITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Swimming: Stroke type selector */}
          {activityType === "swimming" && (
            <div className="grid gap-2">
              <Label htmlFor="strokeType">Stroke Type</Label>
              <Select value={strokeType} onValueChange={setStrokeType}>
                <SelectTrigger
                  id="strokeType"
                  data-ocid="swimming-stroke-select"
                >
                  <SelectValue placeholder="Select stroke" />
                </SelectTrigger>
                <SelectContent>
                  {STROKE_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Strength Training info */}
          {activityType === "strength" && (
            <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
                  Sets, reps & weight
                </span>{" "}
                will be entered each day when you log your workout via the daily
                grid.
              </p>
            </div>
          )}

          <div className="border-t border-border" />

          {/* Habit Name */}
          <div className="grid gap-2">
            <Label htmlFor="name">Habit Name</Label>
            <Input
              id="name"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              placeholder="Enter habit name"
              data-ocid="habit-name-input"
            />
          </div>

          {/* Unit Type — only shown for freeform / custom */}
          {isFreeform && (
            <div className="grid gap-2">
              <Label htmlFor="unit">Unit Type</Label>
              {useCustomUnit ? (
                <Input
                  id="unit"
                  value={editedUnit}
                  onChange={(e) => setEditedUnit(e.target.value)}
                  placeholder="Custom unit (e.g. pages, glasses)"
                  data-ocid="habit-unit-custom-input"
                />
              ) : (
                <Select
                  value={editedUnit}
                  onValueChange={handleUnitSelectChange}
                >
                  <SelectTrigger id="unit" data-ocid="habit-unit-select">
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
          )}

          {/* Volume — only for reps/time */}
          {showVolumeInput && (
            <div className="grid gap-2">
              <Label htmlFor="volume">Volume per completion</Label>
              <Input
                id="volume"
                value={editedVolume}
                onChange={handleVolumeChange}
                onPaste={handleVolumePaste}
                placeholder={editedUnit === "time" ? "M:SS or M" : "0"}
                data-ocid="habit-volume-input"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
            data-ocid="habit-edit-cancel-btn"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            data-ocid="habit-edit-save-btn"
          >
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
