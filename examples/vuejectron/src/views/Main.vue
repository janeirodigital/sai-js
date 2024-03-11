<template>
  <v-app-bar color="primary">
    <v-app-bar-title>
      {{ title }}
    </v-app-bar-title>
    <template v-if="icon" #prepend>
      <v-btn :icon="icon" @click="navigateUp"> </v-btn>
    </template>
    <template v-if="route.query.project" #append>
      <v-btn icon="mdi-share-variant" @click="shareProject"> </v-btn>
    </template>
  </v-app-bar>

  <v-container>
    <router-view v-slot="{ Component }">
      <transition :name="(route.meta.transition! as string)">
        <component :is="Component" />
      </transition>
    </router-view>
  </v-container>
  <v-snackbar v-model="showSnackbar" color="info">
    <v-icon icon="mdi-share-variant"></v-icon>
    Data from new peer - <strong>{{ newAgent?.label }}</strong>
    <template #actions>
      <v-btn color="white" variant="outlined" @click="showAgent()"> Show </v-btn>
    </template>
  </v-snackbar>
</template>
<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Agent } from '@/models';
import { useAppStore } from '@/store/app';

const router = useRouter();
const route = useRoute();

const appStore = useAppStore();
appStore.watchSai();
await appStore.loadAgents();
if (route.query.project) {
  await appStore.loadProjects(route.query.agent as string);
}

const showSnackbar = ref(false);
const newAgent = ref<Agent>();

const title = computed(() => {
  if (route.query.agent) {
    return route.query.project ? appStore.currentProject?.label : appStore.currentAgent?.label;
  }
  return 'Vuejectron';
})

const icon = computed(() => {
  if (route.query.agent) {
    return route.query.project ? 'mdi-account-details' : 'mdi-account-convert';
  }
  return null;
});

function showAgent() {
  showSnackbar.value = false;
  if (newAgent.value) {
    router.push({ name: 'agent', query: { agent: newAgent.value.id } });
  }
}

function navigateUp() {
  if (route.query.project) {
    router.push({ name: 'agent', query: { agent: route.query.agent } });
  } else {
    router.push({ name: 'dashboard' });
  }
}

function shareProject() {
  if (appStore.currentProject) {
    appStore.shareProject(appStore.currentProject['@id']!);
  }
}

watch(
  () => appStore.agents,
  (latestAgents, previousAgents) => {
    newAgent.value = latestAgents.find((agent) => !previousAgents.some((a) => a.id === agent.id));
  }
);

watch(newAgent, (agent) => {
  if (agent) {
    showSnackbar.value = true;
  }
});
</script>

<style>
.left-enter-active,
.left-leave-active,
.right-enter-active,
.right-leave-active {
  position: absolute;
  transition: left 0.25s linear;
  width: 100vw;
}
.left-enter-to,
.left-leave-from,
.right-enter-to,
.right-leave-from {
  left: 0;
}
.left-leave-to,
.right-enter-from {
  left: -100vw;
}
.left-enter-from,
.right-leave-to {
  left: 100vw;
}
</style>
