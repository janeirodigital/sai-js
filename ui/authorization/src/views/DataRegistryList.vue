<style>
span.label {
  padding-left: 6px;
}
</style>
<template>
  <v-container>
    <v-card v-if="appStore.socialAgentList">
      <v-card-title>
        <template v-if="route.query.agent === coreStore.userId">
          <v-icon color="agent" icon="mdi-account-circle"></v-icon>
          <span class="label flex-grow-1">Me</span>
        </template>
        <template v-else>
          <v-icon color="agent" icon="mdi-account-circle-outline"></v-icon>
          <span class="label flex-grow-1">{{ agent?.label }}</span>
        </template>
      </v-card-title>
    </v-card>
    <v-expansion-panels>
      <v-expansion-panel
        v-for="registry in appStore.dataRegistryList[route.query.agent as string]"
        :key="registry.id">
        <v-expansion-panel-title class="d-flex flex-row">
          <v-icon color="primary" icon="mdi-hexagon-outline"></v-icon>
          <span class="label flex-grow-1">{{ registry.label }}</span>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-expansion-panels>
          <v-expansion-panel 
            v-for="registration in registry.registrations" 
            :title="registration.label"
            :key="registration.id"
            @click="appStore.listDataInstances(route.query.agent as string, registration.id)"
            >
            <v-expansion-panel-text>
              <v-list v-if="appStore.loadedDataInstances[registration.id]">
                <v-list-item
                  v-for="dataInstance of appStore.loadedDataInstances[registration.id]"
                  :key="dataInstance.id">
                  <v-list-item-title>
                    <v-icon color="secondary" icon="mdi-star-three-points-outline"></v-icon>
                    {{ dataInstance.label }}
                  </v-list-item-title>
                </v-list-item>
              </v-list>
              <v-skeleton-loader v-else type="list-item@2"></v-skeleton-loader>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    <v-card
      v-if="agent && appStore.dataRegistryList[agent.id] && !hasData"
    >
      <template v-if="!agent.accessRequested">
        <v-card-title>Request access</v-card-title>
        <v-btn
          prepend-icon="mdi-security"
          @click="appListDialog = true"
        >Based on application</v-btn>
      </template>
      <v-card-title v-else>Access requested</v-card-title>
    </v-card>

    <v-dialog :modelValue="appListDialog">
      <v-list>
        <v-list-item
          v-for="application in appStore.applicationList"
          :key="application.id" :prepend-avatar="application.logo"
          :title="application.name"
          @click="requestAccess(application.id)">
        
        </v-list-item>
      </v-list>
    </v-dialog>
  </v-container>
</template>

<script lang="ts" setup>
import { useCoreStore } from '@/store/core';
import { useAppStore } from '@/store/app';
import { useRoute } from 'vue-router';
import { computed, ref, watch } from 'vue';

const appStore = useAppStore()
const coreStore = useCoreStore()
const route = useRoute()
const appListDialog = ref(false)

appStore.listSocialAgents()
appStore.listApplications()

function requestAccess(applicationId: string) {
  if (!route.query.agent) return
  appStore.requestAccess(applicationId, route.query.agent as string)
  appListDialog.value = false  
}

const agent = computed(() => {
  return appStore.socialAgentList.find((a) => a.id === route.query.agent);
});

const hasData = computed(() => {
  return !!appStore.dataRegistryList[route.query.agent as string]?.length
});

watch(
  () => route.query.agent,
  async (agentId) => {
    if (agentId) {
      await appStore.listDataRegistries(agentId as string, coreStore.lang)
    }
  },
  { immediate: true }
);

</script>
