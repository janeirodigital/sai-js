<template>
  <v-container
    v-if="store.events.length"
  >
    <v-btn
      color="primary"
      :to="{ name: 'form' }"
    >
      Create Event
    </v-btn>
    <v-card
      v-for="event of store.events"
      @click="showDetails(event)"
      :key="event['@id']"
      :title="event.name">
      <v-card-subtitle>
        {{ store.organizations.find(o => o['@id'] === store.getAgent(event))?.label }} -
        {{ store.getPod(event)?.name }}
      </v-card-subtitle>
      <v-card-text>
        {{ store.formatDateTime(event.startDate) }}
      </v-card-text>
    </v-card>
  </v-container>
  <v-skeleton-loader
    v-else
    type="list-item-three-line@3"
  ></v-skeleton-loader>

</template>

<script setup lang="ts">
  import { useRouter } from 'vue-router'
  import { useAppStore } from '../stores/app'
  import { Event } from '../../ldo/Event$.typings'

  const router = useRouter()
  const store = useAppStore()

  store.loadOrganizations()
  store.loadEvents()

  function showDetails(event: Event) {
    router.push({ name: 'details', query: { event: event['@id']} })
  }
</script>

<style scoped>
  .v-card {
    margin-top: 1.5rem;
  }
</style>
