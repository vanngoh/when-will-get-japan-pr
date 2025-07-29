/**
 * Calculate the average monthly new applications from the past 15 months
 * @param prData - The PR data object containing monthly data
 * @returns The average number of new applications per month
 */
export const getAverageMonthlyNewApplication = (prData: any): number => {
  if (!prData?.data) return 0
  
  // Get all available dates sorted in descending order (latest first)
  const allDates = Object.keys(prData.data).sort().reverse()
  
  // Take the last 15 months (or all available if less than 15)
  const recentDates = allDates.slice(0, 15)
  
  // Sum up all categories["103000"] values (new applications)
  const totalNewApplications = recentDates.reduce((sum, date) => {
    const monthData = prData.data[date]
    return sum + getCategoryValue(monthData, "103000")
  }, 0)
  
  // Calculate average (avoid division by zero)
  const monthsCount = recentDates.length
  return monthsCount > 0 ? Math.round(totalNewApplications / monthsCount) : 0
} 