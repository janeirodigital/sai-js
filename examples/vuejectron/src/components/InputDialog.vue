<template>
  <div class="text-center">
    <v-dialog :modelValue="dialog">
      <v-card>
        <v-card-text>
          <v-text-field v-model="text" required> </v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="secondary" @click="cancel">Cancel</v-btn>
          <v-btn color="primary" @click="save" :disabled="!text">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';

const props = defineProps<{ dialog: boolean; text?: string }>();
const emit = defineEmits<{
  cancel: [];
  save: [text: string];
}>();

const text = ref('');

watch(
  () => props.text,
  (value) => {
    text.value = value || '';
  },
  { immediate: true }
);

function cancel() {
  emit('cancel');
}

function save() {
  emit('save', text.value);
}
</script>
