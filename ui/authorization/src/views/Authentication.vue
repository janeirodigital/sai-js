<template>
  <v-main>
    <v-card>
      <v-card-item v-if="!coreStore.userId">
        <v-form @submit.prevent="login">
          <v-text-field
            v-bind="$ta('sign-in-input')"
            v-model="oidcIssuer"
            :placeholder="defaultOidcIssuer"
          />
          <v-btn
            type="submit"
            block
            class="mt-2"
          >
            {{ $t('sign-in') }}
          </v-btn>
        </v-form>
      </v-card-item>
      <v-card-item v-else>
        <v-btn
          block
          class="mt-2"
          @click="loginBackend"
        >
          {{ $t('connect-server') }}
        </v-btn>
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
