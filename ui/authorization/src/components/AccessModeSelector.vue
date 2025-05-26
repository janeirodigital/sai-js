<template>
  <v-btn-toggle
    v-model="mode"
    variant="outlined"
    color="primary"
    mandatory
    :disabled="disabled"
    @update:model-value="(selected) => $emit('selected', selected)"
  >
    <v-btn
      icon="mdi-cancel"
      value="none"
    />
    <v-btn
      icon="mdi-eye-outline"
      value="view"
    />
    <v-btn
      icon="mdi-square-edit-outline"
      value="edit"
    />
    <v-btn
      v-if="props.add"
      icon="mdi-plus-box-outline"
      value="add"
    />
  </v-btn-toggle>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const props = defineProps({
  add: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

defineEmits<{
  selected: [mode: string]
}>()

const mode = ref('none')
</script>
