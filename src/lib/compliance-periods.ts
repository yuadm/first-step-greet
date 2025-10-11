/**
 * Shared compliance period utilities for consistent date handling
 * across employee and client compliance views
 */

/**
 * Calculate the end date for a given period identifier and frequency
 */
export function getPeriodEndDate(periodIdentifier: string, frequency: string): Date {
  switch (frequency.toLowerCase()) {
    case 'annual': {
      const year = parseInt(periodIdentifier);
      return new Date(year, 11, 31, 23, 59, 59, 999); // December 31st end of day
    }
    case 'monthly': {
      const [year, month] = periodIdentifier.split('-').map(Number);
      return new Date(year, month, 0, 23, 59, 59, 999); // Last day of the month
    }
    case 'quarterly': {
      const [year, quarterStr] = periodIdentifier.split('-');
      const quarter = parseInt(quarterStr.replace('Q', ''));
      const endMonth = quarter * 3; // Q1=3, Q2=6, Q3=9, Q4=12
      return new Date(parseInt(year), endMonth, 0, 23, 59, 59, 999);
    }
    case 'bi-annual': {
      const [year, halfStr] = periodIdentifier.split('-');
      const half = parseInt(halfStr.replace('H', ''));
      const endMonth = half === 1 ? 6 : 12;
      return new Date(parseInt(year), endMonth, 0, 23, 59, 59, 999);
    }
    case 'weekly': {
      const [year, weekStr] = periodIdentifier.split('-W');
      const week = parseInt(weekStr);
      const firstDayOfYear = new Date(parseInt(year), 0, 1);
      const daysToAdd = (week - 1) * 7 + 6; // Last day of the week
      return new Date(firstDayOfYear.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    }
    default:
      return new Date();
  }
}

/**
 * Check if a period is overdue based on current date
 */
export function isPeriodOverdue(
  periodIdentifier: string,
  frequency: string,
  currentDate: Date = new Date()
): boolean {
  const periodEnd = getPeriodEndDate(periodIdentifier, frequency);
  return currentDate > periodEnd;
}

/**
 * Parse a date string safely, handling timezone issues
 * Returns date at start of day in local timezone
 */
export function parseDateSafe(dateString: string): Date {
  // Extract date-only portion to avoid timezone issues
  const dateOnly = dateString.split('T')[0];
  const [year, month, day] = dateOnly.split('-').map(Number);
  return new Date(year, month - 1, day);
}
