import { startOfYear, endOfYear, startOfQuarter, endOfQuarter, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addYears, addQuarters, addMonths, addWeeks, format } from 'date-fns';

export function calculatePeriodForDate(date: Date, frequency: string): string {
  const year = date.getFullYear();
  
  switch (frequency.toLowerCase()) {
    case 'annual':
      return year.toString();
    
    case 'quarterly': {
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      return `${year}-Q${quarter}`;
    }
    
    case 'monthly': {
      const month = date.getMonth() + 1;
      return `${year}-${month.toString().padStart(2, '0')}`;
    }
    
    case 'weekly': {
      const weekNumber = getWeekNumber(date);
      return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
    }
    
    default:
      return year.toString();
  }
}

export function getEndOfPeriod(date: Date, frequency: string): Date {
  switch (frequency.toLowerCase()) {
    case 'annual':
      return endOfYear(date);
    
    case 'quarterly':
      return endOfQuarter(date);
    
    case 'monthly':
      return endOfMonth(date);
    
    case 'weekly':
      return endOfWeek(date, { weekStartsOn: 1 });
    
    default:
      return endOfYear(date);
  }
}

export function getStartOfPeriod(date: Date, frequency: string): Date {
  switch (frequency.toLowerCase()) {
    case 'annual':
      return startOfYear(date);
    
    case 'quarterly':
      return startOfQuarter(date);
    
    case 'monthly':
      return startOfMonth(date);
    
    case 'weekly':
      return startOfWeek(date, { weekStartsOn: 1 });
    
    default:
      return startOfYear(date);
  }
}

export function isDateOverdue(currentDate: Date, period: string, frequency: string): boolean {
  const currentPeriod = calculatePeriodForDate(currentDate, frequency);
  return period < currentPeriod;
}

export function getPresetDate(preset: string, currentDate: Date, frequency: string): Date {
  switch (preset) {
    case 'endOfPeriod':
      return getEndOfPeriod(currentDate, frequency);
    
    case 'startOfNextPeriod': {
      const endOfCurrent = getEndOfPeriod(currentDate, frequency);
      switch (frequency.toLowerCase()) {
        case 'annual':
          return addYears(endOfCurrent, 1);
        case 'quarterly':
          return addQuarters(endOfCurrent, 1);
        case 'monthly':
          return addMonths(endOfCurrent, 1);
        case 'weekly':
          return addWeeks(endOfCurrent, 1);
        default:
          return addYears(endOfCurrent, 1);
      }
    }
    
    case '1YearAgo':
      return addYears(currentDate, -1);
    
    case '5YearsAgo':
      return addYears(currentDate, -5);
    
    case 'now':
      return new Date();
    
    default:
      return currentDate;
  }
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export function formatTestDate(date: Date): string {
  return format(date, 'PPpp');
}
