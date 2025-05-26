<template>
  <v-main>
    <v-card>
      <v-card-item>
        <v-form @submit.prevent="login">
          <v-text-field label="webId" v-model="webId" required />
          <v-btn type="submit" block class="mt-2" :disabled="!webId">
            {{ $t('sign-in') }}
          </v-btn>
        </v-form>
      </v-card-item>
    </v-card>
  </v-main>
</template>

<script lang="ts" setup>
import { useCoreStore } from '@/store/core'
import { ref } from 'vue'

const coreStore = useCoreStore()

const webId = ref('')

// TODO: validate webId
async function login() {
  return coreStore.login(webId.value)
}
</script>
