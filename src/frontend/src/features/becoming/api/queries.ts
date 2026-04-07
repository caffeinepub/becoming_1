import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Habit, TimeVolumeEntry } from "../../../backend";
import { useActorWithTimeout } from "../../../hooks/useActorWithTimeout";
import { normalizeError } from "../../../utils/icErrors";
import {
  type HabitWithCompletion,
  buildCompletionMap,
  computeCompoundedVolumeTracking,
} from "../state/habitModel";
import type { ActivityDayEntry, ActivityType } from "../types/activityTypes";

function getHabitsQueryKey(principalText: string | null) {
  return ["habits", principalText];
}

export function useHabits() {
  const {
    actor,
    isFetching: isActorFetching,
    error: actorError,
    isError: isActorError,
    retry: retryActor,
  } = useActorWithTimeout();
  const { identity } = useInternetIdentity();

  const isAuthenticated = !!identity;
  const principalText = identity?.getPrincipal().toString() || null;

  const query = useQuery<HabitWithCompletion[]>({
    queryKey: getHabitsQueryKey(principalText),
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      try {
        const habits = await actor.getHabits();
        return habits.map(buildCompletionMap);
      } catch (error) {
        // Normalize errors from backend calls
        throw normalizeError(error);
      }
    },
    enabled: !!actor && !isActorFetching && isAuthenticated,
    retry: false,
  });

  // Normalize and expose actor error if it exists, otherwise query error
  const error = isActorError
    ? normalizeError(actorError)
    : query.error
      ? normalizeError(query.error)
      : null;
  const isError = isActorError || query.isError;

  // Return custom state that properly reflects actor dependency
  return {
    ...query,
    isLoading: isActorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
    error,
    isError,
    retry: () => {
      if (isActorError) {
        retryActor();
      } else {
        query.refetch();
      }
    },
  };
}

export function useAddHabit() {
  const { actor } = useActorWithTimeout();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!identity) {
        throw new Error("You must be signed in to add habits");
      }
      if (!actor) throw new Error("Actor not initialized");
      await actor.addHabit(name, "", null);
    },
    onSuccess: () => {
      const principalText = identity?.getPrincipal().toString() || null;
      queryClient.invalidateQueries({
        queryKey: getHabitsQueryKey(principalText),
      });
      toast.success("Habit added successfully");
    },
    onError: (error) => {
      toast.error(`Failed to add habit: ${error.message}`);
    },
  });
}

export function useUpdateHabit() {
  const { actor } = useActorWithTimeout();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      habitId,
      name,
    }: { habitId: bigint; name: string }) => {
      if (!identity) {
        throw new Error("You must be signed in to update habits");
      }
      if (!actor) throw new Error("Actor not initialized");
      await actor.updateHabit(habitId, name, "", null);
    },
    onSuccess: () => {
      const principalText = identity?.getPrincipal().toString() || null;
      queryClient.invalidateQueries({
        queryKey: getHabitsQueryKey(principalText),
      });
      toast.success("Habit updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update habit: ${error.message}`);
    },
  });
}

export function useToggleCompletion() {
  const { actor } = useActorWithTimeout();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      habitId,
      monthIndex,
      day,
      completed,
    }: {
      habitId: bigint;
      monthIndex: number;
      day: number;
      completed: boolean;
    }) => {
      if (!identity) {
        throw new Error("You must be signed in to update completion");
      }
      if (!actor) throw new Error("Actor not initialized");
      await actor.toggleCompletion(
        habitId,
        BigInt(monthIndex),
        BigInt(day),
        completed,
      );
    },
    onMutate: async ({ habitId, monthIndex, day, completed }) => {
      const principalText = identity?.getPrincipal().toString() || null;
      const queryKey = getHabitsQueryKey(principalText);

      await queryClient.cancelQueries({ queryKey });

      const previousHabits =
        queryClient.getQueryData<HabitWithCompletion[]>(queryKey);

      // Optimistic update with immutable data structures
      queryClient.setQueryData<HabitWithCompletion[]>(queryKey, (old) => {
        if (!old) return old;
        return old.map((habit) => {
          if (habit.id === habitId) {
            // Create a completely new habit object with new Map instances
            const newCompletionMap = new Map<number, Map<number, boolean>>();

            // Copy all months
            for (const [month, dayMap] of habit.completionMap.entries()) {
              if (month === monthIndex) {
                // Create new Map for the modified month
                const newDayMap = new Map(dayMap);
                newDayMap.set(day, completed);
                newCompletionMap.set(month, newDayMap);
              } else {
                // Copy other months as-is (still create new Map for immutability)
                newCompletionMap.set(month, new Map(dayMap));
              }
            }

            return {
              ...habit,
              completionMap: newCompletionMap,
            };
          }
          return habit;
        });
      });

      return { previousHabits, queryKey };
    },
    onError: (error, _variables, context) => {
      if (context?.previousHabits && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousHabits);
      }
      toast.error(`Failed to update completion: ${error.message}`);
    },
    onSettled: (_data, error, _variables, context) => {
      // Only refetch if there was an error, otherwise trust optimistic update
      if (error && context?.queryKey) {
        queryClient.invalidateQueries({ queryKey: context.queryKey });
      }
    },
  });
}

export function useUpdateHabitUnitType() {
  const { actor } = useActorWithTimeout();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      habitId,
      unitType,
    }: { habitId: bigint; unitType: string }) => {
      if (!identity) {
        throw new Error("You must be signed in to update unit type");
      }
      if (!actor) throw new Error("Actor not initialized");
      await actor.updateHabitUnitType(habitId, unitType);
    },
    onMutate: async ({ habitId, unitType }) => {
      const principalText = identity?.getPrincipal().toString() || null;
      const queryKey = getHabitsQueryKey(principalText);

      await queryClient.cancelQueries({ queryKey });

      const previousHabits =
        queryClient.getQueryData<HabitWithCompletion[]>(queryKey);

      const defaultEntry: TimeVolumeEntry = {
        timeString: undefined,
        minutes: BigInt(0),
      };

      queryClient.setQueryData<HabitWithCompletion[]>(queryKey, (old) => {
        if (!old) return old;
        return old.map((habit) => {
          if (habit.id === habitId) {
            const updatedHabit: Habit = {
              ...habit,
              volumeTracking: habit.volumeTracking
                ? { ...habit.volumeTracking, unitType }
                : {
                    unitType,
                    january: defaultEntry,
                    february: defaultEntry,
                    march: defaultEntry,
                    april: defaultEntry,
                    may: defaultEntry,
                    june: defaultEntry,
                    july: defaultEntry,
                    august: defaultEntry,
                    september: defaultEntry,
                    october: defaultEntry,
                    november: defaultEntry,
                    december: defaultEntry,
                  },
            };
            return buildCompletionMap(updatedHabit);
          }
          return habit;
        });
      });

      return { previousHabits, queryKey };
    },
    onError: (error, _variables, context) => {
      if (context?.previousHabits && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousHabits);
      }
      toast.error(`Failed to update unit type: ${error.message}`);
    },
    onSettled: (_data, _error, _variables, context) => {
      if (context?.queryKey) {
        queryClient.invalidateQueries({ queryKey: context.queryKey });
      }
    },
  });
}

export function useUpdateHabitVolume() {
  const { actor } = useActorWithTimeout();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      habitId,
      monthIndex,
      minutes,
      timeString,
    }: {
      habitId: bigint;
      monthIndex: number;
      minutes: number;
      timeString?: string;
    }) => {
      if (!identity) {
        throw new Error("You must be signed in to update volume");
      }
      if (!actor) throw new Error("Actor not initialized");

      const entry: TimeVolumeEntry = {
        minutes: BigInt(minutes),
        timeString: timeString || undefined,
      };

      await actor.updateHabitVolume(habitId, BigInt(monthIndex), entry);
    },
    onMutate: async ({ habitId, monthIndex, minutes, timeString }) => {
      const principalText = identity?.getPrincipal().toString() || null;
      const queryKey = getHabitsQueryKey(principalText);

      await queryClient.cancelQueries({ queryKey });

      const previousHabits =
        queryClient.getQueryData<HabitWithCompletion[]>(queryKey);

      queryClient.setQueryData<HabitWithCompletion[]>(queryKey, (old) => {
        if (!old) return old;
        return old.map((habit) => {
          if (habit.id === habitId) {
            // Compute compounded volume tracking with habit-specific progression rules
            const updatedVolumeTracking = computeCompoundedVolumeTracking(
              habit.volumeTracking,
              monthIndex,
              minutes,
              habit.name,
              timeString,
            );

            const updatedHabit: Habit = {
              ...habit,
              volumeTracking: updatedVolumeTracking,
            };
            return buildCompletionMap(updatedHabit);
          }
          return habit;
        });
      });

      return { previousHabits, queryKey };
    },
    onError: (error, _variables, context) => {
      if (context?.previousHabits && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousHabits);
      }
      toast.error(`Failed to update volume: ${error.message}`);
    },
    onSettled: (_data, _error, _variables, context) => {
      if (context?.queryKey) {
        queryClient.invalidateQueries({ queryKey: context.queryKey });
      }
    },
  });
}

// ─── Habit activity type hooks ────────────────────────────────────────────────

/**
 * Stores/reads the ActivityType association for a habit (localStorage-backed).
 * Used to determine whether a habit cell should open a multi-field modal.
 */
function localHabitActivityTypeKey(principalText: string, habitId: bigint) {
  return `habitActivityType:${principalText}:${habitId}`;
}

function getHabitActivityTypeQueryKey(
  principalText: string | null,
  habitId: bigint,
) {
  return ["habitActivityType", principalText, habitId.toString()];
}

export function useGetHabitActivityType(habitId: bigint) {
  const { identity } = useInternetIdentity();
  const principalText = identity?.getPrincipal().toString() ?? null;

  return useQuery<ActivityType | null>({
    queryKey: getHabitActivityTypeQueryKey(principalText, habitId),
    queryFn: () => {
      if (!principalText) return null;
      const key = localHabitActivityTypeKey(principalText, habitId);
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return raw as ActivityType;
    },
    enabled: !!principalText,
  });
}

export function useSetHabitActivityType() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      habitId,
      activityType,
    }: { habitId: bigint; activityType: ActivityType | null }) => {
      if (!identity) throw new Error("You must be signed in");
      const principalText = identity.getPrincipal().toString();
      const key = localHabitActivityTypeKey(principalText, habitId);
      if (activityType) {
        localStorage.setItem(key, activityType);
      } else {
        localStorage.removeItem(key);
      }
      return activityType;
    },
    onSuccess: (_data, { habitId }) => {
      const principalText = identity?.getPrincipal().toString() ?? null;
      queryClient.invalidateQueries({
        queryKey: getHabitActivityTypeQueryKey(principalText, habitId),
      });
    },
    onError: (error: Error) => {
      toast.error(`Failed to set activity type: ${error.message}`);
    },
  });
}

// ─── Activity entry hooks ─────────────────────────────────────────────────────

/**
 * Local in-memory store key for activity entries.
 * Activity entries are stored client-side as the current backend does not
 * yet expose setDailyActivityEntry / getDailyActivityEntry methods.
 * When those backend methods are added, replace the localStorage calls below
 * with actor calls.
 */
function getActivityQueryKey(
  principalText: string | null,
  habitId: bigint,
  monthIndex: number,
  day: number,
) {
  return ["activityEntry", principalText, habitId.toString(), monthIndex, day];
}

function localActivityKey(
  principalText: string,
  habitId: bigint,
  monthIndex: number,
  day: number,
) {
  return `activity:${principalText}:${habitId}:${monthIndex}:${day}`;
}

/**
 * Fetches the stored ActivityDayEntry for a specific habit day.
 * Falls back to localStorage until backend exposes the method.
 */
export function useGetDailyActivityEntry(
  habitId: bigint,
  monthIndex: number,
  day: number,
) {
  const { identity } = useInternetIdentity();
  const principalText = identity?.getPrincipal().toString() ?? null;

  return useQuery<ActivityDayEntry | null>({
    queryKey: getActivityQueryKey(principalText, habitId, monthIndex, day),
    queryFn: () => {
      if (!principalText) return null;
      const key = localActivityKey(principalText, habitId, monthIndex, day);
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as ActivityDayEntry;
      } catch {
        return null;
      }
    },
    enabled: !!principalText,
  });
}

/**
 * Saves an ActivityDayEntry for a specific habit day.
 * Persists to localStorage until backend exposes the method.
 */
export function useSetDailyActivityEntry() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      habitId,
      monthIndex,
      day,
      activityType,
      entryData,
    }: {
      habitId: bigint;
      monthIndex: number;
      day: number;
      activityType: ActivityType;
      entryData: ActivityDayEntry["data"];
    }) => {
      if (!identity) {
        throw new Error("You must be signed in to log an activity");
      }
      const principalText = identity.getPrincipal().toString();
      const key = localActivityKey(principalText, habitId, monthIndex, day);
      const entry: ActivityDayEntry = { type: activityType, data: entryData };
      localStorage.setItem(key, JSON.stringify(entry));
      return entry;
    },
    onSuccess: (_data, { habitId, monthIndex, day }) => {
      const principalText = identity?.getPrincipal().toString() ?? null;
      queryClient.invalidateQueries({
        queryKey: getActivityQueryKey(principalText, habitId, monthIndex, day),
      });
    },
    onError: (error: Error) => {
      toast.error(`Failed to save activity: ${error.message}`);
    },
  });
}
