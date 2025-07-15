/**
 * Safely parse a value to integer, returning 0 if parsing fails
 * @param value - The value to parse (string or number)
 * @returns The parsed integer or 0 if parsing fails
 */
export const safeParseInt = (value: string | number): number => {
  const parsed = parseInt(String(value))
  return isNaN(parsed) ? 0 : parsed
} 