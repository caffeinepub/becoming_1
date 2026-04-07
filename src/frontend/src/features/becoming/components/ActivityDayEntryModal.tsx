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
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  useGetDailyActivityEntry,
  useSetDailyActivityEntry,
} from "../api/queries";
import {
  ACTIVITY_PRESETS,
  type ActivityEntryData,
  type ActivityFieldConfig,
  type ActivityType,
} from "../types/activityTypes";

interface ActivityDayEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habitId: bigint;
  habitName: string;
  activityType: ActivityType;
  monthIndex: number;
  day: number;
  /** Called after successful save so parent can mark the day as completed */
  onSaved?: () => void;
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

type FieldValues = Record<string, string>;

function buildDefaultValues(preset: ReturnType<typeof getPreset>): FieldValues {
  const defaults: FieldValues = {};
  for (const field of preset.fields) {
    if (field.type === "select" && field.options?.length) {
      defaults[field.key] = field.options[0];
    } else {
      defaults[field.key] = "";
    }
  }
  return defaults;
}

function getPreset(activityType: ActivityType) {
  return ACTIVITY_PRESETS[activityType];
}

function entryDataToFieldValues(
  data: ActivityEntryData,
  activityType: ActivityType,
): FieldValues {
  const preset = getPreset(activityType);
  const values: FieldValues = buildDefaultValues(preset);
  const raw = data as unknown as Record<string, unknown>;
  for (const field of preset.fields) {
    const val = raw[field.key];
    if (val !== undefined && val !== null) {
      values[field.key] = String(val);
    }
  }
  return values;
}

function fieldValuesToEntryData(
  values: FieldValues,
  activityType: ActivityType,
): ActivityEntryData {
  const preset = getPreset(activityType);
  const result: Record<string, unknown> = {};

  for (const field of preset.fields) {
    const raw = values[field.key] ?? "";
    if (field.type === "number") {
      const num = Number.parseFloat(raw);
      result[field.key] = Number.isNaN(num) ? 0 : num;
    } else if (
      field.type === "text" ||
      field.type === "duration" ||
      field.type === "pace"
    ) {
      if (raw.trim()) result[field.key] = raw.trim();
    } else if (field.type === "select") {
      result[field.key] = raw;
    }
  }

  return result as unknown as ActivityEntryData;
}

// ─── Field renderer ───────────────────────────────────────────────────────────

interface FieldInputProps {
  field: ActivityFieldConfig;
  value: string;
  onChange: (key: string, value: string) => void;
}

function FieldInput({ field, value, onChange }: FieldInputProps) {
  if (field.type === "select" && field.options) {
    return (
      <Select value={value} onValueChange={(v) => onChange(field.key, v)}>
        <SelectTrigger id={field.key} className="w-full">
          <SelectValue placeholder={`Select ${field.label}`} />
        </SelectTrigger>
        <SelectContent>
          {field.options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  const inputType = field.type === "number" ? "number" : "text";
  const inputMode = field.type === "number" ? "decimal" : undefined;

  return (
    <div className="relative flex items-center">
      <Input
        id={field.key}
        type={inputType}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(field.key, e.target.value)}
        placeholder={field.placeholder}
        min={field.type === "number" ? 0 : undefined}
        step={field.type === "number" ? "any" : undefined}
        className="pr-12"
        data-ocid={`activity-field-${field.key}`}
      />
      {field.unit && (
        <span className="absolute right-3 text-xs text-muted-foreground pointer-events-none select-none">
          {field.unit}
        </span>
      )}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function ActivityDayEntryModal({
  open,
  onOpenChange,
  habitId,
  habitName,
  activityType,
  monthIndex,
  day,
  onSaved,
}: ActivityDayEntryModalProps) {
  const preset = getPreset(activityType);
  const [fieldValues, setFieldValues] = useState<FieldValues>(() =>
    buildDefaultValues(preset),
  );
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data: existingEntry, isLoading: isLoadingEntry } =
    useGetDailyActivityEntry(habitId, monthIndex, day);

  const setActivityEntry = useSetDailyActivityEntry();
  const isSaving = setActivityEntry.isPending;

  // Pre-fill from existing entry when data loads
  useEffect(() => {
    if (existingEntry) {
      setFieldValues(entryDataToFieldValues(existingEntry.data, activityType));
    } else {
      setFieldValues(buildDefaultValues(preset));
    }
    setSaveError(null);
  }, [existingEntry, activityType, preset]);

  // Reset on open/close
  useEffect(() => {
    if (!open) {
      setSaveError(null);
    }
  }, [open]);

  const handleFieldChange = (key: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaveError(null);

    // Validate required fields
    for (const field of preset.fields) {
      if (field.required && !fieldValues[field.key]?.trim()) {
        setSaveError(`"${field.label}" is required`);
        return;
      }
    }

    try {
      const entryData = fieldValuesToEntryData(fieldValues, activityType);
      await setActivityEntry.mutateAsync({
        habitId,
        monthIndex,
        day,
        activityType,
        entryData,
      });
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save";
      setSaveError(message);
    }
  };

  const handleCancel = () => {
    setSaveError(null);
    onOpenChange(false);
  };

  const title = `${habitName} — ${MONTH_NAMES[monthIndex]} ${day}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[420px] backdrop-blur-sm bg-card/95 border border-border/60 shadow-lg"
        data-ocid="activity-day-entry-modal"
      >
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-foreground">
            {title}
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">{preset.label}</p>
        </DialogHeader>

        {isLoadingEntry ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4 py-2">
            {preset.fields.map((field) => (
              <div key={field.key} className="grid gap-1.5">
                <Label
                  htmlFor={field.key}
                  className="text-sm font-medium flex items-center gap-1"
                >
                  {field.label}
                  {field.required && (
                    <span className="text-destructive text-xs">*</span>
                  )}
                </Label>
                <FieldInput
                  field={field}
                  value={fieldValues[field.key] ?? ""}
                  onChange={handleFieldChange}
                />
              </div>
            ))}

            {/* Error state */}
            {saveError && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive flex items-center justify-between gap-2">
                <span>{saveError}</span>
                <button
                  type="button"
                  className="text-xs underline underline-offset-2 shrink-0 hover:no-underline"
                  onClick={handleSave}
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
            data-ocid="activity-modal-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || isLoadingEntry}
            data-ocid="activity-modal-save"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
