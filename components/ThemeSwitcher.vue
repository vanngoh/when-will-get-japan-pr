<template>
  <div class="flex items-center gap-2">
    <!-- Simple toggle button for debugging -->
    <UButton
      :icon="currentThemeIcon"
      color="neutral"
      variant="ghost"
      size="sm"
      :aria-label="$t('toggleTheme')"
      :label="$t(currentThemeLabel)"
      @click="toggleTheme"
    />
  </div>
</template>

<script setup lang="ts">
const colorMode = useColorMode()

const currentThemeIcon = computed(() => {
  // Shows what you'll get when you click
  return colorMode.preference === 'light' ? 'i-lucide-moon' : 'i-lucide-sun'
})

const currentThemeLabel = computed(() => {
  return colorMode.preference === 'light' ? 'dark' : 'light'
})

const toggleTheme = () => {
  colorMode.preference = colorMode.preference === 'light' ? 'dark' : 'light'
}
</script> 