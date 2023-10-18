<template>
  <v-main>
    <AuthorizeApp
      v-if="!route.query.resource && appStore.authorizationData && appStore.application"
      :application="appStore.application"
      :authorizationData="appStore.authorizationData"
    ></AuthorizeApp>
    <AuthorizeAgent v-if="!route.query.resource && agent" :agent="agent"></AuthorizeAgent>
    <ShareResource
      v-if="!route.query.webid && clientId && appStore.resource"
      :applicationId="clientId"
      :resource="appStore.resource"
      :social-agents="appStore.socialAgentList"
    ></ShareResource>
  </v-main>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAppStore } from '@/store/app';
import AuthorizeApp from '@/components/AuthorizeApp.vue';
import AuthorizeAgent from '@/components/AuthorizeAgent.vue';
import ShareResource from '@/components/ShareResource.vue';

const appStore = useAppStore();

const route = useRoute();
const clientId = ref<string | null>(null);
const agentId = ref<string | null>(null);
const resourceId = ref<string | undefined>();

watch(
  () => [route.query.client_id, route.query.resource],
  ([client_id, resource]) => {
    if (route.query.webid) return;
    if (!client_id || Array.isArray(client_id)) throw new Error('one client_id is required');
    clientId.value = client_id;
    if (resource) {
      if (Array.isArray(resource)) throw new Error('only one resource is allowed');
      resourceId.value = resource;
    }
  },
  { immediate: true }
);

watch(
  () => route.query.webid,
  (webid) => {
    if (webid) {
      appStore.listSocialAgents();
      if (Array.isArray(webid)) throw new Error('only one agent is allowed');
      agentId.value = webid;
    }
  },
  { immediate: true }
);

watch(
  resourceId,
  (id) => {
    if (id) {
      appStore.getResource(id);
      appStore.listSocialAgents();
    }
  },
  { immediate: true }
);

watch(
  clientId,
  (id) => {
    if (id && !resourceId.value) {
      appStore.getApplication(id);
      appStore.getAuthoriaztion(id);
    }
  },
  { immediate: true }
);

const agent = computed(() => {
  return appStore.socialAgentList.find((a) => a.id === agentId.value);
});
</script>
