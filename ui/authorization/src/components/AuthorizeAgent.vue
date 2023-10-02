<template>
  <v-card :title="agent.label" :subtitle="agent.note"> </v-card>
</template>

<script lang="ts" setup>
import { SocialAgent } from '@janeirodigital/sai-api-messages';

defineProps<{
  agent: SocialAgent;
}>();
</script>
