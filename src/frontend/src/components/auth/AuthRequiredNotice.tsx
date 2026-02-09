import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoginButton } from './LoginButton';
import { Info } from 'lucide-react';

export function AuthRequiredNotice() {
  return (
    <Alert className="max-w-2xl mx-auto glass-surface">
      <Info className="h-4 w-4 text-accent" />
      <AlertTitle>Sign in required</AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p>
          Please sign in with Internet Identity to view and save your habits. Your data will be
          securely stored and accessible across all your devices.
        </p>
        <div>
          <LoginButton />
        </div>
      </AlertDescription>
    </Alert>
  );
}
