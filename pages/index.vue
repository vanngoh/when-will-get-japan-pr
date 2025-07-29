<template>
  <div class="my-8 space-y-8">
    <div class="text-center">
      <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        🇯🇵 Permanent Residency Prediction
      </h1>
      <p class="text-sm text-gray-600 dark:text-gray-300 mb-8">
        A tool which predicts when you can get Japanese Permanent Residency on your application date.
      </p>
    </div>

    <UCard class="max-w-2xl mx-auto">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-queue-list" class="w-5 h-5" />
          <h2 class="text-xl font-semibold">When do you apply for permanent residency?</h2>
        </div>
      </template>

      <div class="space-y-4">
        <USelect
          class="w-full flex items-center justify-center"
          v-model="appliedYear"
          :items="yearOptions"
          placeholder="Select year"
          color="info"
          highlight
        />

        <div class="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-center">
          <UButton
            v-for="month in monthOptions"
            :key="month.value"
            :variant="appliedMonth === month.value ? 'solid' : 'soft'"
            color="info"
            size="sm"
            @click="appliedMonth = month.value"
            class="text-center flex items-center justify-center py-2"
          >
            {{ month.label }}
          </UButton>
        </div>
          
        <UButton
          @click="predictPR"
          :loading="loading"
          variant="subtle"
          color="info"
          size="lg"
          class="w-full flex items-center justify-center"
        >
          Predict
        </UButton>
      </div>
    </UCard>

    <UCard v-if="predictionResult.earliestDate !== 'N/A'" class="max-w-2xl mx-auto">       
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-arrow-trending-up" class="w-5 h-5" />
            <h2 class="text-xl font-semibold">Prediction Result</h2>
          </div>
        </template> 
        <div class="space-y-4">
          <p v-if="prData" class="text-center text-sm text-gray-600 dark:text-gray-400">
            Data updated: {{ new Date(prData.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) }}
            <br>
            Latest available date from data: {{ new Date(latestAvailableDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) }}
          </p>
          <UCollapsible>
            <UButton size="sm" color="info" variant="ghost" class="w-full flex items-center justify-center">
              View Raw Data
            </UButton>
            <template #content>
              <div class="mt-4">
                <pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-xs overflow-auto max-h-64">
                  {{ JSON.stringify(prData, null, 2) }}
                </pre>
              </div>
            </template>
          </UCollapsible>
                  
          <p v-if="availableDates.includes(appliedDate)" class="text-center text-sm text-gray-600 dark:text-gray-400">
            If you applied in {{new Date(appliedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' } )}}, here's your prediction:
            <br>
            <span v-if="predictionResult.remainingCount === '0'" class="text-green-600 dark:text-green-400 font-semibold"> (Your application has likely been processed!)</span>
          </p>
          <div v-else>
            <UAlert
              color="warning"
              variant="soft"
              description="At this time, the official data for your specified date is not yet available. Using latest available data for estimation."
              icon="i-heroicons-exclamation-triangle"
            />
            <br>
            <p class="text-center text-sm text-gray-600 dark:text-gray-400">
              Using data from {{new Date(latestAvailableDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' } )}} for estimation:
            </p>
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div class="flex font-bold items-center justify-center text-blue-600 dark:text-blue-400 space-x-2 border-2 border-blue-600 dark:border-blue-400 rounded-lg p-4">
              <UIcon name="i-heroicons-users" class="size-6" /> 
              <div class="space-x-2">
                <span class="text-2xl">{{ predictionResult.remainingCount }}</span> 
                <span class="text-sm">in queue</span>
              </div>
            </div>
            <div class="flex font-bold items-center justify-center text-green-600 dark:text-green-400 space-x-2 border-2 border-green-600 dark:border-green-400 rounded-lg p-4">
              <UIcon name="i-heroicons-document-check" class="size-6" /> 
              <div class="space-x-2">
                <span class="text-2xl">{{ predictionResult.averageMonthlyProcessed.toLocaleString() }}</span> 
                <span class="text-sm">monthly solved</span>
              </div>
            </div>
            <div class="flex font-bold items-center justify-center text-rose-600 dark:text-rose-400 space-x-2 border-2 border-rose-600 dark:border-rose-400 rounded-lg p-4">
              <UIcon name="i-heroicons-inbox-arrow-down" class="size-6" /> 
              <div class="space-x-2">
                <span class="text-2xl">{{ predictionResult.averageMonthlyNewApplication.toLocaleString() }}</span> 
                <span class="text-sm">monthly new</span>
              </div>
            </div>
            <div class="flex font-bold items-center justify-center text-amber-600 dark:text-amber-400 space-x-2 border-2 border-amber-600 dark:border-amber-400 rounded-lg p-4">
              <UIcon name="i-heroicons-clock" class="size-6" /> 
              <div class="space-x-2">
                <span class="text-2xl">{{ predictionResult.earliestDate !== 'N/A' ? predictionResult.earliestDate : 'N/A' }}</span> 
                <span class="text-sm">earliest</span>
              </div>
            </div>
            <div class="flex font-bold items-center justify-center text-purple-600 dark:text-purple-400 space-x-2 border-2 border-purple-600 dark:border-purple-400 rounded-lg p-4">
              <UIcon name="i-heroicons-calendar" class="size-6" /> 
              <div class="space-x-2">
                <span class="text-2xl">{{ predictionResult.latestDate !== 'N/A' ? predictionResult.latestDate : 'N/A' }}</span> 
                <span class="text-sm">latest</span>
              </div>
            </div>
          </div>
        </div>
      </UCard>
  </div>
</template>

<script setup lang="ts">
interface PRData {
  updatedAt: string
  data: {
    [key: string]: any
  }
}

interface PredictionResult {
  earliestDate: string
  latestDate: string
  remainingCount: string
  averageMonthlyProcessed: number
  averageMonthlyNewApplication: number
  monthsToSolve: number
}

// Reactive state
const appliedYear = ref<number>(new Date().getFullYear())
const appliedMonth = ref<string>(formatDate(new Date()).split('-')[1])
const appliedDate = ref<string>(`${appliedYear.value}-${appliedMonth.value}`)

// Generate year options from 2021 to current year
const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let year = currentYear; year >= 2021; year--) {
    years.push({ label: year.toString(), value: year })
  }
  return years
})

// Generate month options with month names
const monthOptions = computed(() => {
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]
  const months = []
  for (let month = 1; month <= 12; month++) {
    months.push({ 
      label: monthNames[month - 1], 
      value: month.toString().padStart(2, '0')
    })
  }
  return months
})

const loading = ref(false)
const predictionResult = ref<PredictionResult>({
  earliestDate: 'N/A',
  latestDate: 'N/A',
  remainingCount: '0',
  averageMonthlyProcessed: 0,
  averageMonthlyNewApplication: 0,
  monthsToSolve: 0
})
const prData = ref<PRData | null>(null)
const dataLoading = ref(true)
const dataError = ref<string | null>(null)

// Computed properties for better performance
// const appliedDate = computed(() => `${appliedYear.value}-${appliedMonth.value}`)
const availableDates = computed(() => {
  if (!prData.value?.data) return []
  return Object.keys(prData.value.data).sort()
})
const latestAvailableDate = computed(() => {
  const dates = availableDates.value
  return dates.length > 0 ? dates[dates.length - 1] : ''
})

// Fetch PR data from GitHub
const fetchPRData = async () => {
  try {
    dataLoading.value = true
    dataError.value = null
    
    const response = await $fetch('https://raw.githubusercontent.com/vanngoh/estat-jp/main/json/pr.json')
    prData.value = JSON.parse(response as string) as PRData
  } catch (error) {
    console.error('Error fetching PR data:', error)
    dataError.value = 'Failed to load PR data. Please try again later.'
  } finally {
    dataLoading.value = false
  }
}


const predictPR = async () => {
  if (!appliedYear.value || !appliedMonth.value) {
    return
  }

  loading.value = true

  // Fetch PR data if not loaded
  if (!prData.value) {
    await fetchPRData()
  }
  
  // Use the loaded PR data for prediction
  if (prData.value) {
    appliedDate.value = `${appliedYear.value}-${appliedMonth.value}`

    // Get estimation using the new getEstimation function
    const estimation = getEstimation(prData.value, appliedDate.value)
    
    // Update prediction result with estimation data
    predictionResult.value.earliestDate = estimation.earliest
    predictionResult.value.latestDate = estimation.latest
    predictionResult.value.remainingCount = estimation.remaining
    predictionResult.value.averageMonthlyProcessed = estimation.averageMonthlyProcessed
    predictionResult.value.averageMonthlyNewApplication = getAverageMonthlyNewApplication(prData.value)
  }
  
  loading.value = false
}
</script> 