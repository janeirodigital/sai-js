<template>
  <v-list>
    <v-list-item v-for="application in appStore.applicationList" :key="application.id" :prepend-avatar="application.logo" :title="application.name">
    </v-list-item>
  </v-list>
</template>

<script lang="ts" setup>
import { useAppStore } from '@/store/app';

const appStore = useAppStore()
appStore.listApplications()

</script>