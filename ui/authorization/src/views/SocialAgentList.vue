<template>
  <v-card v-for="agent in appStore.socialAgentList" :key="agent.id" :title="agent.label">
    <v-card-actions>
      <v-btn 
        icon="mdi-hexagon-multiple-outline"
        :to="{name: 'data-registry-list', query: {agent: agent.id}}"
      >
      </v-btn>
      <v-btn 
        icon="mdi-hand-wave-outline"
        @click="selectAgent(agent.id)" 
      >
      </v-btn>
      <v-btn 
        v-if="agent.accessNeedGroup"
        icon="mdi-handshake-outline"
        :to="{name: 'authorization', query: {webid: agent.id, redirect: 'false'}}"
        >
      </v-btn>
    </v-card-actions>
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
</template>

<script lang="ts" setup>
import { useAppStore } from '@/store/app';
import { ref } from 'vue';

const appListDialog = ref(false)
const selectedAgentId = ref<string | null>(null)

const appStore = useAppStore()
appStore.listSocialAgents()
appStore.listApplications()

function selectAgent(agentId: string) {
  selectedAgentId.value = agentId
  appListDialog.value = true
}

function requestAccess(applicationId: string) {
  if (!selectedAgentId.value) return
  appStore.requestAccess(applicationId, selectedAgentId.value)
  appListDialog.value = false  
}

</script>
