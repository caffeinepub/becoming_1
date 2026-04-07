/**
 * Activity type definitions for preset fitness habit tracking.
 * These types describe multi-field daily entries for structured activities
 * like running, cycling, strength training, and swimming.
 */

export type ActivityType =
  | "running"
  | "cycling"
  | "strength"
  | "swimming"
  | "freeform";

// ─── Per-activity entry shapes ────────────────────────────────────────────────

export interface RunningEntry {
  distance: number;
  duration?: string;
  pace?: string;
}

export interface CyclingEntry {
  distance: number;
  duration?: string;
  intensity?: "Easy" | "Moderate" | "Hard" | "Max";
}

export interface StrengthEntry {
  exerciseName: string;
  sets: number;
  reps: number;
  weight: number;
  unit: "kg" | "lbs";
}

export interface SwimmingEntry {
  distance: number;
  duration?: string;
  strokeType?:
    | "Freestyle"
    | "Breaststroke"
    | "Backstroke"
    | "Butterfly"
    | "Mixed";
}

export interface FreeformEntry {
  value: number;
  notes?: string;
}

export type ActivityEntryData =
  | RunningEntry
  | CyclingEntry
  | StrengthEntry
  | SwimmingEntry
  | FreeformEntry;

/** A single day's activity log entry */
export interface ActivityDayEntry {
  type: ActivityType;
  data: ActivityEntryData;
}

// ─── Field descriptor types ───────────────────────────────────────────────────

export type FieldType = "number" | "text" | "duration" | "select" | "pace";

export interface ActivityFieldConfig {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
  unit?: string;
}

export interface ActivityPresetConfig {
  label: string;
  fields: ActivityFieldConfig[];
  /** The field key used to compute primary monthly metric */
  primaryMetric: string;
  /** Display unit for the primary metric total */
  unit: string;
}

// ─── Preset configurations ────────────────────────────────────────────────────

export const ACTIVITY_PRESETS: Record<ActivityType, ActivityPresetConfig> = {
  running: {
    label: "Running",
    primaryMetric: "distance",
    unit: "km",
    fields: [
      {
        key: "distance",
        label: "Distance",
        type: "number",
        required: true,
        placeholder: "0.0",
        unit: "km",
      },
      {
        key: "duration",
        label: "Duration",
        type: "duration",
        required: false,
        placeholder: "mm:ss",
      },
      {
        key: "pace",
        label: "Pace",
        type: "pace",
        required: false,
        placeholder: "min/km",
      },
    ],
  },

  cycling: {
    label: "Cycling",
    primaryMetric: "distance",
    unit: "km",
    fields: [
      {
        key: "distance",
        label: "Distance",
        type: "number",
        required: true,
        placeholder: "0.0",
        unit: "km",
      },
      {
        key: "duration",
        label: "Duration",
        type: "duration",
        required: false,
        placeholder: "mm:ss",
      },
      {
        key: "intensity",
        label: "Intensity",
        type: "select",
        required: false,
        options: ["Easy", "Moderate", "Hard", "Max"],
      },
    ],
  },

  strength: {
    label: "Strength Training",
    primaryMetric: "reps",
    unit: "reps",
    fields: [
      {
        key: "exerciseName",
        label: "Exercise",
        type: "text",
        required: true,
        placeholder: "e.g. Bench Press",
      },
      {
        key: "sets",
        label: "Sets",
        type: "number",
        required: true,
        placeholder: "3",
      },
      {
        key: "reps",
        label: "Reps",
        type: "number",
        required: true,
        placeholder: "10",
      },
      {
        key: "weight",
        label: "Weight",
        type: "number",
        required: true,
        placeholder: "0",
      },
      {
        key: "unit",
        label: "Unit",
        type: "select",
        required: true,
        options: ["kg", "lbs"],
      },
    ],
  },

  swimming: {
    label: "Swimming",
    primaryMetric: "distance",
    unit: "km",
    fields: [
      {
        key: "distance",
        label: "Distance",
        type: "number",
        required: true,
        placeholder: "0.0",
        unit: "km",
      },
      {
        key: "duration",
        label: "Duration",
        type: "duration",
        required: false,
        placeholder: "mm:ss",
      },
      {
        key: "strokeType",
        label: "Stroke",
        type: "select",
        required: false,
        options: [
          "Freestyle",
          "Breaststroke",
          "Backstroke",
          "Butterfly",
          "Mixed",
        ],
      },
    ],
  },

  freeform: {
    label: "Custom",
    primaryMetric: "value",
    unit: "",
    fields: [
      {
        key: "value",
        label: "Value",
        type: "number",
        required: true,
        placeholder: "0",
      },
      {
        key: "notes",
        label: "Notes",
        type: "text",
        required: false,
        placeholder: "Optional notes",
      },
    ],
  },
};

// ─── Type guards ──────────────────────────────────────────────────────────────

export function isRunningEntry(data: ActivityEntryData): data is RunningEntry {
  return "distance" in data && !("sets" in data) && !("strokeType" in data);
}

export function isCyclingEntry(data: ActivityEntryData): data is CyclingEntry {
  return (
    "intensity" in data ||
    ("distance" in data &&
      !("strokeType" in data) &&
      !("sets" in data) &&
      !("pace" in data))
  );
}

export function isStrengthEntry(
  data: ActivityEntryData,
): data is StrengthEntry {
  return "sets" in data && "reps" in data && "weight" in data;
}

export function isSwimmingEntry(
  data: ActivityEntryData,
): data is SwimmingEntry {
  return (
    "strokeType" in data ||
    ("distance" in data &&
      !("intensity" in data) &&
      !("sets" in data) &&
      !("pace" in data))
  );
}

// ─── Primary metric extractor ─────────────────────────────────────────────────

/**
 * Extracts the numeric primary metric value from an activity entry.
 * - Running/Cycling/Swimming → distance (km)
 * - Strength → total reps (sets × reps)
 * - Freeform → value
 */
export function extractPrimaryMetric(entry: ActivityDayEntry): number {
  const { type, data } = entry;

  switch (type) {
    case "running":
    case "cycling":
    case "swimming": {
      const d = data as RunningEntry | CyclingEntry | SwimmingEntry;
      return d.distance ?? 0;
    }
    case "strength": {
      const s = data as StrengthEntry;
      return (s.sets ?? 0) * (s.reps ?? 0);
    }
    case "freeform": {
      const f = data as FreeformEntry;
      return f.value ?? 0;
    }
    default:
      return 0;
  }
}
