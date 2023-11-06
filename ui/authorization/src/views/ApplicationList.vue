<style>
  #add-button {
    display: block;
    margin: 16px auto 0;
  }
</style>
<template>
  <v-container>
    <v-list>
      <v-list-item
        v-for="application in appStore.applicationList"
        :key="application.id" :prepend-avatar="application.logo"
        :title="application.name">
      </v-list-item>
    </v-list>
    <v-btn
      id="add-button"
      color="primary"
      @click="addDialog = true"
    >
      <v-icon icon="mdi-plus"></v-icon>Add application
    </v-btn>
    <v-dialog
      persistent
      fullscreen
      width="100vw"
      v-model="addDialog"
    >
      <v-card>
        <v-card-title>
          Add application
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="addClientId"
            label="Client Id"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="warning"
            variant="tonal"
            @click="addDialog = false"
          >
            Cancel
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            :disabled="!addClientId"
            @click="addApplication"
          >
            Next
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useAppStore } from '@/store/app';
import { useRouter } from 'vue-router';

const router = useRouter()

const appStore = useAppStore()
appStore.listApplications()

const addDialog = ref(false)
const addClientId = ref('')

// http://localhost:3000/acme/projectron/vue
function addApplication() {
  addDialog.value = false
  if (addClientId.value) {
    router.push({ name: 'authorization', query: { client_id: addClientId.value, redirect: 'false' }})
  }
}

</script>
