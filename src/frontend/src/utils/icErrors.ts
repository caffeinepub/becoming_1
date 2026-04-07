/**
 * Utilities for detecting and handling Internet Computer replica rejection errors,
 * particularly stopped-canister scenarios (IC0508 / reject_code 5).
 */

/**
 * Normalizes any thrown value into an Error object.
 */
export function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === "string") {
    return new Error(error);
  }
  if (error && typeof error === "object" && "message" in error) {
    return new Error(String(error.message));
  }
  return new Error("An unknown error occurred");
}

/**
 * Detects if an error is a stopped-canister replica rejection error.
 * Checks for IC0508 error code, reject_code 5, or message containing "canister ... is stopped".
 */
export function isStoppedCanisterError(error: unknown): boolean {
  const normalized = normalizeError(error);
  const message = normalized.message.toLowerCase();

  // Check for IC0508 error code
  if (message.includes("ic0508")) {
    return true;
  }

  // Check for reject_code 5
  if (
    message.includes("reject code: 5") ||
    message.includes("reject_code: 5")
  ) {
    return true;
  }

  // Check for "canister ... is stopped" message pattern
  if (message.includes("canister") && message.includes("is stopped")) {
    return true;
  }

  return false;
}

/**
 * Produces a user-friendly error message for stopped-canister scenarios.
 * Returns a safe message that omits raw CBOR/HTTP dumps.
 */
export function getStoppedCanisterMessage(): string {
  return "The backend is temporarily unavailable. The canister may be stopped or restarting. Please try again in a moment.";
}

/**
 * Gets a user-friendly error message for any error, with special handling for stopped-canister errors.
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (isStoppedCanisterError(error)) {
    return getStoppedCanisterMessage();
  }

  const normalized = normalizeError(error);
  return normalized.message;
}
