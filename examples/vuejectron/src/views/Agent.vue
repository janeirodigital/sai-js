<template>
  <v-main>
    <div
      v-if="appStore.currentAgent && appStore.registrations[appStore.currentAgent.id]"
      v-for="registration in appStore.registrations[appStore.currentAgent.id]"
    >
      <h3>{{ registration.label }}</h3>
      <v-list>
        <v-list-item v-for="project in appStore.projects[registration.id]" :key="project.id">
          <router-link
            :to="{ name: 'project', query: { ...route.query, registration: registration.id, project: project.id } }"
          >
            {{ project.label }}
          </router-link>
        </v-list-item>
      </v-list>
    </div>
  </v-main>
</template>
<script lang="ts" setup>
import { watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAppStore } from '@/store/app';

const route = useRoute();

const appStore = useAppStore();
await appStore.loadAgents();

watch(
  () => route.query.agent,
  (agent) => {
    if (agent) {
      appStore.setCurrentAgent(agent as string);
      appStore.loadProjects(agent as string); // TODO
    }
  },
  { immediate: true }
);
</script>
