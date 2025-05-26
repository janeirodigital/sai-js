<template>
  <div class="text-center">
    <v-dialog :model-value="dialog">
      <v-card>
        <v-card-text>
          <v-text-field
            v-model="inputText"
            required
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="secondary"
            @click="cancel"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :disabled="!inputText"
            @click="save"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'

const props = defineProps<{ dialog: boolean; text?: string }>()
const emit = defineEmits<{
  cancel: []
  save: [text: string]
}>()

const inputText = ref('')

watch(
  () => props.text,
  (value) => {
    inputText.value = value || ''
  },
  { immediate: true }
)

function cancel() {
  emit('cancel')
}

function save() {
  emit('save', inputText.value)
}
</script>
