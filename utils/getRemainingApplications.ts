import { getCategoryValue } from './getCategoryValue'

/**
 * Calculate remaining applications for a given applied date
 * @param prData - The PR data object containing monthly data
 * @param appliedDate - The date when the application was submitted (YYYY-MM format)
 * @returns The number of remaining applications
 */
export const getRemainingApplications = (prData: any, appliedDate: string): number => {
  if (!prData?.data || !appliedDate) return 0
  
  // Get the categories["100000"] value for the applied month
  const appliedMonthData = prData.data[appliedDate]
  if (!appliedMonthData) return 0
  
  const initialValue = getCategoryValue(appliedMonthData, "100000")
  
  // Get all available dates sorted
  const allDates = Object.keys(prData.data).sort()
  const appliedMonthIndex = allDates.indexOf(appliedDate)
  
  // If applied date is not found or is the latest, return initial value
  if (appliedMonthIndex === -1 || appliedMonthIndex === allDates.length - 1) {
    return initialValue
  }
  
  // Get all months after the applied month
  const followingMonths = allDates.slice(appliedMonthIndex + 1)
  
  // Sum up all categories["300000"] values from following months
  const totalProcessed = followingMonths.reduce((sum, month) => {
    const monthData = prData.data[month]
    return sum + getCategoryValue(monthData, "300000")
  }, 0)
  
  // Calculate remaining applications (ensure non-negative)
  return Math.max(0, initialValue - totalProcessed)
} 