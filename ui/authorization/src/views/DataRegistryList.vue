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
          <span class="label flex-grow-1">{{ appStore.socialAgentList.find(a => a.id === route.query.agent)?.label }}</span>
        </template>
      </v-card-title>
    </v-card>
    <v-expansion-panels>
      <v-expansion-panel
        v-for="registry in appStore.dataRegistryList[route.query.agent as string]"
        :key="registry.id">
        <v-expansion-panel-title class="d-flex flex-row">
          <v-icon color="primary" icon="mdi-hexagon-outline"></v-icon>
          <span class="label flex-grow-1">{{ registry.id }}</span>
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
  </v-container>
</template>

<script lang="ts" setup>
import { useCoreStore } from '@/store/core';
import { useAppStore } from '@/store/app';
import { useRoute } from 'vue-router';
import { watch } from 'vue';

const appStore = useAppStore()
const coreStore = useCoreStore()
const route = useRoute()

watch(
  () => route.query.agent,
  async (agent) => {
    if (agent) {
      await appStore.listDataRegistries(agent as string, coreStore.lang)
    }
  },
  { immediate: true }
);

</script>