<template>
  <v-main>
    <AuthorizeApp
      v-if="!route.query.resource && appStore.authorizationData
        && (agent || appStore.application)"
      :application="appStore.application"
      :agent="agent"
      :authorization-data="appStore.authorizationData"
      :redirect="route.query.redirect !== 'false'"
    />
    <ShareResource
      v-if="!route.query.webid && clientId && appStore.resource"
      :application-id="clientId"
      :resource="appStore.resource"
      :social-agents="appStore.socialAgentList"
    />
  </v-main>
</template>

<script lang="ts" setup>
import AuthorizeApp from '@/components/AuthorizeApp.vue'
import ShareResource from '@/components/ShareResource.vue'
import { useAppStore } from '@/store/app'
import { AgentType } from '@janeirodigital/sai-api-messages'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const appStore = useAppStore()

const route = useRoute()
const clientId = ref<string | null>(null)
const agentId = ref<string | null>(null)
const resourceId = ref<string | undefined>()

watch(
  () => [route.query.client_id, route.query.resource],
  ([cId, resource]) => {
    if (route.name !== 'authorization') return
    if (route.query.webid) return
    if (!cId || Array.isArray(cId)) throw new Error('one client_id is required')
    clientId.value = cId
    if (resource) {
      if (Array.isArray(resource)) throw new Error('only one resource is allowed')
      resourceId.value = resource
    }
  },
  { immediate: true }
)

watch(
  () => route.query.webid,
  (webid) => {
    if (webid) {
      appStore.listSocialAgents()
      if (Array.isArray(webid)) throw new Error('only one agent is allowed')
      agentId.value = webid
      appStore.getAuthoriaztion(webid, AgentType.SocialAgent)
    }
  },
  { immediate: true }
)

watch(
  resourceId,
  (id) => {
    if (id) {
      appStore.getResource(id)
      appStore.listSocialAgents()
    }
  },
  { immediate: true }
)

watch(
  clientId,
  (id) => {
    if (id && !resourceId.value) {
      appStore.getUnregisteredApplication(id)
      appStore.getAuthoriaztion(id, AgentType.Application)
    }
  },
  { immediate: true }
)

const agent = computed(() => appStore.socialAgentList.find((a) => a.id === agentId.value))
</script>
