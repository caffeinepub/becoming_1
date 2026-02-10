import { AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { getUserFriendlyErrorMessage } from '../../../utils/icErrors';

interface ErrorBannerProps {
  error: Error;
  onRetry?: () => void;
}

export function ErrorBanner({ error, onRetry }: ErrorBannerProps) {
  const userFriendlyMessage = getUserFriendlyErrorMessage(error);
  
  return (
    <Alert variant="destructive" className="glass-surface">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Unable to Load Habits</AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p>{userFriendlyMessage}</p>
        {onRetry && (
          <div className="flex gap-2">
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
