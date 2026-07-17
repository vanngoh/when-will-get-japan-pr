<template>
  <div class="w-full">
    <div ref="chartContainer" class="w-full h-[32rem]"></div>
  </div>
</template>

<script setup lang="ts">
// @ts-ignore
import Plotly from 'plotly.js-dist-min'
import { getCategoryValue } from '~/utils/getCategoryValue'
import { getEstimationTimeline } from '~/utils/getEstimation'

interface PRData {
  updatedAt: string
  data: Record<string, any>
}

interface Props {
  prData: PRData | null
  appliedDate?: string
  earliestDate?: string
  latestDate?: string
}

const props = defineProps<Props>()
const chartContainer = ref<HTMLElement>()
const { t, locale } = useI18n()
const colorMode = useColorMode()

const chartData = computed(() => {
  if (!props.prData?.data) return null

  const officialDates = Object.keys(props.prData.data).sort()
  const visibleOfficialDates = officialDates.slice(-36)
  const timeline = props.appliedDate
    ? getEstimationTimeline(props.prData, props.appliedDate)
    : []
  const timelineByDate = new Map(timeline.map(point => [point.date, point]))

  // Include the complete model path after application, including forecast months,
  // so every zero crossing can be compared with the notification window.
  const dates = [...new Set([
    ...visibleOfficialDates,
    ...timeline.map(point => point.date)
  ])].sort()

  return {
    dates,
    totalApplications: dates.map(date => {
      const monthData = props.prData!.data[date]
      return monthData ? getCategoryValue(monthData, '100000') : null
    }),
    processedApplications: dates.map(date => {
      const monthData = props.prData!.data[date]
      return monthData ? getCategoryValue(monthData, '300000') : null
    }),
    newApplications: dates.map(date => {
      const monthData = props.prData!.data[date]
      return monthData ? getCategoryValue(monthData, '103000') : null
    }),
    fifoRemaining: dates.map(date => timelineByDate.get(date)?.fifoRemaining ?? null),
    likelyRemaining: dates.map(date => timelineByDate.get(date)?.likelyRemaining ?? null),
    conservativeRemaining: dates.map(date => timelineByDate.get(date)?.conservativeRemaining ?? null)
  }
})

const createChart = () => {
  if (!chartData.value || !chartContainer.value) return

  const data = chartData.value
  const workloadValues = [
    ...data.totalApplications,
    ...data.fifoRemaining,
    ...data.likelyRemaining,
    ...data.conservativeRemaining
  ].filter((value): value is number => typeof value === 'number')
  const maxWorkload = Math.max(1, ...workloadValues)

  const traces: any[] = [
    {
      x: data.dates,
      y: data.totalApplications,
      type: 'bar',
      name: t('chart.totalApplications'),
      marker: { color: '#3b82f6', opacity: 0.45 },
      yaxis: 'y'
    },
    {
      x: data.dates,
      y: data.fifoRemaining,
      type: 'scatter',
      mode: 'lines',
      name: t('chart.fifoRemaining'),
      line: { color: '#94a3b8', width: 2, dash: 'dot' },
      yaxis: 'y',
      connectgaps: false
    },
    {
      x: data.dates,
      y: data.likelyRemaining,
      type: 'scatter',
      mode: 'lines',
      name: t('chart.likelyRemaining'),
      line: { color: '#ef4444', width: 3 },
      yaxis: 'y',
      connectgaps: false
    },
    {
      x: data.dates,
      y: data.conservativeRemaining,
      type: 'scatter',
      mode: 'lines',
      name: t('chart.conservativeRemaining'),
      line: { color: '#a855f7', width: 3, dash: 'dash' },
      yaxis: 'y',
      connectgaps: false
    },
    {
      x: data.dates,
      y: data.processedApplications,
      type: 'scatter',
      mode: 'lines+markers',
      name: t('chart.processedApplications'),
      line: { color: '#10b981', width: 2 },
      marker: { size: 5 },
      yaxis: 'y2'
    },
    {
      x: data.dates,
      y: data.newApplications,
      type: 'scatter',
      mode: 'lines+markers',
      name: t('chart.newApplications'),
      line: { color: '#f59e0b', width: 2 },
      marker: { size: 5 },
      yaxis: 'y2'
    }
  ]

  if (props.appliedDate && data.dates.includes(props.appliedDate)) {
    traces.push({
      x: [props.appliedDate, props.appliedDate],
      y: [0, maxWorkload],
      type: 'scatter',
      mode: 'lines',
      name: t('chart.appliedDate'),
      line: { color: '#7c3aed', width: 2, dash: 'dash' },
      hoverinfo: 'skip'
    })
  }

  const hasNotificationWindow =
    props.earliestDate && props.latestDate &&
    props.earliestDate !== 'N/A' && props.latestDate !== 'N/A'

  if (hasNotificationWindow) {
    traces.push({
      x: [
        props.earliestDate,
        props.earliestDate,
        null,
        props.latestDate,
        props.latestDate
      ],
      y: [0, maxWorkload, null, 0, maxWorkload],
      type: 'scatter',
      mode: 'lines',
      name: t('chart.notificationWindow'),
      line: { color: '#ec4899', width: 2, dash: 'dashdot' },
      hoverinfo: 'skip'
    })
  }

  const layout: any = {
    xaxis: {
      title: t('chart.month'),
      showgrid: false,
      type: 'date',
      tickformat: '%b %Y',
      hoverformat: '%b %Y'
    },
    yaxis: {
      title: t('chart.workload'),
      tickformat: ',',
      showgrid: false,
      side: 'left',
      rangemode: 'tozero'
    },
    yaxis2: {
      title: t('chart.monthlyVolume'),
      tickformat: ',',
      showgrid: false,
      side: 'right',
      overlaying: 'y',
      rangemode: 'tozero'
    },
    shapes: hasNotificationWindow
      ? [{
          type: 'rect',
          xref: 'x',
          yref: 'paper',
          x0: props.earliestDate,
          x1: props.latestDate,
          y0: 0,
          y1: 1,
          fillcolor: 'rgba(236, 72, 153, 0.10)',
          line: { width: 0 },
          layer: 'below'
        }]
      : [],
    hovermode: 'x unified',
    dragmode: false,
    showlegend: true,
    hoverlabel: {
      bgcolor: colorMode.value === 'dark' ? '#1f2937' : '#ffffff',
      bordercolor: colorMode.value === 'dark' ? '#374151' : '#e5e7eb',
      font: { color: colorMode.value === 'dark' ? '#ffffff' : '#374151' }
    },
    legend: {
      orientation: 'h',
      y: -0.22,
      font: { color: colorMode.value === 'dark' ? '#ffffff' : '#000000' }
    },
    margin: { t: 40, b: 120, l: 65, r: 55 },
    plot_bgcolor: 'rgba(0,0,0,0)',
    paper_bgcolor: 'rgba(0,0,0,0)',
    font: { color: colorMode.value === 'dark' ? '#ffffff' : '#374151' },
    barmode: 'overlay'
  }

  Plotly.react(chartContainer.value, traces, layout, {
    responsive: true,
    displayModeBar: false,
    displaylogo: false
  })
}

watch([
  chartData,
  () => props.appliedDate,
  () => props.earliestDate,
  () => props.latestDate,
  colorMode,
  locale
], () => nextTick(createChart), { deep: true })

onMounted(() => nextTick(createChart))

onUnmounted(() => {
  if (chartContainer.value) Plotly.purge(chartContainer.value)
})
</script>
