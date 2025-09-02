import { getCategoryValue } from './getCategoryValue'

/**
 * Calculate the average monthly adjustment in total applications from the past 15 months
 * This accounts for the adjustment that occurs between months due to data corrections,
 * reporting delays, or other factors that cause discrepancies between expected and actual totals
 * @param prData - The PR data object containing monthly data
 * @returns The average monthly adjustment in total applications
 */
export const getAverageMonthlyAdjustment = (prData: any): number => {
  if (!prData?.data) return 0
  
  // Get all available dates sorted in ascending order (oldest first)
  const allDates = Object.keys(prData.data).sort()
  
  if (allDates.length < 2) return 0
  
  // Take the last 15 months (or all available if less than 15)
  const recentDates = allDates.slice(-15)
  
  let totalAdjustment = 0
  let adjustmentCount = 0
  
  // Calculate adjustment between consecutive months
  for (let i = 1; i < recentDates.length; i++) {
    const currentDate = recentDates[i]
    const previousDate = recentDates[i - 1]
    
    const currentTotal = getCategoryValue(prData.data[currentDate], "100000")
    const previousTotal = getCategoryValue(prData.data[previousDate], "100000")
    const currentNew = getCategoryValue(prData.data[currentDate], "103000")
    const currentProcessed = getCategoryValue(prData.data[currentDate], "300000")
    
    // Calculate expected total: previous total + new applications - processed applications
    const expectedTotal = previousTotal + currentNew - currentProcessed
    
    // The adjustment is the difference between actual and expected total
    const adjustment = currentTotal - expectedTotal
    
    totalAdjustment += adjustment
    adjustmentCount++
  }
  
  // Calculate average adjustment (avoid division by zero)
  return adjustmentCount > 0 ? Math.round(totalAdjustment / adjustmentCount) : 0
}
