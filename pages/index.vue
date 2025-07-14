<template>
  <div class="space-y-8">
    <div class="text-center">
      <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        🇯🇵 When Will I Get Japanese PR?
      </h1>
      <p class="text-lg text-gray-600 dark:text-gray-300">
        A machine learning prediction tool for Japanese Permanent Residency
      </p>
    </div>

    <!-- Data Loading Status -->
    <UCard v-if="dataLoading || dataError" class="max-w-2xl mx-auto">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-document-text" class="w-5 h-5" />
          <h2 class="text-xl font-semibold">Data Status</h2>
        </div>
      </template>
      
      <div class="text-center">
        <div v-if="dataLoading" class="space-y-2">
          <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin mx-auto text-blue-500" />
          <p class="text-gray-600 dark:text-gray-300">Loading PR data...</p>
        </div>
        <div v-else-if="dataError" class="space-y-2">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-8 h-8 mx-auto text-red-500" />
          <p class="text-red-600 dark:text-red-400">{{ dataError }}</p>
          <UButton @click="fetchPRData" size="sm" color="blue">Retry</UButton>
        </div>
      </div>
    </UCard>

    <!-- PR Data Display -->
    <UCard v-if="prData && !dataLoading" class="max-w-2xl mx-auto">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-chart-bar" class="w-5 h-5" />
          <h2 class="text-xl font-semibold">PR Statistics</h2>
        </div>
      </template>
      
      <div class="space-y-4">
        <div class="text-sm text-gray-600 dark:text-gray-300">
          <p>Last updated: {{ prData["updatedAt"] }}</p>
          <!-- <p>Data loaded successfully! {{ prData.data.length }} bytes available.</p> -->
        </div>
        <UButton @click="showDataDetails = !showDataDetails" size="sm" color="gray">
          {{ showDataDetails ? 'Hide' : 'Show' }} Data Details
        </UButton>
        
        <div v-if="showDataDetails" class="mt-4">
          <pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-xs overflow-auto max-h-64">{{ JSON.stringify(prData, null, 2) }}</pre>
        </div>
      </div>
    </UCard>

    <UCard class="max-w-2xl mx-auto">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-cpu-chip" class="w-5 h-5" />
          <h2 class="text-xl font-semibold">PR Prediction</h2>
        </div>
      </template>

      <div class="space-y-4">
        <UFormGroup label="Applied Year (YYYY)" name="appliedYear">
          <USelect
            v-model="form.appliedYear"
            :options="yearOptions"
            placeholder="Select year"
          />
        </UFormGroup>
        <UFormGroup label="Applied Month (MM)" name="appliedMonth">
          <div class="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-center">
            <UButton
              v-for="month in monthOptions"
              :key="month.value"
              :variant="form.appliedMonth === month.value ? 'solid' : 'outline'"
              color="blue"
              size="sm"
              @click="form.appliedMonth = month.value"
              class="text-center flex items-center justify-center"
            >
              {{ month.label }}
            </UButton>
          </div>
        </UFormGroup>
        <UButton
          @click="predictPR"
          :loading="loading"
          color="blue"
          size="lg"
          class="w-full"
        >
          Predict PR Timeline
        </UButton>
      </div>

      <template #footer v-if="prediction">
        <div class="text-center">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Estimated time to PR:
          </p>
          <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {{ prediction }}
          </p>
        </div>
      </template>
    </UCard>
  </div>
</template>

<script setup lang="ts">
interface FormData {
  appliedYear: number | undefined
  appliedMonth: string | undefined
}

interface PRData {
  updatedAt: string
  data: {
    [key: string]: any
  }
}

const form = ref<FormData>({
  appliedYear: undefined,
  appliedMonth: undefined
})

const loading = ref(false)
const prediction = ref<string | null>(null)
const prData = ref<PRData | null>(null)
const dataLoading = ref(true)
const dataError = ref<string | null>(null)
const showDataDetails = ref(false)

// Fetch PR data from GitHub
const fetchPRData = async () => {
  try {
    dataLoading.value = true
    dataError.value = null
    
    const response = await $fetch('https://raw.githubusercontent.com/vanngoh/estat-jp/main/json/pr.json')
    prData.value = response as PRData
    
    console.log('PR Data loaded:', prData.value)
  } catch (error) {
    console.error('Error fetching PR data:', error)
    dataError.value = 'Failed to load PR data. Please try again later.'
  } finally {
    dataLoading.value = false
  }
}

// Load data on component mount
onMounted(() => {
  // fetchPRData()
})

// Generate year options from 2020 to current year
const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let year = currentYear; year >= 2020; year--) {
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

const predictPR = () => {
  if (!form.value.appliedYear || !form.value.appliedMonth) {
    return
  }

  loading.value = true
  
  // Use the loaded PR data for prediction
  setTimeout(() => {
    if (prData.value) {
      // You can use the actual PR data here for more accurate predictions
      console.log('Using PR data for prediction:', prData.value)
    }
    // Example: Just echo the input for now
    prediction.value = `You applied in ${form.value.appliedYear}-${form.value.appliedMonth}`
    loading.value = false
  }, 2000)
}
</script> 