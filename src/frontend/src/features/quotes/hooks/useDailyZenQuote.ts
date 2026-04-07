import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { useActorWithTimeout } from "../../../hooks/useActorWithTimeout";
import { getMillisecondsUntilNext8amUK } from "../utils/ukQuoteRollover";

interface QuoteState {
  quote: { text: string; author: string } | null;
  isLoading: boolean;
  error: Error | null;
  isError: boolean;
  refetch: () => void;
}

function parseQuoteString(quoteString: string): {
  text: string;
  author: string;
} {
  // Expected format: "Quote text - Author Name"
  const lastDashIndex = quoteString.lastIndexOf(" - ");
  if (lastDashIndex === -1) {
    return { text: quoteString, author: "Unknown" };
  }

  const text = quoteString.substring(0, lastDashIndex).trim();
  const author = quoteString.substring(lastDashIndex + 3).trim();

  return { text, author };
}

export function useDailyZenQuote(): QuoteState {
  const { actor, isFetching: isActorFetching } = useActorWithTimeout();
  const { identity } = useInternetIdentity();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isAuthenticated = !!identity;
  const principalStr = identity?.getPrincipal().toString();

  // Query for today's quote (no timezone dependency)
  const quoteQuery = useQuery<string>({
    queryKey: ["todaysQuote", principalStr],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getTodaysQuote();
    },
    enabled: !!actor && !isActorFetching && isAuthenticated,
    retry: false,
  });

  const isLoading = isActorFetching || quoteQuery.isLoading;
  const error = quoteQuery.error || null;
  const isError = quoteQuery.isError;

  const quote = quoteQuery.data ? parseQuoteString(quoteQuery.data) : null;

  const refetch = useCallback(() => {
    quoteQuery.refetch();
  }, [quoteQuery]);

  // Schedule automatic refetch at next 8am UK time
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Only schedule if authenticated and quote has been fetched (or attempted)
    if (!isAuthenticated || isActorFetching) {
      return;
    }

    const scheduleNextRefetch = () => {
      const msUntilNext8am = getMillisecondsUntilNext8amUK();

      timerRef.current = setTimeout(() => {
        refetch();
        // Schedule the next refetch after this one completes
        scheduleNextRefetch();
      }, msUntilNext8am);
    };

    scheduleNextRefetch();

    // Cleanup on unmount or dependency change
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isAuthenticated, isActorFetching, refetch]);

  return {
    quote,
    isLoading,
    error: error as Error | null,
    isError,
    refetch,
  };
}
