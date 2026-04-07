import { Badge } from "@/components/ui/badge";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";

export function AuthStateIndicator() {
  const { identity, isInitializing } = useInternetIdentity();

  if (isInitializing) {
    return null;
  }

  const isAuthenticated = !!identity;

  return (
    <Badge
      variant={isAuthenticated ? "default" : "outline"}
      className="text-xs"
    >
      {isAuthenticated ? "Signed in" : "Not signed in"}
    </Badge>
  );
}
