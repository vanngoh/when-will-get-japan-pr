/**
 * Safely get a category value from month data
 * @param monthData - The month data object containing categories
 * @param category - The category key to retrieve (e.g., "100000", "300000")
 * @returns The parsed category value or 0 if not found
 */
export const getCategoryValue = (monthData: any, category: string): number => {
  return safeParseInt(monthData?.categories?.[category]?.value || 0)
} 