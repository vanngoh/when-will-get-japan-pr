<template>
  <div class="my-8 space-y-8">
    <div class="text-center">
      <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        🇯🇵 永住権獲得予測
      </h1>
      <p class="text-sm text-gray-600 dark:text-gray-300 mb-8">
        A tool which predicts when you can get Japanese Permanent Residency on your application date.
      </p>
    </div>

    <UCard class="max-w-2xl mx-auto">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-queue-list" class="w-5 h-5" />
          <h2 class="text-xl font-semibold">いつ永住権を申請しますか？</h2>
        </div>
      </template>

      <div class="space-y-4">
        <USelect
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
          予測する
        </UButton>
      </div>
    </UCard>

    <UCard v-if="prediction" class="max-w-2xl mx-auto">       
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-arrow-trending-up" class="w-5 h-5" />
            <h2 class="text-xl font-semibold">予測結果</h2>
          </div>
        </template> 
        <div class="space-y-4">
          <p v-if="prData" class="text-center text-sm text-gray-600 dark:text-gray-400">
            データ更新日: {{ new Date(prData.updatedAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' }) }}
          </p>
          <UCollapsible>
            <UButton size="sm" color="info" variant="ghost" class="w-full flex items-center justify-center">
              生データを見る
            </UButton>
            <template #content>
              <div class="mt-4">
                <pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-xs overflow-auto max-h-64">
                  {{ JSON.stringify(prData, null, 2) }}
                </pre>
              </div>
            </template>
          </UCollapsible>
          <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">
            予測日: {{ prediction }}
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

const appliedYear = ref<number>(new Date().getFullYear())
const appliedMonth = ref<string>((new Date().getMonth() + 1).toString().padStart(2, '0'))

const loading = ref(false)
const prediction = ref<string | null>(null)
const prData = ref<PRData | null>(null)
const dataLoading = ref(true)
const dataError = ref<string | null>(null)

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
  setTimeout(() => {
    if (!!prData.value) {
      console.log('prData.value', new Date(prData.value.updatedAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' }))
      // if (prData.value) {
      //   // You can use the actual PR data here for more accurate predictions
      //   console.log('Using PR data for prediction:', prData.value)
      // }
      // Example: Just echo the input for now
      prediction.value = `You applied in ${appliedYear.value}-${appliedMonth.value}`
      loading.value = false
    }
  }, 2000)
}
</script> 