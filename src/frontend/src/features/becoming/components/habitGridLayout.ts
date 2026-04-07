/**
 * Shared layout constants for the habit grid to ensure perfect alignment
 * between header day numbers and checkbox columns.
 */

// Width of the first column (habit info)
export const HABIT_INFO_WIDTH = "w-48";

// Width of each day column (must match for header and checkboxes)
export const DAY_COLUMN_WIDTH = "w-10";

// Padding for day cells to center content
export const DAY_CELL_PADDING = "px-2";

/**
 * Builds the grid template columns string for CSS grid layout
 * @param daysInMonth - Number of days in the selected month
 * @returns CSS grid-template-columns value
 */
export function buildGridColumns(daysInMonth: number): string {
  // First column is fixed width for habit info, rest are day columns
  const dayColumns = Array(daysInMonth).fill("2.5rem").join(" ");
  return `12rem ${dayColumns}`;
}

/**
 * Returns the class string for a day column cell (header or checkbox)
 */
export function getDayColumnClasses(): string {
  return `${DAY_COLUMN_WIDTH} flex-shrink-0 flex items-center justify-center ${DAY_CELL_PADDING}`;
}
