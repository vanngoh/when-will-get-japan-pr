<template>
  <div class="w-full">
    <div ref="chartContainer" class="w-full h-96"></div>
  </div>
</template>

<script setup lang="ts">
// @ts-ignore
import Plotly from 'plotly.js-dist-min'
import { getCategoryValue } from '~/utils/getCategoryValue'
import { getAverageMonthlyProcessed } from '~/utils/getAverageMonthlyProcessed'
import { getAverageMonthlyNewApplication } from '~/utils/getAverageMonthlyNewApplication'

interface PRData {
  updatedAt: string
  data: {
    [key: string]: any
  }
}

interface Props {
  prData: PRData | null
  appliedDate?: string
}

const props = defineProps<Props>()
const chartContainer = ref<HTMLElement>()

const { t, locale } = useI18n()
const isDark = useColorMode()

// Process data for visualization
const chartData = computed(() => {
  if (!props.prData?.data) return null

  const allDates = Object.keys(props.prData.data).sort()
  // Take only the last 15 data points
  const dates = allDates.slice(-15)
  const totalApplications: number[] = []
  const processedApplications: number[] = []
  const newApplications: number[] = []

  // Calculate data for each month
  dates.forEach((date) => {
    const monthData = props.prData!.data[date]
    
    // Total existing applications (100000)
    const total = getCategoryValue(monthData, "100000")
    totalApplications.push(total)
    
    // Processed applications (300000)
    const processed = getCategoryValue(monthData, "300000")
    processedApplications.push(processed)
    
    // New applications (103000)
    const newApps = getCategoryValue(monthData, "103000")
    newApplications.push(newApps)
  })

  // Format dates for display
  const formattedDates = dates.map(date => {
    const [year, month] = date.split('-')
    return `${year}-${month}`
  })

  return {
    dates: formattedDates,
    totalApplications,
    processedApplications,
    newApplications,
  }
})

// Create the chart
const createChart = () => {
  if (!chartData.value || !chartContainer.value) return

  const data = chartData.value
  
  // Create traces for different data series
  const traces = [
    {
      x: data.dates,
      y: data.totalApplications,
      type: 'scatter',
      mode: 'lines+markers',
      name: t('chart.totalApplications'),
      line: { color: '#3b82f6', width: 3 },
      marker: { size: 6 }
    },
    {
      x: data.dates,
      y: data.processedApplications,
      type: 'scatter',
      mode: 'lines+markers',
      name: t('chart.processedApplications'),
      line: { color: '#10b981', width: 3 },
      marker: { size: 6 }
    },
    {
      x: data.dates,
      y: data.newApplications,
      type: 'scatter',
      mode: 'lines+markers',
      name: t('chart.newApplications'),
      line: { color: '#f59e0b', width: 3 },
      marker: { size: 6 }
    }
  ]

  // Add prediction line if appliedDate is provided
  if (props.appliedDate && chartData.value.dates.includes(props.appliedDate)) {
    const appliedIndex = chartData.value.dates.indexOf(props.appliedDate)
    const appliedDate = chartData.value.dates[appliedIndex]
    
    // Add vertical line at applied date
    traces.push({
      x: [appliedDate, appliedDate],
      y: [0, Math.max(...data.totalApplications)],
      type: 'scatter',
      mode: 'lines',
      name: t('chart.appliedDate'),
      line: { color: '#8b5cf6', width: 2, dash: 'dash' },
      showlegend: true
    } as any)
  }

  const layout = {
    xaxis: {
      title: t('chart.month'),
      showgrid: false
    },
    yaxis: {
      title: t('chart.applications'),
      tickformat: ',',
      showgrid: false
    },
    hovermode: 'x unified',
    dragmode: false,
    showlegend: true,
    legend: {
      orientation: 'h',
      y: -0.2,
      font: {
        color: isDark.value === 'dark' ? '#ffffff' : '#000000'
      }
    },
    margin: { t: 60, b: 80, l: 60, r: 40 },
    plot_bgcolor: 'rgba(0,0,0,0)',
    paper_bgcolor: 'rgba(0,0,0,0)',
    font: {
      color: isDark.value === 'dark' ? '#ffffff' : '#374151'
    }
  }

  const config = {
    responsive: true,
    displayModeBar: false,
    displaylogo: false
  }

  Plotly.newPlot(chartContainer.value, traces, layout, config)
}

// Watch for data changes and recreate chart
watch([chartData, () => props.appliedDate, isDark, locale], () => {
  nextTick(() => {
    createChart()
  })
}, { deep: true })

// Create chart on mount
onMounted(() => {
  nextTick(() => {
    createChart()
  })
})

// Clean up on unmount
onUnmounted(() => {
  if (chartContainer.value) {
    Plotly.purge(chartContainer.value)
  }
})
</script>
