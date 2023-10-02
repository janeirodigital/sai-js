<template>
  <v-card>
    <v-card-item v-if="!userId">
      <v-form @submit.prevent="login">
        <v-text-field v-model="oidcIssuer" :placeholder="defaultOidcIssuer" label="OIDC issuer"></v-text-field>
        <v-btn type="submit" block class="mt-2">Login</v-btn>
      </v-form>
    </v-card-item>
    <v-card-item v-else>
      <v-btn @click="requestAuthorization" block class="mt-2">Request Authorization</v-btn>
    </v-card-item>
  </v-card>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useCoreStore } from '@/store/core';
const store = useCoreStore();

const defaultOidcIssuer = import.meta.env.VITE_DEFAULT_OIDC_ISSUER;
const oidcIssuer = ref('');
const userId = store.userId;

// will redirect to OIDC issuer
async function login() {
  return store.login(oidcIssuer.value || defaultOidcIssuer);
}

// will redirect to authorization agent
async function requestAuthorization() {
  return store.authorize();
}
</script>
