import { getCategoryValue } from './getCategoryValue'
import { getAverageMonthlyProcessed } from './getAverageMonthlyProcessed'
import { getAverageMonthlyNewApplication } from './getAverageMonthlyNewApplication'
import { formatDate } from './formatDate'

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
  const averageMonthlyNewApplication = getAverageMonthlyNewApplication(prData)

  // Get all available dates sorted
  const availableDates = Object.keys(prData.data).sort()
  const latestAvailableDate = availableDates.length > 0 ? availableDates[availableDates.length - 1] : ''
  
  // Check if appliedDate is beyond latestAvailableDate
  const isAppliedDateBeyondData = appliedDate > latestAvailableDate
  
  // Use the applied date if available in data, otherwise use the latest available date
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
  let newApplications = getCategoryValue(monthData, "103000")  // the value of "103000" (new applications)

  // Step 2: Minus the total processed of the following months if there are any
  const effectiveDateIndex = availableDates.indexOf(effectiveDate)
  const followingDates = availableDates.slice(effectiveDateIndex + 1)
  
  for (const date of followingDates) {
    const processedData = prData.data[date]
    const processed = getCategoryValue(processedData, "300000")
    remaining -= processed
  }

  // Step 3: If appliedDate is beyond latestAvailableDate, add estimated net increment
  if (isAppliedDateBeyondData) {
    // Calculate month difference between latestAvailableDate and appliedDate
    const latestDate = new Date(latestAvailableDate + '-01')
    const appliedDateObj = new Date(appliedDate + '-01')
    const monthDiff = (appliedDateObj.getFullYear() - latestDate.getFullYear()) * 12 + 
                     (appliedDateObj.getMonth() - latestDate.getMonth())
    
    // Calculate net monthly increment (new applications - processed applications)
    const averageMonthlyIncrement = averageMonthlyNewApplication - averageMonthlyProcessed
    
    // Add estimated net increment for the months beyond available data
    const estimatedNetIncrement = averageMonthlyIncrement * monthDiff
    remaining += estimatedNetIncrement
    
    // Update newApplications to use the estimated value for future calculations
    newApplications = averageMonthlyNewApplication * monthDiff
  }

  // Step 4: If the latest date in available data is older than today's month, 
  // continuously minus the averageMonthlyProcessed for the months in between
  const today = new Date()
  const currentYearMonth = formatDate(today)
  
  if (latestAvailableDate < currentYearMonth) {
    
    
    // Calculate months between latest available date and current month
    const latestDate = new Date(latestAvailableDate + '-01')
    const currentDateObj = new Date(currentYearMonth + '-01')
    const monthsDiff = (currentDateObj.getFullYear() - latestDate.getFullYear()) * 12 + 
                      (currentDateObj.getMonth() - latestDate.getMonth())
    remaining -= (averageMonthlyProcessed * monthsDiff)
  }

  // Step 5: Estimate the earliest & latest year month (YYYY-MM) based on remaining applications and new applications
  if (averageMonthlyProcessed <= 0) {
    return {
      remaining: remaining.toLocaleString(),
      earliest: 'N/A',
      latest: 'N/A',
      averageMonthlyProcessed: 0
    }
  }

  const currentDate = new Date()
  
  // Check if remaining applications is <= 0 (already processed or exactly processed)
  if (remaining <= 0) {
    const monthsProcessedAgo = Math.ceil(Math.abs(remaining) / averageMonthlyProcessed)
    const processedDate = new Date(currentDate)
    processedDate.setMonth(processedDate.getMonth() - monthsProcessedAgo)
    
    const monthsToProcessNew = Math.ceil(newApplications / averageMonthlyProcessed)
    const latestDate = new Date(processedDate)
    latestDate.setMonth(latestDate.getMonth() + monthsToProcessNew)
    
    return {
      remaining: '0',
      earliest: formatDate(processedDate),
      latest: formatDate(latestDate),
      averageMonthlyProcessed
    }
  }

  // Ensure remaining is not negative for future calculations
  remaining = Math.max(0, remaining)

  // Calculate months needed to process the remaining applications
  const monthsToProcessRemaining = Math.ceil(remaining / averageMonthlyProcessed)
  
  // Calculate months needed to process the new applications (worst case scenario)
  const monthsToProcessNew = Math.ceil(newApplications / averageMonthlyProcessed)
  
  // Calculate earliest date: when remaining applications will be processed (from current date)
  const earliestDate = new Date(currentDate)
  earliestDate.setMonth(earliestDate.getMonth() + monthsToProcessRemaining)
  
  // Calculate latest date: add the time needed to process new applications + 1 month safety margin
  const latestDate = new Date(currentDate)
  latestDate.setMonth(latestDate.getMonth() + monthsToProcessRemaining + monthsToProcessNew + 1)

  return {
    remaining: remaining.toLocaleString(),
    earliest: formatDate(earliestDate),
    latest: formatDate(latestDate),
    averageMonthlyProcessed
  }
} 