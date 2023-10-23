<template>
  <v-card v-for="agent in appStore.socialAgentList" :key="agent.id" :title="agent.label">
    <v-card-actions>
      <v-btn :to="{name: 'data-registry-list', query: {agent: agent.id}}" icon="mdi-hexagon-multiple-outline">
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts" setup>
import { useAppStore } from '@/store/app';

const appStore = useAppStore()
appStore.listSocialAgents()

</script>