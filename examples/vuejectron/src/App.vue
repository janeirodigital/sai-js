<template>
  <Suspense>
    <router-view />
    <template #fallback>
      <v-progress-circular
        indeterminate
        color="primary"
      />
    </template>
  </Suspense>
</template>

<script lang="ts" setup>
import { usePreferredDark } from '@vueuse/core'
import { watch } from 'vue'
import { useTheme } from 'vuetify'

const theme = useTheme()

const preferredDark = usePreferredDark()

watch(preferredDark, (newValue) => {
  theme.global.name.value = newValue ? 'dark' : 'light'
})
</script>
