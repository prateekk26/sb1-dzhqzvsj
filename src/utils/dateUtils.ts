/**
 * Utility functions for date formatting and calculations
 */

/**
 * Format a date string to display format (e.g., "Jan 2022")
 */
export function formatDate(dateString: string | null): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', { 
    month: 'short', 
    year: 'numeric' 
  }).format(date);
}

/**
 * Format a date string with day included (e.g., "Jan 15, 2022")
 */
export function formatDateWithDay(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

/**
 * Calculate duration between two dates and format as "X yrs Y mos"
 */
export function getDuration(startDate: string, endDate: string | null): string {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  
  const startYear = start.getFullYear();
  const startMonth = start.getMonth();
  const endYear = end.getFullYear();
  const endMonth = end.getMonth();
  
  // Calculate total months between dates
  const yearDiff = endYear - startYear;
  const monthDiff = endMonth - startMonth;
  let totalMonths = yearDiff * 12 + monthDiff;
  
  // Handle edge case where totalMonths is negative
  if (totalMonths < 0) totalMonths = 0;
  
  const displayYears = Math.floor(totalMonths / 12);
  const displayMonths = totalMonths % 12;
  
  let result = '';
  if (displayYears > 0) {
    result += `${displayYears} yr${displayYears > 1 ? 's' : ''} `;
  }
  if (displayMonths > 0 || !result) {
    result += `${displayMonths} mo${displayMonths !== 1 ? 's' : ''}`;
  }
  
  return result.trim();
}