import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ErrorBannerProps {
  error: Error;
}

export function ErrorBanner({ error }: ErrorBannerProps) {
  return (
    <Alert variant="destructive" className="glass-surface">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        Failed to load habits: {error.message}
      </AlertDescription>
    </Alert>
  );
}
