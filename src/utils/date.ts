/**
 * Date Utility Functions for CSE Compass
 * Ensures consistent local timezone handling without UTC date shifting.
 */

/**
 * Returns a 'YYYY-MM-DD' formatted string representing the local date.
 * Avoids .toISOString() which converts to UTC and shifts dates backwards in UTC+ timezones.
 */
export const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parses a 'YYYY-MM-DD' string into a local Date object set to local midnight.
 */
export const parseLocalDateString = (dateStr: string): Date | null => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day, 0, 0, 0, 0);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Adds offset days to a date string (YYYY-MM-DD) and returns the new date string.
 */
export const addDaysToLocalDate = (dateStr: string, days: number): string => {
  const base = parseLocalDateString(dateStr) || new Date();
  base.setDate(base.getDate() + days);
  return getLocalDateString(base);
};

/**
 * Checks if a given YYYY-MM-DD string is today in local time.
 */
export const isToday = (dateStr?: string): boolean => {
  if (!dateStr) return false;
  return dateStr === getLocalDateString();
};

/**
 * Checks if a given YYYY-MM-DD string is in the past compared to today in local time.
 */
export const isOverdue = (dateStr?: string, completed?: boolean): boolean => {
  if (!dateStr || completed) return false;
  return dateStr < getLocalDateString();
};

/**
 * Formats a YYYY-MM-DD string for user display (e.g. 'Oct 18, 2026').
 */
export const formatDisplayDate = (dateStr?: string, options?: Intl.DateTimeFormatOptions): string => {
  if (!dateStr) return 'No date';
  const date = parseLocalDateString(dateStr);
  if (!date) return dateStr;
  return date.toLocaleDateString(undefined, options || { month: 'short', day: 'numeric', year: 'numeric' });
};
