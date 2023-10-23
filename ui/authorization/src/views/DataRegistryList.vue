<style>
span.label {
  padding-left: 6px;
}
</style>
<template>
  <v-expansion-panels>
    <v-expansion-panel v-for="registry in appStore.dataRegistryList">
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
          @click="appStore.listDataInstances(registration.id)"
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
</template>

<script lang="ts" setup>
import { useCoreStore } from '@/store/core';
import { useAppStore } from '@/store/app';

const appStore = useAppStore()
const coreStore = useCoreStore()
appStore.listDataRegistries(coreStore.lang)

</script>