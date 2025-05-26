<template>
  <v-main>
    <v-alert
      v-if="!coreStore.pushSubscription"
      color="warning"
      icon="mdi-bell-cog-outline"
      v-bind="$ta('notifications-alert')"
    >
      <template #append>
        <v-btn color="secondary" :loading="enableNotificationsLoading" @click="enableNotifications">
          {{ $t('enable') }}
        </v-btn>
      </template>
    </v-alert>
    <router-view />
  </v-main>
  <v-bottom-navigation>
    <v-btn :to="{ name: 'application-list' }">
      <v-icon>mdi-apps</v-icon>

      <span>{{ $t('applications') }}</span>
    </v-btn>

    <v-btn :to="{ name: 'social-agent-list' }">
      <v-icon>mdi-account-group</v-icon>

      <span>{{ $t('peers') }}</span>
    </v-btn>

    <v-btn :to="{ name: 'data-registry-list', query: { agent: coreStore.userId } }">
      <v-icon>mdi-hexagon-multiple-outline</v-icon>

      <span>{{ $t('data') }}</span>
    </v-btn>
    <v-btn :to="{ name: 'settings', query: { agent: coreStore.userId } }">
      <v-icon>mdi-cog-outline</v-icon>

      <span>{{ $t('settings') }}</span>
    </v-btn>
  </v-bottom-navigation>
</template>

<script lang="ts" setup>
import { useAppStore } from '@/store/app'
import { useCoreStore } from '@/store/core'
import { ref } from 'vue'

const coreStore = useCoreStore()
const appStore = useAppStore()

const enableNotificationsLoading = ref(false)

await coreStore.getPushSubscription()

async function enableNotifications() {
  enableNotificationsLoading.value = true
  await coreStore.enableNotifications()
  enableNotificationsLoading.value = false
}

// TODO: act differently depending on message.data
navigator.serviceWorker.onmessage = (message) => {
  appStore.listSocialAgents(true)
  appStore.listSocialAgentInvitations(true)
  appStore.listDataRegistries(message.data.data.webId)
}
</script>
