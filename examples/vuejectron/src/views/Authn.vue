<template>
  <v-card v-if="!hasError">
    <v-card-item v-if="!store.userId">
      <v-form @submit.prevent="login">
        <v-text-field v-model="oidcIssuer" :placeholder="defaultOidcIssuer" label="OIDC issuer"></v-text-field>
        <v-btn type="submit" block class="mt-2">Login</v-btn>
      </v-form>
    </v-card-item>
    <v-card-item v-else>
      <v-btn block class="mt-2" @click="requestAuthorization">Request Authorization</v-btn>
    </v-card-item>
  </v-card>
  <v-card v-else>
    <v-alert
      type="error"
      :title="appStore.saiError"
    ></v-alert>
  </v-card>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useCoreStore } from '@/store/core';
import { useAppStore } from '@/store/app';

const store = useCoreStore();
const appStore = useAppStore();
const hasError = computed(() => !!appStore.saiError)

const defaultOidcIssuer = import.meta.env.VITE_DEFAULT_OIDC_ISSUER;
const oidcIssuer = ref('');

// will redirect to OIDC issuer
async function login() {
  return store.login(oidcIssuer.value || defaultOidcIssuer);
}

// will redirect to authorization agent
async function requestAuthorization() {
  return appStore.authorize();
}
</script>
