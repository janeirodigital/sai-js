<template>
  <v-main>
    <v-alert
      v-if="!coreStore.pushSubscription"
      color="warning"
      icon="mdi-bell-cog-outline"
      title="Notifications"
      text="currently disabled"
    >
      <template v-slot:append>
        <v-btn
          color="secondary"
          :loading="enableNotificationsLoading"
          @click="enableNotifications"
        >Enable</v-btn>
      </template>
    </v-alert>
    <router-view></router-view>
  </v-main>
  <v-bottom-navigation>
    <v-btn :to="{name: 'application-list'}">
      <v-icon>mdi-apps</v-icon>

      <span>Apps</span>
    </v-btn>

    <v-btn :to="{name: 'social-agent-list'}">
      <v-icon>mdi-account-group</v-icon>

      <span>Peers</span>
    </v-btn>

    <v-btn :to="{name: 'data-registry-list', query: {agent: coreStore.userId}}">
      <v-icon>mdi-hexagon-multiple-outline</v-icon>

      <span>Data</span>
    </v-btn>
</v-bottom-navigation>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useCoreStore } from '@/store/core';
import { useAppStore } from '@/store/app';
const coreStore = useCoreStore()
const appStore = useAppStore()

coreStore.getPushSubscription()
const enableNotificationsLoading = ref(false)

function enableNotifications() {
  enableNotificationsLoading.value = true
  coreStore.enableNotifications()
}

// TODO: act differently depending on message.data
navigator.serviceWorker.onmessage = (message) => {
  appStore.listSocialAgents(true)
  appStore.listSocialAgentInvitations(true)
  appStore.listDataRegistries(message.data.data.webId)
};

</script>
