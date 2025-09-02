import { getCategoryValue } from './getCategoryValue'
import { getAverageMonthlyProcessed } from './getAverageMonthlyProcessed'
import { getAverageMonthlyNewApplication } from './getAverageMonthlyNewApplication'
import { getAverageMonthlyAdjustment } from './getAverageMonthlyAdjustment'
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
  const averageMonthlyAdjustment = getAverageMonthlyAdjustment(prData)

  // Get all available dates sorted
  const availableDates = Object.keys(prData.data).sort()
  const latestAvailableDate = availableDates.length > 0 ? availableDates[availableDates.length - 1] : ''
  
  // Check if appliedDate is beyond latestAvailableDate
  const isAppliedDateBeyondData = appliedDate > latestAvailableDate
  
  // Start from the applied date if available in data, otherwise use the latest available date
  const startFromDate = availableDates.includes(appliedDate) ? appliedDate : latestAvailableDate
  
  // Step 1: Calculate the remaining based on the applied date
  const monthData = prData.data[startFromDate]
  let remaining = getCategoryValue(monthData, "100000")  // the value of "100000" (total existing applications)

  // If the applied date is beyond the latest available date, calculate the remaining based on 
  // the following formula until today:
  // remaining = averageMonthlyNewApplications - averageMonthlyProcessed + averageMonthlyAdjustment
  if (isAppliedDateBeyondData) {
    // Calculate month difference between latestAvailableDate and appliedDate
    const latestDate = new Date(latestAvailableDate + '-01')
    const appliedDateObj = new Date(appliedDate + '-01')
    const monthDiff = (appliedDateObj.getFullYear() - latestDate.getFullYear()) * 12 + 
                     (appliedDateObj.getMonth() - latestDate.getMonth())
    
    // Add estimated net change for the months beyond available data

    // Calculate net monthly change (new applications - processed applications + adjustment)
    const estimatedNetMonthlyChange = averageMonthlyNewApplication - averageMonthlyProcessed + averageMonthlyAdjustment
    const estimatedNetChange = estimatedNetMonthlyChange * monthDiff
    remaining += estimatedNetChange
  }

  // Step 2: Minus the total processed of the following months based on real data
  const startFromDateIndex = availableDates.indexOf(startFromDate)
  const followingDates = availableDates.slice(startFromDateIndex + 1) // return [] if the startFromDate is out of range
  
  for (const date of followingDates) {
    const processedData = prData.data[date]
    const processed = getCategoryValue(processedData, "300000")
    remaining -= processed
    // Add monthly adjustment to account for data corrections and reporting delays
    remaining += averageMonthlyAdjustment
    
    // Stop calculation if remaining <= 0 (application has been processed)
    // The date would be the earliest date of the application being processed
    if (remaining <= 0) {
      return {
        remaining: '0',
        earliest: date,
        latest: (() => {
          const [year, month] = date.split('-').map(Number);
          let newMonth = month + 2;
          let newYear = year;
          if (newMonth > 12) {
            newYear += Math.floor((newMonth - 1) / 12);
            newMonth = ((newMonth - 1) % 12) + 1;
          }
          return `${newYear}-${newMonth.toString().padStart(2, '0')}`;
        })(),
        averageMonthlyProcessed: 0
      }
    }
  }

  // Step 3: Start a while loop to calculate remaining applications month by month
  // until remaining <= 0, using average monthly processed and adjustment values
  let yearMonthCursor = latestAvailableDate
  let remainingCursor = remaining

  while (remainingCursor > 0) {
    // Increase ONE month based on the startFromDate in YYYY-MM format
    const [year, month] = yearMonthCursor.split('-').map(Number);
    let newMonth = month + 1;
    let newYear = year;
    if (newMonth > 12) {
      newYear += Math.floor((newMonth - 1) / 12);
      newMonth = ((newMonth - 1) % 12) + 1;
    }
    yearMonthCursor = `${newYear}-${newMonth.toString().padStart(2, '0')}`
    
    // Calculate the remaining by minus the averageMonthlyProcessed + averageMonthlyAdjustment
    remainingCursor -= (averageMonthlyProcessed + averageMonthlyAdjustment)
    
    // Break and return if remaining <= 0
    if (remainingCursor <= 0) {
      break;
    }
  }

  return {
    remaining: remaining.toLocaleString(),
    earliest: yearMonthCursor,
    latest: (() => {
      const [year, month] = yearMonthCursor.split('-').map(Number);
      let newMonth = month + 2;
      let newYear = year;
      if (newMonth > 12) {
        newYear += Math.floor((newMonth - 1) / 12);
        newMonth = ((newMonth - 1) % 12) + 1;
      }
      return `${newYear}-${newMonth.toString().padStart(2, '0')}`;
    })(),
    averageMonthlyProcessed: averageMonthlyProcessed
  }
} 