import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { Badge } from '@/components/ui/badge';

export function AuthStateIndicator() {
  const { identity, isInitializing } = useInternetIdentity();

  if (isInitializing) {
    return null;
  }

  const isAuthenticated = !!identity;

  return (
    <Badge variant={isAuthenticated ? 'default' : 'outline'} className="text-xs">
      {isAuthenticated ? 'Signed in' : 'Not signed in'}
    </Badge>
  );
}
