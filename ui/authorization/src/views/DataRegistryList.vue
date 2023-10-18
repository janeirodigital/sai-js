<template>
  <v-list>
    <v-list-item v-for="registry in appStore.dataRegistryList" :key="registry.id" :title="registry.id">
    </v-list-item>
  </v-list>
</template>

<script lang="ts" setup>
import { useCoreStore } from '@/store/core';
import { useAppStore } from '@/store/app';

const appStore = useAppStore()
const coreStore = useCoreStore()
appStore.listDataRegistries(coreStore.lang)

</script>