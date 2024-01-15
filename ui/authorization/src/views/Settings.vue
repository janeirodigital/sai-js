<template>
  <v-list>
    <v-list-item>
      <v-list-item-title>{{ $t('language') }}</v-list-item-title>
      <template v-slot:append>
        <v-select
          v-model="coreStore.lang"
          :items="languages"
        ></v-select>
      </template>
    </v-list-item>
  </v-list>
</template>

<script lang="ts" setup>
import { useCoreStore } from '@/store/core';
import locale from 'locale-codes'
import { computed } from 'vue';

const languages = computed(() => 
  coreStore.availableLanguages.map((lang) => {
    return {
      title: locale.getByTag(lang)?.local || lang,
      value: lang
    }
  })
)

const coreStore = useCoreStore()

</script>
