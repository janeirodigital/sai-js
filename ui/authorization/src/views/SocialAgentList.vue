<template>
  <v-card
    v-for="agent in appStore.socialAgentList"
    :key="agent.id"
    :title="agent.label"
    :subtitle="agent.note"
    >
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn 
        prepend-icon="mdi-hexagon-multiple-outline"
        :to="{name: 'data-registry-list', query: {agent: agent.id}}"
      >Data</v-btn>
      <v-btn 
        :disabled="!agent.accessNeedGroup"
        prepend-icon="mdi-security"
        :to="{name: 'authorization', query: {webid: agent.id, redirect: 'false'}}"
      >
        Access
        <template
          v-slot:append
          v-if="agent.accessNeedGroup && !agent.accessGrant"
        >
          <v-badge
            inline
            color="warning"
            icon="mdi-bell-ring-outline"
          ></v-badge>

        </template>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts" setup>
import { useAppStore } from '@/store/app';


const appStore = useAppStore()
appStore.listSocialAgents()

</script>
