import { useInternetIdentity } from './useInternetIdentity';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { type backendInterface } from '../backend';
import { createActorWithConfig } from '../config';
import { getSecretParameter } from '../utils/urlParams';

const ACTOR_QUERY_KEY = 'actor-with-timeout';
const ACTOR_TIMEOUT_MS = 15000; // 15 seconds

export function useActorWithTimeout() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [retryTrigger, setRetryTrigger] = useState(0);

  const actorQuery = useQuery<backendInterface>({
    queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toString(), retryTrigger],
    queryFn: async () => {
      const isAuthenticated = !!identity;

      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Actor initialization timed out. Please check your connection and try again.'));
        }, ACTOR_TIMEOUT_MS);
      });

      // Create the actor initialization promise
      const actorPromise = (async () => {
        if (!isAuthenticated) {
          // Return anonymous actor if not authenticated
          return await createActorWithConfig();
        }

        const actorOptions = {
          agentOptions: {
            identity
          }
        };

        const actor = await createActorWithConfig(actorOptions);
        const adminToken = getSecretParameter('caffeineAdminToken') || '';
        await actor._initializeAccessControlWithSecret(adminToken);
        return actor;
      })();

      // Race between timeout and actor initialization
      return Promise.race([actorPromise, timeoutPromise]);
    },
    staleTime: Infinity,
    enabled: true,
    retry: false, // Don't auto-retry, let user trigger retry
  });

  // When the actor changes, invalidate dependent queries
  useEffect(() => {
    if (actorQuery.data) {
      queryClient.invalidateQueries({
        predicate: (query) => {
          return !query.queryKey.includes(ACTOR_QUERY_KEY);
        }
      });
      queryClient.refetchQueries({
        predicate: (query) => {
          return !query.queryKey.includes(ACTOR_QUERY_KEY);
        }
      });
    }
  }, [actorQuery.data, queryClient]);

  const retry = () => {
    setRetryTrigger(prev => prev + 1);
  };

  return {
    actor: actorQuery.data || null,
    isFetching: actorQuery.isFetching,
    error: actorQuery.error,
    isError: actorQuery.isError,
    retry,
  };
}
