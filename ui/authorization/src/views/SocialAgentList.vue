<template>
  <v-list>
    <v-list-item v-for="agent in appStore.socialAgentList" :key="agent.id" :title="agent.label">
    </v-list-item>
  </v-list>
</template>

<script lang="ts" setup>
import { useAppStore } from '@/store/app';

const appStore = useAppStore()
appStore.listSocialAgents()

</script>