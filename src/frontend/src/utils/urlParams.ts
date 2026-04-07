/**
 * Reads a named parameter from the current URL's query string.
 * Returns null if the parameter is not present or has no value.
 */
export function getSecretParameter(name: string): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}
