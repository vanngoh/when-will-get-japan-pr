<template>
  <div class="my-8 space-y-8">
    <div class="text-center">
      <div class="flex items-center justify-between max-w-2xl px-4 mx-auto mb-4">
        <ThemeSwitcher />
        <LanguageSwitcher />
      </div>
      
      <h1 class="text-4xl font-bold text-gray-900 dark:text-white">
        {{ $t('title') }}
      </h1>
      <p class="text-sm text-gray-600 dark:text-gray-300 mb-8">
        {{ $t('description') }}
      </p>
    </div>

    <UCard class="max-w-2xl mx-auto">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-queue-list" class="w-5 h-5" />
          <h2 class="text-xl font-semibold">{{ $t('whenApply') }}</h2>
        </div>
      </template>

      <div class="space-y-4">
        <USelect
          class="w-full flex items-center justify-center"
          v-model="selectedBranch"
          :items="branches.map(b => ({ label: $t(`branches.${b.branchCode}`), value: b.branchCode }))"
          :placeholder="$t('selectBranch') || 'Select a branch'"
          :loading="branchesLoading"
          color="info"
          highlight
        />
        
        <USelect
          class="w-full flex items-center justify-center"
          v-model="appliedYear"
          :items="yearOptions"
          :placeholder="$t('selectYear')"
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
          {{ $t('predict') }}
        </UButton>
      </div>
    </UCard>

    <UCard v-if="predictionResult.earliestDate !== 'N/A'" class="max-w-2xl mx-auto">       
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-arrow-trending-up" class="w-5 h-5" />
            <h2 class="text-xl font-semibold">{{ $t('predictionResult') }}</h2>
          </div>
        </template> 
        <div class="space-y-4">
          <p v-if="prData" class="text-center text-sm text-gray-600 dark:text-gray-400">
            {{ $t('dataUpdated', { date: new Date(prData.updatedAt).toLocaleDateString($i18n.locale, { year: 'numeric', month: 'long', day: 'numeric' }) }) }}
            <br>
            {{ $t('latestAvailableDate', { date: new Date(latestAvailableDate).toLocaleDateString($i18n.locale, { year: 'numeric', month: 'long', day: 'numeric' }) }) }}
          </p>
          <UCollapsible>
            <UButton size="sm" color="info" variant="ghost" class="w-full flex items-center justify-center">
              {{ $t('viewRawData') }}
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
            {{ $t('ifAppliedIn', { date: new Date(appliedDate).toLocaleDateString($i18n.locale, { year: 'numeric', month: 'short' }) }) }}
            <br>
            <span v-if="predictionResult.remainingCount === '0'" class="text-green-600 dark:text-green-400 font-semibold"> {{ $t('applicationProcessed') }}</span>
          </p>
          <div v-else>
            <UAlert
              color="warning"
              variant="soft"
              :description="$t('dataNotAvailable')"
              icon="i-heroicons-exclamation-triangle"
            />
            <br>
            <p class="text-center text-sm text-gray-600 dark:text-gray-400">
              {{ $t('usingDataUpTo', { date: new Date(latestAvailableDate).toLocaleDateString($i18n.locale, { year: 'numeric', month: 'short' }) }) }}
            </p>
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div class="flex font-bold items-center justify-center text-blue-500 dark:text-blue-400 space-x-2 border-2 border-blue-500 dark:border-blue-400 rounded-lg p-4">
              <UIcon name="i-lucide-users" class="size-6" /> 
              <div class="space-x-2">
                <span class="text-2xl">{{ predictionResult.remainingCount }}</span> 
                <span class="text-sm">{{ $t('inQueue') }}</span>
              </div>
            </div>
            <div class="flex font-bold items-center justify-center text-green-600 dark:text-green-400 space-x-2 border-2 border-green-600 dark:border-green-400 rounded-lg p-4">
              <UIcon name="i-lucide-shredder" class="size-6" /> 
              <div class="space-x-2">
                <span class="text-2xl">{{ predictionResult.averageMonthlyProcessed.toLocaleString() }}</span> 
                <span class="text-sm">{{ $t('monthlySolved') }}</span>
              </div>
            </div>
            <div class="flex font-bold items-center justify-center text-rose-500 dark:text-rose-400 space-x-2 border-2 border-rose-500 dark:border-rose-400 rounded-lg p-4">
              <UIcon name="i-lucide-package-plus" class="size-6" /> 
              <div class="space-x-2">
                <span class="text-2xl">{{ predictionResult.averageMonthlyNewApplication.toLocaleString() }}</span> 
                <span class="text-sm">{{ $t('monthlyNew') }}</span>
              </div>
            </div>
            <div class="flex font-bold items-center justify-center text-amber-500 dark:text-amber-400 space-x-2 border-2 border-amber-500 dark:border-amber-400 rounded-lg p-4">
              <UIcon name="i-lucide-rabbit" class="size-6" /> 
              <div class="space-x-2">
                <span class="text-xl">{{ predictionResult.earliestDate !== 'N/A' ? predictionResult.earliestDate : 'N/A' }}</span> 
                <span class="text-sm">{{ $t('earliest') }}</span>
              </div>
            </div>
            <div class="flex font-bold items-center justify-center text-purple-500 dark:text-purple-400 space-x-2 border-2 border-purple-500 dark:border-purple-400 rounded-lg p-4">
              <UIcon name="i-lucide-turtle" class="size-6" /> 
              <div class="space-x-2">
                <span class="text-xl">{{ predictionResult.latestDate !== 'N/A' ? predictionResult.latestDate : 'N/A' }}</span> 
                <span class="text-sm">{{ $t('latest') }}</span>
              </div>
            </div>
          </div>
        </div>
      </UCard>

    <!-- Interactive Chart Section -->
    <UCard v-if="prData" class="max-w-2xl mx-auto mb-16">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-chart-bar" class="w-5 h-5" />
          <h2 class="text-xl font-semibold">{{ $t('chart.title') }}</h2>
        </div>
      </template>
      
      <div class="space-y-4">
        <p class="text-center text-sm text-gray-600 dark:text-gray-400">
          {{ $t('chart.appliedDate') }}: {{ appliedDate }}<br>
          {{ $t('chart.disclaimer') }}
        </p>
        <PRDataChart :pr-data="prData" :applied-date="appliedDate" />
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

interface Branch {
  branchCode: string
  branchName: string
}

// Dynamic meta tags with i18n support
const { locale } = useI18n()

useHead({
  title: () => `${$t('title')}`,
  meta: [
    { name: 'description', content: () => $t('description') },
    { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no' },
    { name: 'format-detection', content: 'telephone=no' },
    { name: 'mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
    { property: 'og:title', content: () => `${$t('title')}` },
    { property: 'og:description', content: () => $t('description') },
    { property: 'og:type', content: 'website' },
    { property: 'og:locale', content: () => locale.value },
    { property: 'og:locale:alternate', content: 'en-US' },
    { property: 'og:locale:alternate', content: 'zh-TW' },
    { property: 'og:locale:alternate', content: 'zh-CN' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: () => `${$t('title')}` },
    { name: 'twitter:description', content: () => $t('description') }
  ]
})

// Reactive state
const appliedYear = ref<number>(new Date().getFullYear())
const appliedMonth = ref<string>(formatDate(new Date()).split('-')[1])
const appliedDate = ref<string>(`${appliedYear.value}-${appliedMonth.value}`)
const selectedBranch = ref<string>('')
const branches = ref<Branch[]>([])
const branchesLoading = ref(false)

// Generate year options from 2021 to current year + 1 (allow future planning)
const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let year = currentYear + 1; year >= 2021; year--) {
    years.push({ label: year.toString(), value: year })
  }
  return years
})

// Generate month options with month names
const monthOptions = computed(() => {
  const monthKeys = [
    'jan', 'feb', 'mar', 'apr', 'may', 'jun',
    'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
  ]
  const months = []
  for (let month = 1; month <= 12; month++) {
    months.push({ 
      label: $t(`months.${monthKeys[month - 1]}`), 
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

// Fetch branches list from GitHub
const fetchBranches = async () => {
  try {
    branchesLoading.value = true
    const response = await $fetch('https://raw.githubusercontent.com/vanngoh/estat-jp/main/json/branches/list.json')
    branches.value = JSON.parse(response as string) as Branch[]
  } catch (error) {
    console.error('Error fetching branches:', error)
  } finally {
    branchesLoading.value = false
  }
}

// Fetch branches on component mount
onMounted(() => {
  fetchBranches()
})


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