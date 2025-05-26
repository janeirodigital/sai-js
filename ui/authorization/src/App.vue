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
import { useTheme } from 'vuetify'

const theme = useTheme()

function toggleDark(on: boolean) {
  theme.global.name.value = on ? 'dark' : 'light'
}

const mq = window.matchMedia('(prefers-color-scheme: dark)')

toggleDark(mq.matches)

mq.addEventListener('change', () => {
  toggleDark(mq.matches)
})
</script>
