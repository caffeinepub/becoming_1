/**
 * Utility for computing milliseconds until the next 08:00 UK time (Europe/London).
 * Handles both GMT and BST automatically via Intl APIs.
 */

export function getMillisecondsUntilNext8amUK(): number {
  const now = new Date();
  
  // Get current time in UK timezone
  const ukTimeString = now.toLocaleString('en-GB', {
    timeZone: 'Europe/London',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  
  // Parse UK time string (format: "DD/MM/YYYY, HH:MM:SS")
  const [datePart, timePart] = ukTimeString.split(', ');
  const [day, month, year] = datePart.split('/').map(Number);
  const [hour, minute, second] = timePart.split(':').map(Number);
  
  // Create a date object representing current UK time
  const ukNow = new Date(year, month - 1, day, hour, minute, second);
  
  // Create target time (next 08:00 UK)
  let target8am = new Date(year, month - 1, day, 8, 0, 0, 0);
  
  // If we're already past 08:00 today, target tomorrow's 08:00
  if (ukNow >= target8am) {
    target8am = new Date(year, month - 1, day + 1, 8, 0, 0, 0);
  }
  
  // Convert target back to UTC to calculate difference
  const target8amString = target8am.toLocaleString('en-GB', {
    timeZone: 'Europe/London',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  
  // Calculate the difference in milliseconds
  const msUntilTarget = target8am.getTime() - ukNow.getTime();
  
  // Add a small buffer (5 seconds) to ensure we're past the rollover
  return Math.max(0, msUntilTarget + 5000);
}
