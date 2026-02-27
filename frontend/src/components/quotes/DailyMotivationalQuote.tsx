import { useDailyZenQuote } from '@/features/quotes/hooks/useDailyZenQuote';
import { Quote } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function DailyMotivationalQuote() {
  const { quote, isLoading, error } = useDailyZenQuote();

  if (isLoading) {
    return (
      <div className="glass-surface rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Quote className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-32 mt-2" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="glass-surface rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Quote className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
          <p className="text-sm text-muted-foreground italic">
            Quote unavailable
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-surface rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <Quote className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
        <div className="flex-1">
          <p className="text-foreground leading-relaxed">
            "{quote.text}"
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            — {quote.author}
          </p>
        </div>
      </div>
    </div>
  );
}
