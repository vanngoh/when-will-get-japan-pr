<template>
  <USelect
    v-model="currentLocale"
    :items="availableLocales"
    item-title="label"
    item-value="value"
    size="sm"
    color="primary"
    variant="outline"
    class="w-40 p-2"
    @update:model-value="switchLanguage"
  />
</template>

<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()
const router = useRouter()
const route = useRoute()

const currentLocale = computed(() => locale.value)
const availableLocales = computed(() => locales.value.map(locale => ({
  label: locale.name,
  value: locale.code
})))

const switchLanguage = (newLocale: unknown) => {
  if (typeof newLocale === 'string') {
    setLocale(newLocale as 'en-US' | 'zh-TW' | 'zh-CN')
    router.replace({ query: { ...route.query, lang: newLocale } })
  }
}
</script> 