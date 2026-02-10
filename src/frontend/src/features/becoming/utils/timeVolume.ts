/**
 * Utilities for handling time volumes in M:SS or M format
 */

/**
 * Validates a time string in M:SS or M format
 * @param timeString - The time string to validate (e.g., "1:15" or "45")
 * @returns true if valid, false otherwise
 */
export function isValidTimeString(timeString: string): boolean {
  const trimmed = timeString.trim();
  if (!trimmed) return false;
  
  const parts = trimmed.split(':');
  
  // Case 1: M:SS format (e.g., "1:15")
  if (parts.length === 2) {
    const [minutesStr, secondsStr] = parts;
    
    // Check if both parts are numeric
    if (!/^\d+$/.test(minutesStr) || !/^\d{1,2}$/.test(secondsStr)) return false;
    
    const minutes = parseInt(minutesStr, 10);
    const seconds = parseInt(secondsStr, 10);
    
    // Validate ranges
    if (isNaN(minutes) || isNaN(seconds)) return false;
    if (minutes < 0 || seconds < 0 || seconds >= 60) return false;
    
    return true;
  }
  
  // Case 2: M format (e.g., "45")
  if (parts.length === 1) {
    if (!/^\d+$/.test(trimmed)) return false;
    
    const minutes = parseInt(trimmed, 10);
    if (isNaN(minutes) || minutes < 0) return false;
    
    return true;
  }
  
  return false;
}

/**
 * Parses a time string in M:SS or M format to total minutes
 * @param timeString - The time string to parse (e.g., "1:15" or "45")
 * @returns Total minutes, or null if invalid
 */
export function parseTimeStringToMinutes(timeString: string): number | null {
  if (!isValidTimeString(timeString)) return null;
  
  const trimmed = timeString.trim();
  const parts = trimmed.split(':');
  
  if (parts.length === 2) {
    // M:SS format
    const [minutesStr, secondsStr] = parts;
    const minutes = parseInt(minutesStr, 10);
    const seconds = parseInt(secondsStr, 10);
    
    return minutes + Math.floor(seconds / 60);
  } else {
    // M format - treat as minutes
    return parseInt(trimmed, 10);
  }
}

/**
 * Parses a time string in M:SS or M format to total seconds
 * @param timeString - The time string to parse (e.g., "1:15" or "45")
 * @returns Total seconds, or null if invalid
 */
export function parseTimeStringToSeconds(timeString: string): number | null {
  if (!isValidTimeString(timeString)) return null;
  
  const trimmed = timeString.trim();
  const parts = trimmed.split(':');
  
  if (parts.length === 2) {
    // M:SS format
    const [minutesStr, secondsStr] = parts;
    const minutes = parseInt(minutesStr, 10);
    const seconds = parseInt(secondsStr, 10);
    
    return minutes * 60 + seconds;
  } else {
    // M format - treat as minutes
    const minutes = parseInt(trimmed, 10);
    return minutes * 60;
  }
}

/**
 * Formats total seconds to M:SS string
 * @param totalSeconds - Total seconds
 * @returns Formatted time string (e.g., "5:00" or "1:15")
 */
export function formatSecondsToTimeString(totalSeconds: number): string {
  if (totalSeconds < 0) totalSeconds = 0;
  
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const secsStr = secs.toString().padStart(2, '0');
  
  return `${mins}:${secsStr}`;
}

/**
 * Formats minutes to M:SS string
 * @param minutes - Total minutes
 * @returns Formatted time string (e.g., "45:00")
 */
export function formatMinutesToTimeString(minutes: number): string {
  if (minutes < 0) minutes = 0;
  
  const mins = Math.floor(minutes);
  
  // Always format as M:SS
  return `${mins}:00`;
}

/**
 * Normalizes a time input string to M:SS format
 * @param timeString - The time string to normalize (e.g., "45" or "1:15")
 * @returns Normalized M:SS string (e.g., "45:00" or "1:15")
 */
export function normalizeTimeString(timeString: string): string {
  const trimmed = timeString.trim();
  const parts = trimmed.split(':');
  
  if (parts.length === 2) {
    // Already in M:SS format, just ensure two-digit seconds
    const [minutesStr, secondsStr] = parts;
    const minutes = parseInt(minutesStr, 10);
    const seconds = parseInt(secondsStr, 10);
    const secondsStr2 = seconds.toString().padStart(2, '0');
    return `${minutes}:${secondsStr2}`;
  } else {
    // M format - convert to M:SS
    const minutes = parseInt(trimmed, 10);
    return `${minutes}:00`;
  }
}

/**
 * Gets a user-friendly error message for invalid time input
 */
export function getTimeValidationError(timeString: string): string {
  const trimmed = timeString.trim();
  
  if (!trimmed) {
    return 'Please enter a time as minutes (e.g., 45) or minutes:seconds (e.g., 1:15)';
  }
  
  const parts = trimmed.split(':');
  
  if (parts.length === 2) {
    const [minutesStr, secondsStr] = parts;
    
    if (!/^\d+$/.test(minutesStr)) {
      return 'Minutes must be a number';
    }
    
    if (!/^\d{1,2}$/.test(secondsStr)) {
      return 'Seconds must be 1-2 digits';
    }
    
    const seconds = parseInt(secondsStr, 10);
    if (seconds >= 60) {
      return 'Seconds must be less than 60';
    }
  } else if (parts.length === 1) {
    if (!/^\d+$/.test(trimmed)) {
      return 'Please enter a valid number for minutes';
    }
  } else {
    return 'Invalid format. Use minutes (e.g., 45) or minutes:seconds (e.g., 1:15)';
  }
  
  return 'Invalid time format. Use minutes (e.g., 45) or minutes:seconds (e.g., 1:15)';
}

/**
 * Sanitizes time input to allow only digits and at most one colon
 * @param value - The input value to sanitize
 * @returns Sanitized string containing only digits and at most one colon
 */
export function sanitizeTimeInput(value: string): string {
  // Remove all characters except digits and colons
  let sanitized = value.replace(/[^\d:]/g, '');
  
  // Ensure at most one colon
  const colonIndex = sanitized.indexOf(':');
  if (colonIndex !== -1) {
    // Keep first colon, remove any additional colons
    const beforeColon = sanitized.substring(0, colonIndex + 1);
    const afterColon = sanitized.substring(colonIndex + 1).replace(/:/g, '');
    sanitized = beforeColon + afterColon;
  }
  
  return sanitized;
}

/**
 * Handles paste events for time input fields, sanitizing the pasted content
 * @param pastedText - The text being pasted
 * @returns Sanitized text safe for time input
 */
export function sanitizePastedTimeInput(pastedText: string): string {
  return sanitizeTimeInput(pastedText);
}
