<template>
  <UApp>
    <NuxtPage />
  </UApp>
</template>

<script setup lang="ts">
const { setLocale, locales } = useI18n()
const route = useRoute()

// Set locale from query string on mount
onMounted(() => {
  const langFromQuery = route.query.lang as string
  if (langFromQuery) {
    const validLocale = locales.value.find(l => l.code === langFromQuery)
    if (validLocale) {
      setLocale(langFromQuery as 'en-US' | 'zh-TW' | 'zh-CN')
    }
  }
})
</script> 