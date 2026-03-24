import { getCategoryValue } from './getCategoryValue'
import { getAverageMonthlyProcessed } from './getAverageMonthlyProcessed'
import { getAverageMonthlyNewApplication } from './getAverageMonthlyNewApplication'
import { getAverageMonthlyAdjustment } from './getAverageMonthlyAdjustment'

interface EstimationResult {
  remaining: string
  earliest: string
  latest: string
  averageMonthlyProcessed: number
}

const INACCURATE_DATA_RULE_START = '2024-04'
const EARLIEST_DELAY_MONTHS_AFTER_RULE_START = 3
const LATEST_OFFSET_MONTHS_FROM_EARLIEST = 2

const addMonths = (yearMonth: string, monthsToAdd: number): string => {
  const [year, month] = yearMonth.split('-').map(Number)
  const date = new Date(year, month - 1 + monthsToAdd, 1)
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
}

const getMonthDiff = (fromYearMonth: string, toYearMonth: string): number => {
  const [fromYear, fromMonth] = fromYearMonth.split('-').map(Number)
  const [toYear, toMonth] = toYearMonth.split('-').map(Number)
  return (toYear - fromYear) * 12 + (toMonth - fromMonth)
}

const getActualMonthlyAdjustment = (prData: any, previousDate: string, currentDate: string): number => {
  const previousMonthData = prData.data?.[previousDate]
  const currentMonthData = prData.data?.[currentDate]
  if (!previousMonthData || !currentMonthData) return 0

  const previousTotal = getCategoryValue(previousMonthData, '100000')
  const currentTotal = getCategoryValue(currentMonthData, '100000')
  const currentNew = getCategoryValue(currentMonthData, '103000')
  const currentProcessed = getCategoryValue(currentMonthData, '300000')

  // Adjustment = actual total - expected total
  const expectedTotal = previousTotal + currentNew - currentProcessed
  return currentTotal - expectedTotal
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

  if (!latestAvailableDate) {
    return {
      remaining: '0',
      earliest: 'N/A',
      latest: 'N/A',
      averageMonthlyProcessed: 0
    }
  }

  const isAppliedDateBeyondData = appliedDate > latestAvailableDate

  // Use exact month data if available, otherwise closest known month before appliedDate.
  const startFromDate =
    availableDates
      .filter((date) => date <= appliedDate)
      .pop() || availableDates[0]

  const monthData = prData.data[startFromDate]
  let remaining = getCategoryValue(monthData, '100000')

  // If appliedDate is after latest real data, estimate queue growth month-by-month.
  if (isAppliedDateBeyondData) {
    const monthDiff = getMonthDiff(latestAvailableDate, appliedDate)
    const estimatedNetMonthlyChange = averageMonthlyNewApplication - averageMonthlyProcessed + averageMonthlyAdjustment
    remaining += estimatedNetMonthlyChange * monthDiff
  }

  // Move from startFromDate to latest available date.
  // Real months use real processed + real adjustment, keeping simulation tied to records.
  const startFromDateIndex = availableDates.indexOf(startFromDate)
  const followingDates = availableDates.slice(startFromDateIndex + 1)

  let previousDate = startFromDate
  for (const date of followingDates) {
    const currentMonthData = prData.data[date]
    const processed = getCategoryValue(currentMonthData, '300000')
    const actualAdjustment = getActualMonthlyAdjustment(prData, previousDate, date)

    remaining -= processed
    remaining += actualAdjustment

    if (remaining <= 0) {
      const adjustedEarliest =
        appliedDate >= INACCURATE_DATA_RULE_START
          ? addMonths(date, EARLIEST_DELAY_MONTHS_AFTER_RULE_START)
          : date

      return {
        remaining: '0',
        earliest: adjustedEarliest,
        latest: addMonths(adjustedEarliest, LATEST_OFFSET_MONTHS_FROM_EARLIEST),
        averageMonthlyProcessed
      }
    }

    previousDate = date
  }

  // Forecast months beyond latest available date using averages.
  let yearMonthCursor = isAppliedDateBeyondData ? appliedDate : latestAvailableDate
  let remainingCursor = remaining
  let guard = 0
  const maxForecastMonths = 1200

  while (remainingCursor > 0 && guard < maxForecastMonths) {
    yearMonthCursor = addMonths(yearMonthCursor, 1)
    remainingCursor -= averageMonthlyProcessed
    remainingCursor += averageMonthlyAdjustment
    guard++
  }

  const rawEarliest = yearMonthCursor
  const earliest =
    appliedDate >= INACCURATE_DATA_RULE_START
      ? addMonths(rawEarliest, EARLIEST_DELAY_MONTHS_AFTER_RULE_START)
      : rawEarliest

  return {
    remaining: Math.max(0, Math.round(remaining)).toLocaleString(),
    earliest,
    latest: addMonths(earliest, LATEST_OFFSET_MONTHS_FROM_EARLIEST),
    averageMonthlyProcessed
  }
} 