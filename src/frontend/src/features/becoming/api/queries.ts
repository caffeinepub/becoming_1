import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActorWithTimeout } from '../../../hooks/useActorWithTimeout';
import { useInternetIdentity } from '../../../hooks/useInternetIdentity';
import type { Habit, TimeVolumeEntry } from '../../../backend';
import { buildCompletionMap, type HabitWithCompletion, computeCompoundedVolumeTracking } from '../state/habitModel';
import { toast } from 'sonner';

function getHabitsQueryKey(principalText: string | null) {
  return ['habits', principalText];
}

export function useHabits() {
  const { actor, isFetching: isActorFetching, error: actorError, isError: isActorError, retry: retryActor } = useActorWithTimeout();
  const { identity } = useInternetIdentity();

  const isAuthenticated = !!identity;
  const principalText = identity?.getPrincipal().toString() || null;

  const query = useQuery<HabitWithCompletion[]>({
    queryKey: getHabitsQueryKey(principalText),
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const habits = await actor.getHabits();
      return habits.map(buildCompletionMap);
    },
    enabled: !!actor && !isActorFetching && isAuthenticated,
    retry: false,
  });

  // Expose actor error if it exists
  const error = isActorError ? actorError : query.error;
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
        throw new Error('You must be signed in to add habits');
      }
      if (!actor) throw new Error('Actor not initialized');
      await actor.addHabit(name, '', null);
    },
    onSuccess: () => {
      const principalText = identity?.getPrincipal().toString() || null;
      queryClient.invalidateQueries({ queryKey: getHabitsQueryKey(principalText) });
      toast.success('Habit added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add habit: ' + error.message);
    },
  });
}

export function useUpdateHabit() {
  const { actor } = useActorWithTimeout();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ habitId, name }: { habitId: bigint; name: string }) => {
      if (!identity) {
        throw new Error('You must be signed in to update habits');
      }
      if (!actor) throw new Error('Actor not initialized');
      await actor.updateHabit(habitId, name, '', null);
    },
    onSuccess: () => {
      const principalText = identity?.getPrincipal().toString() || null;
      queryClient.invalidateQueries({ queryKey: getHabitsQueryKey(principalText) });
      toast.success('Habit updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update habit: ' + error.message);
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
        throw new Error('You must be signed in to update completion');
      }
      if (!actor) throw new Error('Actor not initialized');
      await actor.toggleCompletion(habitId, BigInt(monthIndex), BigInt(day), completed);
    },
    onMutate: async ({ habitId, monthIndex, day, completed }) => {
      const principalText = identity?.getPrincipal().toString() || null;
      const queryKey = getHabitsQueryKey(principalText);
      
      await queryClient.cancelQueries({ queryKey });
      
      const previousHabits = queryClient.getQueryData<HabitWithCompletion[]>(queryKey);
      
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
    onError: (error, variables, context) => {
      if (context?.previousHabits && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousHabits);
      }
      toast.error('Failed to update completion: ' + error.message);
    },
    onSettled: (data, error, variables, context) => {
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
    mutationFn: async ({ habitId, unitType }: { habitId: bigint; unitType: string }) => {
      if (!identity) {
        throw new Error('You must be signed in to update unit type');
      }
      if (!actor) throw new Error('Actor not initialized');
      await actor.updateHabitUnitType(habitId, unitType);
    },
    onMutate: async ({ habitId, unitType }) => {
      const principalText = identity?.getPrincipal().toString() || null;
      const queryKey = getHabitsQueryKey(principalText);
      
      await queryClient.cancelQueries({ queryKey });
      
      const previousHabits = queryClient.getQueryData<HabitWithCompletion[]>(queryKey);
      
      const defaultEntry: TimeVolumeEntry = { timeString: undefined, minutes: BigInt(0) };
      
      queryClient.setQueryData<HabitWithCompletion[]>(queryKey, (old) => {
        if (!old) return old;
        return old.map((habit) => {
          if (habit.id === habitId) {
            return {
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
          }
          return habit;
        });
      });
      
      return { previousHabits, queryKey };
    },
    onError: (error, variables, context) => {
      if (context?.previousHabits && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousHabits);
      }
      toast.error('Failed to update unit type: ' + error.message);
    },
    onSettled: () => {
      const principalText = identity?.getPrincipal().toString() || null;
      queryClient.invalidateQueries({ queryKey: getHabitsQueryKey(principalText) });
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
        throw new Error('You must be signed in to update volume');
      }
      if (!actor) throw new Error('Actor not initialized');
      
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
      
      const previousHabits = queryClient.getQueryData<HabitWithCompletion[]>(queryKey);
      
      queryClient.setQueryData<HabitWithCompletion[]>(queryKey, (old) => {
        if (!old) return old;
        return old.map((habit) => {
          if (habit.id === habitId) {
            // Apply the same compounding rules as the backend
            const compoundedVolumeTracking = computeCompoundedVolumeTracking(
              habit.volumeTracking,
              monthIndex,
              minutes,
              timeString
            );
            
            return {
              ...habit,
              volumeTracking: compoundedVolumeTracking,
            };
          }
          return habit;
        });
      });
      
      return { previousHabits, queryKey };
    },
    onError: (error, variables, context) => {
      if (context?.previousHabits && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousHabits);
      }
      toast.error('Failed to update volume: ' + error.message);
    },
    onSettled: () => {
      const principalText = identity?.getPrincipal().toString() || null;
      queryClient.invalidateQueries({ queryKey: getHabitsQueryKey(principalText) });
    },
  });
}
