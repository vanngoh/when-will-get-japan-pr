import { getCategoryValue } from './getCategoryValue'
import { getAverageMonthlyProcessed } from './getAverageMonthlyProcessed'

interface EstimationResult {
  remaining: string
  earliest: string
  latest: string
  averageMonthlyProcessed: number
}

/**
 * Calculate estimation for permanent residency applications
 * @param prData - The PR data object containing monthly data
 * @param appliedDate - The date when the application was submitted (YYYY-MM format)
 * @returns Object containing remaining applications and earliest/latest prediction dates
 */
export const getEstimation = (prData: any, appliedDate: string): EstimationResult => {
  if (!prData?.data) {
    return {
      remaining: '0',
      earliest: 'N/A',
      latest: 'N/A',
      averageMonthlyProcessed: 0
    }
  }

  const averageMonthlyProcessed = getAverageMonthlyProcessed(prData)

  // Get all available dates sorted
  const availableDates = Object.keys(prData.data).sort()
  const latestAvailableDate = availableDates.length > 0 ? availableDates[availableDates.length - 1] : ''
  
  // Use the applied date if available, otherwise use the latest available date
  const effectiveDate = availableDates.includes(appliedDate) ? appliedDate : latestAvailableDate
  
  if (!effectiveDate) {
    return {
      remaining: '0',
      earliest: 'N/A',
      latest: 'N/A',
      averageMonthlyProcessed: 0
    }
  }

  // Step 1: Get the value of "100000" (total existing applications) for the effective date
  const monthData = prData.data[effectiveDate]
  let remaining = getCategoryValue(monthData, "100000")  // the value of "100000" (total existing applications)
  const newApplications = getCategoryValue(monthData, "103000")  // the value of "103000" (new applications)

  // Step 2: Minus the total processed of the following months if there are any
  const effectiveDateIndex = availableDates.indexOf(effectiveDate)
  const followingDates = availableDates.slice(effectiveDateIndex + 1)
  
  for (const date of followingDates) {
    const processedData = prData.data[date]
    const processed = getCategoryValue(processedData, "300000")
    remaining -= processed
  }

  // Step 3: If the latest date in available data is older than today's month, 
  // continuously minus the averageMonthlyProcessed for the months in between
  const today = new Date()
  const currentYearMonth = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`
  
  if (latestAvailableDate < currentYearMonth) {
    
    
    // Calculate months between latest available date and current month
    const latestDate = new Date(latestAvailableDate + '-01')
    const currentDate = new Date(currentYearMonth + '-01')
    
    let monthsDiff = (currentDate.getFullYear() - latestDate.getFullYear()) * 12 + 
                    (currentDate.getMonth() - latestDate.getMonth())
    
    // Subtract processed applications for the missing months
    remaining -= (averageMonthlyProcessed * monthsDiff)
  }

  // Ensure remaining is not negative
  remaining = Math.max(0, remaining)

  // Step 6: Estimate the earliest & latest year month (YYYY-MM) based on remaining applications and new applications
  if (averageMonthlyProcessed <= 0) {
    return {
      remaining: remaining.toLocaleString(),
      earliest: 'N/A',
      latest: 'N/A',
      averageMonthlyProcessed: 0
    }
  }

  // Calculate months needed to process the remaining applications
  const monthsToProcessRemaining = Math.ceil(remaining / averageMonthlyProcessed)
  
  // Calculate months needed to process the new applications (worst case scenario)
  const monthsToProcessNew = Math.ceil(newApplications / averageMonthlyProcessed)
  
  // Calculate earliest date: when remaining applications will be processed (from current date)
  const currentDate = new Date()
  const earliestDate = new Date(currentDate)
  earliestDate.setMonth(earliestDate.getMonth() + monthsToProcessRemaining)
  
  // Calculate latest date: add the time needed to process new applications + 1 month safety margin
  const latestDate = new Date(currentDate)
  latestDate.setMonth(latestDate.getMonth() + monthsToProcessRemaining + monthsToProcessNew + 1)

  const formatDate = (date: Date): string => {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
  }

  return {
    remaining: remaining.toLocaleString(),
    earliest: formatDate(earliestDate),
    latest: formatDate(latestDate),
    averageMonthlyProcessed: averageMonthlyProcessed
  }
} 