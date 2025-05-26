<template>
  <v-form>
    <v-text-field
      v-model="eventName"
      label="Name"
      :rules="[required]"
    />
    <v-select
      v-if="eventName" 
      v-model="organizationId"
      label="Organization"
      :items="store.organizations"
      item-title="label"
      item-value="@id"
    />
    <v-list-item
      v-if="pods?.length === 1"
    >
      {{ pods[0]?.name }}
    </v-list-item>
    <v-select
      v-else-if="pods?.length > 1"
      v-model="podId"
      label="Pod"
      :items="pods"
      item-title="name"
      item-value="id"
    />
    <v-select
      v-if="organization && podId"
      v-model="chairId"
      label="Chair"
      :items="organization.member"
      item-title="label"
      item-value="@id"
    />
    <v-text-field
      v-if="chairId"
      :model-value="store.formatDate(startDate)"
      :active="dateModal"
      :focused="dateModal"
      label="Start Date"
      prepend-icon="mdi-calendar-blank-outline"
      readonly
    >
      <v-dialog
        v-model="dateModal"
        activator="parent"
        width="auto"
      >
        <v-date-picker
          v-if="dateModal"
          v-model="startDate"
          title="Start Date"
          :min="minDate()"
        />
      </v-dialog>
    </v-text-field>
    <v-text-field
      v-if="startDate"
      :model-value="store.formatTime(dateTime)"
      :active="timeModal"
      :focused="timeModal"
      label="Start Time"
      prepend-icon="mdi-clock-time-four-outline"
      readonly
    >
      <v-dialog
        v-model="timeModal"
        activator="parent"
        width="auto"
      >
        <v-time-picker
          v-if="timeModal"
          v-model="startTime"
          format="24h"
          title="Start Time"
        />
      </v-dialog>
    </v-text-field>
    <v-btn
      :disabled="!(eventName && organizationId && podId && chairId && dateTime)"
      color="primary"
      @click="create"
    >
      Create
    </v-btn>
  </v-form>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'

const router = useRouter()
const store = useAppStore()

const eventName = ref('')
const organizationId = ref()
const podId = ref()
const chairId = ref()
const startDate = ref<Date>()
const dateModal = ref(false)
const startTime = ref<string>()
const timeModal = ref(false)

const organization = computed(() =>
  store.organizations.find((o) => o['@id'] === organizationId.value)
)
const pods = computed(() => store.pods[organizationId.value])
const dateTime = computed(() => {
  if (!startDate.value || !startTime.value) return undefined
  return new Date(`${startDate.value.toLocaleDateString()} ${startTime.value}`)
})
watch(pods, () => {
  if (pods.value?.length === 1) podId.value = pods.value[0].id
  else podId.value = undefined
})

store.loadOrganizations()

function required(value) {
  return !!value || 'required'
}

function minDate(): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }
  return new Intl.DateTimeFormat('en-CA', options).format(new Date())
}

function create() {
  const chair = organization.value?.member?.find((m) => m['@id'] === chairId.value)
  if (chair && dateTime.value) {
    store.createEvent(eventName.value, organizationId.value, podId.value, chair, dateTime.value)
    router.push({ name: 'list' })
  }
}
</script>

<style>
  .v-form {
    margin: 1rem;
  }
</style>
