<style>
#add {
  position: absolute;
  bottom: 60px;
  left: calc(50% - 24px);
}
</style>
<template>
  <v-sheet>
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
    <v-card
      v-for="invitation in appStore.invitationList"
      :key="invitation.id"
      :title="invitation.label"
      :subtitle="invitation.note"
      >
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn 
          prepend-icon="mdi-content-copy"
          @click="copyCapabilityUrl(invitation)"
        >Copy link</v-btn>
      </v-card-actions>
    </v-card>
    <v-btn
      id="add"
      icon="mdi-plus-circle-outline"
      @click="showAdd=true"
    ></v-btn>
    <v-bottom-sheet v-model="showAdd">
      <v-list>
        <v-list-item
          prepend-icon="mdi-account-arrow-right"
          @click="router.push( { name: 'invitation', query: { direction: 'create'}})"
        >Create invitation
        </v-list-item>
        <v-list-item
          prepend-icon="mdi-account-arrow-left"
          @click="router.push( { name: 'invitation', query: { direction: 'accept'}})"
        >
          Accept invitation
        </v-list-item>
      </v-list>

    </v-bottom-sheet>
  </v-sheet>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useAppStore } from '@/store/app';
import { useRouter } from 'vue-router';
import { Invitation } from '@janeirodigital/sai-api-messages';

const router = useRouter() 
const appStore = useAppStore()
appStore.listSocialAgents()
appStore.listSocialAgentInvitations()
const showAdd = ref(false)

function copyCapabilityUrl(invitation: Invitation) {
  navigator.clipboard.writeText(invitation.capabilityUrl)
}

</script>
