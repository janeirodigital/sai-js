<template>
  <v-main>
    <div v-if="appStore.currentProject">
      <h3>
        Tasks
        <v-btn
          v-if="appStore.currentProject.canAddTasks"
          size="small"
          color="surface-variant"
          variant="text"
          icon="mdi-plus"
          @click="newTask"
        ></v-btn>
      </h3>
      <v-list>
        <v-list-item v-for="task in appStore.tasks" :key="task.id">
          <v-card>
            <v-card-title>{{ task.label }}</v-card-title>
            <v-card-actions>
              <v-btn
                v-if="task.canUpdate"
                size="small"
                color="surface-variant"
                variant="text"
                icon="mdi-square-edit-outline"
                @click="editTask(task)"
              ></v-btn>
              <v-btn
                v-if="task.canDelete"
                size="small"
                color="surface-variant"
                variant="text"
                icon="mdi-delete-outline"
                @click="deleteTask(task)"
              ></v-btn>
            </v-card-actions>
          </v-card>
        </v-list-item>
      </v-list>
      <h3>
        Files
        <v-btn
          v-if="appStore.currentProject.canAddFiles"
          size="small"
          color="surface-variant"
          variant="text"
          icon="mdi-plus"
          @click="upload?.click()"
        ></v-btn>
      </h3>
      <v-list>
        <v-list-item v-for="file in appStore.files" :key="file.id">
          {{ file.filename }}
          <v-btn icon="mdi-download" variant="plain" @click="downloadFile(file)"></v-btn>
        </v-list-item>
      </v-list>
      <h3>Images</h3>
      <v-list>
        <v-list-item v-for="(dataUrl, index) in imageUrls" :key="index">
          <img :src="dataUrl" />
        </v-list-item>
      </v-list>
      <input-dialog
        :text="selectedTask?.label"
        :dialog="dialog"
        @cancel="dialog = false"
        @save="updateTask"
      ></input-dialog>
      <a ref="download" style="visibility: hidden"></a>
      <input ref="upload" type="file" style="visibility: hidden" @change="uploadFile($event)" />
    </div>
  </v-main>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { computedAsync } from '@vueuse/core';

import { useAppStore } from '@/store/app';
import { useSai } from '@/sai';
import { useCoreStore } from '@/store/core';
import { FileInstance, Task } from '@/models';

import InputDialog from '@/components/InputDialog.vue';

const download = ref<HTMLAnchorElement>();
const upload = ref<HTMLInputElement>();

const coreStore = useCoreStore();
const sai = useSai(coreStore.userId);

const route = useRoute();
const dialog = ref(false);

const selectedTask = ref<Task | null>(null);

const appStore = useAppStore();

const imageUrls = computedAsync(async () => Promise.all(appStore.images.map((image) => sai.dataUrl(image.id))));

watch(
  () => route.query.project,
  async (project) => {
    if (project && route.query.registration) {
      appStore.setCurrentProject(route.query.registration as string, project as string);
      appStore.loadTasks(project as string); // TODO

      appStore.loadFiles(project as string); // TODO
      appStore.loadImages(project as string); // TODO
    }
  },
  { immediate: true }
);

async function downloadFile(file: FileInstance) {
  if (download.value) {
    download.value.download = file.filename ?? 'file';
    download.value.href = await sai.dataUrl(file.id);
    download.value.click();
  }
}

function updateTask(label: string) {
  if (selectedTask.value) {
    appStore.updateTask({ ...selectedTask.value, label });
    selectedTask.value = null;
  } else if (label && appStore.currentProject) {
      const task = { id: 'DRAFT', label, project: appStore.currentProject.id, owner: appStore.currentProject.owner };
      appStore.updateTask(task);
    }
  dialog.value = false;
}

function deleteTask(task: Task) {
  if (window.confirm('Are you sure to delete')) {
    appStore.deleteTask(task);
  }
}

function newTask() {
  dialog.value = true;
}

function editTask(task: Task) {
  selectedTask.value = task;
  dialog.value = true;
}

function uploadFile(event: Event) {
  const target = event.target as HTMLInputElement;
  const blob = target.files?.item(0);
  if (blob && appStore.currentProject) {
    const file = { id: 'DRAFT', project: appStore.currentProject.id, owner: appStore.currentProject.owner };
    appStore.updateFile(file, blob);
  }
}
</script>
