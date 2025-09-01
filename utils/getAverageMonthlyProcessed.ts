import { getCategoryValue } from './getCategoryValue'

/**
 * Calculate the average monthly processed applications from the past 15 months
 * @param prData - The PR data object containing monthly data
 * @returns The average number of processed applications per month
 */
export const getAverageMonthlyProcessed = (prData: any): number => {
  if (!prData?.data) return 0
  
  // Get all available dates sorted in descending order (latest first)
  const allDates = Object.keys(prData.data).sort().reverse()
  
  // Take the last 15 months (or all available if less than 15)
  const recentDates = allDates.slice(0, 15)
  
  // Sum up all categories["300000"] values (processed applications)
  const totalProcessed = recentDates.reduce((sum, date) => {
    const monthData = prData.data[date]
    return sum + getCategoryValue(monthData, "300000")
  }, 0)
  
  // Calculate average (avoid division by zero)
  const monthsCount = recentDates.length
  return monthsCount > 0 ? Math.round(totalProcessed / monthsCount) : 0
} 