<template>
  <v-card :title="resource.label" :subtitle="resource.shapeTree.label">
    <v-card-actions>
      <AccessModeSelector @selected="(mode) => modeSelected(resource.shapeTree.id, mode)"></AccessModeSelector>
    </v-card-actions>
    <v-card-text>
      <v-list>
        <v-list-item v-for="child of resource.children" :key="child.shapeTree.id">
          <v-list-item-title>
            {{ child.shapeTree.label }}
            <v-badge color="secondary" :content="child.count" inline></v-badge>
          </v-list-item-title>
          <template v-slot:append>
            <v-list-item-action>
              <AccessModeSelector
                add
                :disabled="!shareData.accessMode.length"
                @selected="(mode) => modeSelected(child.shapeTree.id, mode)"
              ></AccessModeSelector>
            </v-list-item-action>
          </template>
        </v-list-item>
      </v-list>
      <v-list>
        <v-list-subheader>Choose agents</v-list-subheader>
        <v-list-item
          v-for="agent of potentialGrantees"
          :key="agent.id"
          :title="agent.label"
          @click="toggleAgent(agent.id)"
        >
          <template v-slot:append>
            <v-list-item-action end>
              <v-checkbox-btn :model-value="selectedAgents.has(agent.id)" @click.prevent></v-checkbox-btn>
            </v-list-item-action>
          </template>
        </v-list-item>
      </v-list>
      <v-list>
        <v-list-subheader>Agents with access</v-list-subheader>
        <v-list-item v-for="agent of existingGrantees" :key="agent.id" :title="agent.label" :value="agent.id">
          <template v-slot:append>
            <v-list-item-action end>
              <v-btn
                icon="mdi-arrow-right-thick"
                variant="text"
                @click="router.push({ name: 'authorization', query: { webid: agent.id } })"
              ></v-btn>
            </v-list-item-action>
          </template>
        </v-list-item>
      </v-list>
    </v-card-text>
    <div class="px-2 d-flex justify-space-between">
      <v-btn color="warning" variant="tonal" :disabled="loading">Cancel</v-btn>
      <v-btn color="primary" variant="flat" size="large" :loading="loading" :disabled="!valid" @click="share"
        >Share</v-btn
      >
    </div>
  </v-card>
  <v-bottom-navigation> </v-bottom-navigation>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { AccessModes, Resource, ShareAuthorizationModes, SocialAgent } from '@janeirodigital/sai-api-messages';
import { useAppStore } from '@/store/app';
import AccessModeSelector from '@/components/AccessModeSelector.vue';

const router = useRouter();
const appStore = useAppStore();

const props = defineProps<{
  applicationId: string;
  resource: Resource;
  socialAgents: SocialAgent[];
}>();

const shareData: ShareAuthorizationModes = reactive({
  accessMode: [],
  children: []
});

const loading = ref(false);

const valid = computed(() => Boolean(shareData.accessMode.length && selectedAgents.size));

const selectedAgents = reactive<Set<string>>(new Set());

function toggleAgent(id: string) {
  if (selectedAgents.has(id)) {
    selectedAgents.delete(id);
  } else {
    selectedAgents.add(id);
  }
}

const existingGrantees = computed(() => {
  return props.socialAgents.filter((agent) => props.resource.accessGrantedTo.includes(agent.id));
});

const potentialGrantees = computed(() => {
  return props.socialAgents.filter((agent) => !props.resource.accessGrantedTo.includes(agent.id));
});

function chooseAccessMode(value: string): string[] {
  switch (value) {
    case 'view':
      return [AccessModes.Read];
    case 'edit':
      return [AccessModes.Read, AccessModes.Update];
    case 'add':
      return [AccessModes.Read, AccessModes.Update, AccessModes.Create];
    default:
      return [];
  }
}
function modeSelected(shapeTree: string, mode: string) {
  if (shapeTree === props.resource.shapeTree.id) {
    shareData.accessMode = chooseAccessMode(mode);
  } else {
    let child = shareData.children.find((c) => c.shapeTree === shapeTree);
    if (!child) {
      child = { shapeTree, accessMode: chooseAccessMode(mode) };
      shareData.children.push(child);
    } else {
      child.accessMode = chooseAccessMode(mode);
    }
  }
}

function share() {
  loading.value = true;
  appStore.shareResource({
    applicationId: props.applicationId,
    resource: props.resource.id,
    accessMode: shareData.accessMode,
    children: shareData.children,
    agents: [...selectedAgents]
  });
}

watch(
  () => appStore.shareAuthorizationConfirmation,
  (confirmation) => {
    if (confirmation) window.location.href = confirmation.callbackEndpoint;
  }
);
</script>
