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
import { watch } from 'vue';
import { useCoreStore } from '@/store/core';
import { fluent } from '@/plugins/fluent'
import { FluentBundle } from '@fluent/bundle';

const coreStore = useCoreStore()

watch(() => coreStore.lang, async (lang) => {
  const newMessages = await import(`@/locales/${lang}.ftl`)
  const newBundle = new FluentBundle(lang)
  newBundle.addResource(newMessages.default);
  fluent.bundles = [newBundle]
})
</script>
