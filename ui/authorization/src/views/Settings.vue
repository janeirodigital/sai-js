<template>
  <v-list>
    <v-list-item>
      <v-list-item-title>{{ $t('language') }}</v-list-item-title>
      <template #append>
        <v-select
          v-model="coreStore.lang"
          :items="languages"
        ></v-select>
      </template>
    </v-list-item>
  </v-list>
</template>

<script lang="ts" setup>
import locale from 'locale-codes'
import { computed } from 'vue';
import { useCoreStore } from '@/store/core';

const coreStore = useCoreStore()

const languages = computed(() => 
  coreStore.availableLanguages.map(lang => ({
      title: locale.getByTag(lang)?.local || lang,
      value: lang
    }))
)

</script>
