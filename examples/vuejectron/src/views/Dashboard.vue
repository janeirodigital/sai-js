<template>
  <v-main>
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
import { useAppStore } from '@/store/app';
const appStore = useAppStore();
</script>
