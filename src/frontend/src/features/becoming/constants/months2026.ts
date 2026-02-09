export interface MonthInfo {
  name: string;
  shortName: string;
  days: number;
  monthIndex: number;
}

export const MONTHS_2026: MonthInfo[] = [
  { name: 'January', shortName: 'Jan', days: 31, monthIndex: 0 },
  { name: 'February', shortName: 'Feb', days: 28, monthIndex: 1 },
  { name: 'March', shortName: 'Mar', days: 31, monthIndex: 2 },
  { name: 'April', shortName: 'Apr', days: 30, monthIndex: 3 },
  { name: 'May', shortName: 'May', days: 31, monthIndex: 4 },
  { name: 'June', shortName: 'Jun', days: 30, monthIndex: 5 },
  { name: 'July', shortName: 'Jul', days: 31, monthIndex: 6 },
  { name: 'August', shortName: 'Aug', days: 31, monthIndex: 7 },
  { name: 'September', shortName: 'Sep', days: 30, monthIndex: 8 },
  { name: 'October', shortName: 'Oct', days: 31, monthIndex: 9 },
  { name: 'November', shortName: 'Nov', days: 30, monthIndex: 10 },
  { name: 'December', shortName: 'Dec', days: 31, monthIndex: 11 },
];

export function getMonthInfo(monthIndex: number): MonthInfo {
  return MONTHS_2026[monthIndex] || MONTHS_2026[0];
}

export function getDaysInMonth(monthIndex: number): number {
  return getMonthInfo(monthIndex).days;
}
