<template>
  <v-sheet>
    <v-card>
      <v-card-item>
        <v-form @submit.prevent="create">
          <v-text-field
            v-if="route.query.direction === 'accept'"
            v-model="capabilityUrl"
            label="Invitation link"
            :rules="[rules.required]"
          ></v-text-field>
          <v-text-field
            v-model="label"
            label="Label"
            :rules="[rules.required]"
          ></v-text-field>
          <v-text-field v-model="note" label="Note"></v-text-field>
          <v-btn
            type="submit"
            block
            class="mt-2"
            :loading="loading"
            :disabled="!valid"
          >{{route.query.direction === 'create' ? 'Create invitation' : 'Accept invitation' }}</v-btn>
        </v-form>
      </v-card-item>
    </v-card>
  </v-sheet>
</template>
<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAppStore } from '@/store/app';

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

const capabilityUrl = ref('')
const label = ref('')
const note = ref('')
const loading = ref(false)

const valid = computed(() => label.value && (route.query.direction === 'accept' ? capabilityUrl.value : true))

const rules = {
  required: (value: string) => !!value || 'Label is required'
}

async function create () {
  loading.value = true
  if (route.query.direction as string === 'create') {
    const invitation = await appStore.createInvitation(label.value, note.value)
    router.push({ name: 'social-agent-list', query: { invitation: invitation.id } })  
  } else {
    if (!capabilityUrl.value) return
    const agent = await appStore.acceptInvitation(capabilityUrl.value, label.value, note.value)
    router.push({ name: 'social-agent-list', query: { agent: agent.id } })  
  }
}
</script>
