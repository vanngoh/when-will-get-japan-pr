/**
 * Format a Date object to YYYY-MM string format
 * @param date - The Date object to format
 * @returns Formatted date string in YYYY-MM format
 */
export const formatDate = (date: Date): string => {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
} 