<template>
  <v-main>
    <template v-if="appStore.currentAgent && appStore.resourceServers[appStore.currentAgent.id]">
      <div
        v-for="resourceServer in appStore.resourceServers[appStore.currentAgent.id]"
        :key="resourceServer.id"
      >
        <h3>{{ resourceServer.label }}</h3>
        <v-list>
          <v-list-item
            v-for="project in appStore.projectsFor(resourceServer.id)"
            :key="project['@id']"
          >
            <router-link
              :to="{ name: 'project', query: { ...route.query, resourceServer: resourceServer.id, project: project['@id'] } }"
            >
              {{ project.label }}
            </router-link>
          </v-list-item>
        </v-list>
      </div>
    </template>
  </v-main>
</template>
<script lang="ts" setup>
import { useAppStore } from '@/store/app'
import { watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const appStore = useAppStore()
await appStore.loadAgents()

watch(
  () => route.query.agent,
  (agent) => {
    if (agent) {
      appStore.setCurrentAgent(agent as string) // TODO
      appStore.loadProjects(agent as string) // TODO
    }
  },
  { immediate: true }
)
</script>
