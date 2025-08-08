<template>
  <div class="flex items-center gap-2">
    <!-- Simple toggle button for debugging -->
    <UButton
      :icon="currentThemeIcon"
      color="neutral"
      variant="ghost"
      size="sm"
      :aria-label="$t('toggleTheme')"
      @click="toggleTheme"
    />
  </div>
</template>

<script setup lang="ts">
const colorMode = useColorMode()
const { t } = useI18n()

const themeOptions = computed(() => [
  {
    label: t('light'),
    icon: 'i-heroicons-sun',
    click: () => {
      colorMode.preference = 'light'
    }
  },
  {
    label: t('dark'),
    icon: 'i-heroicons-moon',
    click: () => {
      colorMode.preference = 'dark'
    }
  }
])

const currentThemeIcon = computed(() => {
  switch (colorMode.preference) {
    case 'light':
      return 'i-heroicons-sun'
    case 'dark':
      return 'i-heroicons-moon'
    default:
      return 'i-heroicons-sun'
  }
})

const toggleTheme = () => {
  colorMode.preference = colorMode.preference === 'light' ? 'dark' : 'light'
}
</script> 