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

    <UCard v-if="prediction" class="max-w-2xl mx-auto">       
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
            If you applied in {{new Date(appliedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long' } )}}, the remaining applications based on current processing status is approximately:
          </p>
          <div v-else>
            <UAlert
              color="warning"
              variant="soft"
              description="At this time, the official data for your specified date is not yet available."
              icon="i-heroicons-exclamation-triangle"
            />
            <br>
            <p class="text-center text-sm text-gray-600 dark:text-gray-400">
              If you applied in {{new Date(latestAvailableDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long' } )}}, the remaining applications based on current processing status is approximately:
            </p>
          </div>
          <p class="text-center text-2xl font-bold text-blue-600 dark:text-blue-400">
            <UIcon name="i-heroicons-users" class="size-4 mx-2" /> {{ remainingCount }}
          </p>  
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

// Reactive state
const appliedYear = ref<number>(new Date().getFullYear())
const appliedMonth = ref<string>((new Date().getMonth() + 1).toString().padStart(2, '0'))
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
const prediction = ref<string | null>(null)
const prData = ref<PRData | null>(null)
const remainingCount = ref<string>('0')
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
// const isDateAvailable = computed(() => {
//   return availableDates.value.includes(appliedDate.value)
// })

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
    // Check if the applied date is available in the data
    if (!availableDates.value.includes(appliedDate.value)) {
      prediction.value = `Latest data has not been updated yet.`
      const latestData = prData.value.data[latestAvailableDate.value]
      remainingCount.value = getCategoryValue(latestData, "100000").toLocaleString()
      loading.value = false
      return
    }
    
    const appliedMonthData = prData.value.data[appliedDate.value]
    const initialValue = getCategoryValue(appliedMonthData, "100000")
    
    // Get all months after the applied month
    const appliedMonthIndex = availableDates.value.indexOf(appliedDate.value)
    const followingMonths = availableDates.value.slice(appliedMonthIndex + 1)
    
    // Sum up all categories["300000"] values from following months
    const totalProcessed = followingMonths.reduce((sum, month) => {
      const monthData = prData.value!.data[month]
      return sum + getCategoryValue(monthData, "300000")
    }, 0)
    
    // Calculate remaining applications
    const remaining = Math.max(0, initialValue - totalProcessed)
    
    prediction.value = `If you applied in ${appliedDate.value}, approximately ${remaining.toLocaleString()} applications remain based on current processing status.`
    remainingCount.value = remaining.toLocaleString()
  }
  
  loading.value = false
}
</script> 