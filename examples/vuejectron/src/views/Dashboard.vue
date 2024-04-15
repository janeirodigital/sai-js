<template>
  <v-main>
    <v-btn @click="appStore.subscribeViaPush">Test</v-btn>
    <v-alert
      v-if="!appStore.pushSubscription"
      color="warning"
      icon="mdi-bell-cog-outline"
      title="Notifications"
      text="currently disabled"
    >
      <template #append>
        <v-btn
          color="secondary"
          :loading="enableNotificationsLoading"
          @click="enableNotifications"
        >Enable</v-btn>
      </template>
    </v-alert>
    <v-list>
      <v-list-item v-for="agent in appStore.agents" :key="agent.id">
        <router-link :to="{ name: 'agent', query: { agent: agent.id } }">
          {{ agent.label }}
        </router-link>
      </v-list-item>
    </v-list>
  </v-main>
</template>
<script lang="ts" setup>
import { ref } from 'vue';
import { useAppStore } from '@/store/app';

const appStore = useAppStore()
const enableNotificationsLoading = ref(false)

async function enableNotifications() {
  enableNotificationsLoading.value = true
  await appStore.enableNotifications()
  enableNotificationsLoading.value = false
}
await appStore.getPushSubscription()

// TODO: act differently depending on message.data
navigator.serviceWorker.onmessage = (message) => {
 console.log('message', message)
};

</script>
