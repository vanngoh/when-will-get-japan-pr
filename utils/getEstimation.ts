import { getCategoryValue } from './getCategoryValue'

interface EstimationResult {
  remaining: string
  earliest: string
  latest: string
  averageMonthlyProcessed: number
}

export interface EstimationTimelinePoint {
  date: string
  fifoRemaining: number
  likelyRemaining: number
  conservativeRemaining: number
  isForecast: boolean
}

interface ForecastScenario {
  throughputPercentile: number
  effectiveThroughputRatio: number
  notificationLagMonths: number
}

// Immigration statistics aggregate every completed case. They do not show whether
// cases are handled FIFO, so only part of a branch's throughput should be assumed
// to move a particular applicant's cohort forward.
const LIKELY_SCENARIO: ForecastScenario = {
  throughputPercentile: 0.35,
  effectiveThroughputRatio: 0.8,
  // The visible notification window starts when the likely workload reaches zero.
  notificationLagMonths: 0
}

const CONSERVATIVE_SCENARIO: ForecastScenario = {
  throughputPercentile: 0.25,
  effectiveThroughputRatio: 0.7,
  notificationLagMonths: 2
}

const RECENT_MONTHS = 18
const MAX_FORECAST_MONTHS = 120

const addMonths = (yearMonth: string, monthsToAdd: number): string => {
  const [year, month] = yearMonth.split('-').map(Number)
  const date = new Date(year, month - 1 + monthsToAdd, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

const getMonthDiff = (fromYearMonth: string, toYearMonth: string): number => {
  const [fromYear, fromMonth] = fromYearMonth.split('-').map(Number)
  const [toYear, toMonth] = toYearMonth.split('-').map(Number)
  return (toYear - fromYear) * 12 + toMonth - fromMonth
}

const quantile = (values: number[], percentile: number): number => {
  if (values.length === 0) return 0

  const sorted = [...values].sort((a, b) => a - b)
  const position = (sorted.length - 1) * percentile
  const lower = Math.floor(position)
  const upper = Math.ceil(position)
  const fraction = position - lower

  return sorted[lower] + (sorted[upper] - sorted[lower]) * fraction
}

const getRecentCategoryValues = (prData: any, category: string): number[] => {
  return Object.keys(prData.data)
    .sort()
    .slice(-RECENT_MONTHS)
    .map(date => getCategoryValue(prData.data[date], category))
    .filter(value => value > 0)
}

const getScenarioThroughput = (prData: any, scenario: ForecastScenario): number => {
  const processed = getRecentCategoryValues(prData, '300000')
  if (processed.length === 0) return 0

  // Percentiles are deliberately used instead of an optimistic arithmetic mean.
  // A recent slowdown therefore affects the estimate without one exceptional
  // high-output month pulling the notification date forward.
  const rawThroughput = quantile(processed, scenario.throughputPercentile)
  return Math.max(1, rawThroughput * scenario.effectiveThroughputRatio)
}

const getAverageRecentValue = (prData: any, category: string): number => {
  const values = getRecentCategoryValues(prData, category)
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

const getEndOfMonthBacklog = (monthData: any): number => {
  const totalAccepted = getCategoryValue(monthData, '100000')
  const processed = getCategoryValue(monthData, '300000')
  return Math.max(0, totalAccepted - processed)
}

const getApplicationMonthWorkload = (monthData: any): number => {
  // Use the end-of-month position. It is intentionally conservative because an
  // application date only identifies the month, not the day or its actual place
  // within that month's new applications.
  return getCategoryValue(monthData, '100000')
}

const getInitialWorkload = (
  prData: any,
  availableDates: string[],
  appliedDate: string
): number => {
  const latestDate = availableDates[availableDates.length - 1]
  if (appliedDate > latestDate) {
    return projectWorkloadToFutureApplication(prData, latestDate, appliedDate)
  }

  const closestApplicationDate = availableDates.filter(date => date <= appliedDate).pop()
  return getApplicationMonthWorkload(prData.data[closestApplicationDate ?? availableDates[0]])
}

const projectWorkloadToFutureApplication = (
  prData: any,
  latestDate: string,
  appliedDate: string
): number => {
  const latestData = prData.data[latestDate]
  let backlog = getEndOfMonthBacklog(latestData)
  const averageNewApplications = getAverageRecentValue(prData, '103000')
  const averageProcessed = getAverageRecentValue(prData, '300000')
  const monthsUntilApplication = getMonthDiff(latestDate, appliedDate)

  // Grow/shrink the branch backlog until the selected application month, then
  // place the applicant at the conservative end of that month's incoming cohort.
  for (let month = 1; month < monthsUntilApplication; month++) {
    backlog = Math.max(0, backlog + averageNewApplications - averageProcessed)
  }

  return Math.max(0, backlog + averageNewApplications)
}

const consumeKnownMonths = (
  prData: any,
  availableDates: string[],
  appliedDate: string,
  initialWorkload: number,
  effectiveThroughputRatio: number
): { remaining: number; clearedAt?: string } => {
  let remaining = initialWorkload

  for (const date of availableDates) {
    if (date <= appliedDate) continue
    remaining -= getCategoryValue(prData.data[date], '300000') * effectiveThroughputRatio
    if (remaining <= 0) return { remaining: 0, clearedAt: date }
  }

  return { remaining: Math.max(0, remaining) }
}

const forecastClearanceDate = (
  startDate: string,
  remaining: number,
  monthlyThroughput: number
): string => {
  if (remaining <= 0) return startDate
  if (monthlyThroughput <= 0) return 'N/A'

  const monthsNeeded = Math.min(MAX_FORECAST_MONTHS, Math.ceil(remaining / monthlyThroughput))
  return addMonths(startDate, monthsNeeded)
}

const estimateScenario = (
  prData: any,
  availableDates: string[],
  appliedDate: string,
  initialWorkload: number,
  scenario: ForecastScenario
): { remaining: number; notificationDate: string } => {
  const latestDate = availableDates[availableDates.length - 1]
  const known = consumeKnownMonths(
    prData,
    availableDates,
    appliedDate,
    initialWorkload,
    scenario.effectiveThroughputRatio
  )

  const forecastStart = appliedDate > latestDate ? appliedDate : latestDate
  const clearanceDate = known.clearedAt ?? forecastClearanceDate(
    forecastStart,
    known.remaining,
    getScenarioThroughput(prData, scenario)
  )

  return {
    remaining: known.remaining,
    notificationDate: clearanceDate === 'N/A'
      ? 'N/A'
      : addMonths(clearanceDate, scenario.notificationLagMonths)
  }
}

/**
 * Estimate a conservative notification window for a permanent-residency case.
 * The public data is branch-level aggregate data, so the result is a planning
 * range rather than an individual-case promise.
 */
export const getEstimation = (prData: any, appliedDate: string): EstimationResult => {
  const emptyResult: EstimationResult = {
    remaining: '0',
    earliest: 'N/A',
    latest: 'N/A',
    averageMonthlyProcessed: 0
  }

  if (!prData?.data || !appliedDate) return emptyResult

  const availableDates = Object.keys(prData.data).sort()
  if (availableDates.length === 0) return emptyResult

  const initialWorkload = getInitialWorkload(prData, availableDates, appliedDate)

  const likely = estimateScenario(
    prData,
    availableDates,
    appliedDate,
    initialWorkload,
    LIKELY_SCENARIO
  )
  const conservative = estimateScenario(
    prData,
    availableDates,
    appliedDate,
    initialWorkload,
    CONSERVATIVE_SCENARIO
  )

  return {
    remaining: Math.round(likely.remaining).toLocaleString(),
    earliest: likely.notificationDate,
    latest: conservative.notificationDate,
    averageMonthlyProcessed: Math.round(getScenarioThroughput(prData, LIKELY_SCENARIO))
  }
}

/**
 * Build the three queue paths displayed by the chart. Keeping this calculation
 * beside getEstimation prevents the visualization from silently using a more
 * optimistic model than the dates shown to the user.
 */
export const getEstimationTimeline = (
  prData: any,
  appliedDate: string
): EstimationTimelinePoint[] => {
  if (!prData?.data || !appliedDate) return []

  const availableDates = Object.keys(prData.data).sort()
  if (availableDates.length === 0) return []

  const latestAvailableDate = availableDates[availableDates.length - 1]
  const initialWorkload = getInitialWorkload(prData, availableDates, appliedDate)
  const estimation = getEstimation(prData, appliedDate)
  const timelineEnd = estimation.latest === 'N/A'
    ? latestAvailableDate
    : estimation.latest

  const averageProcessed = getAverageRecentValue(prData, '300000')
  const likelyForecastThroughput = getScenarioThroughput(prData, LIKELY_SCENARIO)
  const conservativeForecastThroughput = getScenarioThroughput(prData, CONSERVATIVE_SCENARIO)

  let fifoRemaining = initialWorkload
  let likelyRemaining = initialWorkload
  let conservativeRemaining = initialWorkload
  let cursor = appliedDate
  const timeline: EstimationTimelinePoint[] = []

  while (cursor <= timelineEnd && timeline.length <= MAX_FORECAST_MONTHS) {
    const isFirstMonth = cursor === appliedDate
    const monthData = prData.data[cursor]
    const isForecast = cursor > latestAvailableDate || !monthData

    if (!isFirstMonth) {
      const processed = isForecast
        ? averageProcessed
        : getCategoryValue(monthData, '300000')

      fifoRemaining = Math.max(0, fifoRemaining - processed)
      likelyRemaining = Math.max(
        0,
        likelyRemaining - (isForecast
          ? likelyForecastThroughput
          : processed * LIKELY_SCENARIO.effectiveThroughputRatio)
      )
      conservativeRemaining = Math.max(
        0,
        conservativeRemaining - (isForecast
          ? conservativeForecastThroughput
          : processed * CONSERVATIVE_SCENARIO.effectiveThroughputRatio)
      )
    }

    timeline.push({
      date: cursor,
      fifoRemaining: Math.round(fifoRemaining),
      likelyRemaining: Math.round(likelyRemaining),
      conservativeRemaining: Math.round(conservativeRemaining),
      isForecast
    })
    cursor = addMonths(cursor, 1)
  }

  return timeline
}
