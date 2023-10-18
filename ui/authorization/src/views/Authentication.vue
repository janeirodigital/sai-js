<template>
  <v-main>
    <v-card>
      <v-card-item v-if="!coreStore.userId">
        <v-form @submit.prevent="login">
          <v-text-field v-model="oidcIssuer" :placeholder="defaultOidcIssuer" label="OIDC issuer"></v-text-field>
          <v-btn type="submit" block class="mt-2">Login</v-btn>
        </v-form>
      </v-card-item>
      <v-card-item v-else>
        <v-btn @click="loginBackend" block class="mt-2">Connect Server</v-btn>
      </v-card-item>
    </v-card>
  </v-main>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useCoreStore } from '@/store/core';
const coreStore = useCoreStore();

const defaultOidcIssuer = import.meta.env.VITE_DEFAULT_OIDC_ISSUER;
const oidcIssuer = ref('');

// will redirect to OIDC issuer
async function login() {
  return coreStore.login(oidcIssuer.value || defaultOidcIssuer);
}

// will redirect to OIDC issuer
function loginBackend() {
  window.location.href = coreStore.redirectUrlForBackend;
}
</script>
