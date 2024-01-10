<template>
  <v-list>
    <v-list-item>
      <v-list-item-title>{{ $t('language') }}</v-list-item-title>
      <template v-slot:append>
        <v-select
          v-model="coreStore.lang"
          :items="coreStore.availableLanguages"
        ></v-select>
      </template>
    </v-list-item>
  </v-list>
</template>

<script lang="ts" setup>
import { useCoreStore } from '@/store/core';

const coreStore = useCoreStore()

</script>
