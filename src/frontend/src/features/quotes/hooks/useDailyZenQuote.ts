import { useQuery } from '@tanstack/react-query';
import { useActorWithTimeout } from '../../../hooks/useActorWithTimeout';
import { useInternetIdentity } from '../../../hooks/useInternetIdentity';
import type { TimeZone } from '../../../backend';

interface QuoteState {
  quote: { text: string; author: string } | null;
  isLoading: boolean;
  error: Error | null;
  isError: boolean;
  needsTimeZone: boolean;
  refetch: () => void;
}

function parseQuoteString(quoteString: string): { text: string; author: string } {
  // Expected format: "Quote text - Author Name"
  const lastDashIndex = quoteString.lastIndexOf(' - ');
  if (lastDashIndex === -1) {
    return { text: quoteString, author: 'Unknown' };
  }
  
  const text = quoteString.substring(0, lastDashIndex).trim();
  const author = quoteString.substring(lastDashIndex + 3).trim();
  
  return { text, author };
}

export function useDailyZenQuote(): QuoteState {
  const { actor, isFetching: isActorFetching } = useActorWithTimeout();
  const { identity } = useInternetIdentity();

  const isAuthenticated = !!identity;

  // Query for user's timezone
  const timeZoneQuery = useQuery<TimeZone | null>({
    queryKey: ['userTimeZone', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerTimeZone();
    },
    enabled: !!actor && !isActorFetching && isAuthenticated,
    retry: false,
  });

  // Query for today's quote (only if timezone is set)
  const quoteQuery = useQuery<string>({
    queryKey: ['todaysQuote', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getTodaysQuote();
    },
    enabled: !!actor && !isActorFetching && isAuthenticated && timeZoneQuery.data !== null,
    retry: false,
  });

  const needsTimeZone = isAuthenticated && !timeZoneQuery.isLoading && timeZoneQuery.data === null;
  const isLoading = isActorFetching || timeZoneQuery.isLoading || (quoteQuery.isLoading && !needsTimeZone);
  const error = timeZoneQuery.error || quoteQuery.error || null;
  const isError = timeZoneQuery.isError || quoteQuery.isError;

  const quote = quoteQuery.data ? parseQuoteString(quoteQuery.data) : null;

  const refetch = () => {
    timeZoneQuery.refetch();
    if (!needsTimeZone) {
      quoteQuery.refetch();
    }
  };

  return {
    quote,
    isLoading,
    error: error as Error | null,
    isError,
    needsTimeZone,
    refetch,
  };
}
