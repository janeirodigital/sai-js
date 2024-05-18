<template>
  <v-main>
    <div v-if="appStore.currentProject">
      <h3>
        Tasks
        <v-btn
          v-if="appStore.canAddTasks(appStore.currentProject['@id']!)"
          size="small"
          color="surface-variant"
          variant="text"
          icon="mdi-plus"
          @click="newTask"
        ></v-btn>
      </h3>
      <v-list>
        <v-list-item v-for="task of (appStore.currentProject.hasTask as Task[])" :key="task['@id']">
          <v-card v-if="task.label">
            <v-card-title>{{ task.label }}</v-card-title>
            <v-card-actions>
              <v-btn
                v-if="appStore.canUpdate(task['@id']!)"
                size="small"
                color="surface-variant"
                variant="text"
                icon="mdi-square-edit-outline"
                @click="editTask(task)"
              ></v-btn>
              <v-btn
                v-if="appStore.canDelete(task['@id']!)"
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
          v-if="appStore.canAddFiles(appStore.currentProject['@id']!)"
          size="small"
          color="surface-variant"
          variant="text"
          icon="mdi-plus"
          @click="fileUpload?.click()"
        ></v-btn>
      </h3>
      <v-list>
        <v-list-item v-for="file of files" :key="file['@id']">
            {{ file.fileName }}
            <v-btn icon="mdi-download" variant="plain" @click="downloadFile(file)"></v-btn>
        </v-list-item>
      </v-list>
      <h3>
        Images
        <v-btn
          v-if="appStore.canAddImages(appStore.currentProject['@id']!)"
          size="small"
          color="surface-variant"
          variant="text"
          icon="mdi-plus"
          @click="imageUpload?.click()"
        ></v-btn>

      </h3>
      <v-list>
        <v-list-item v-for="(dataUrl, index) in imageUrls" :key="index">
          <img :src="dataUrl" style="width: 100%;">
        </v-list-item>
      </v-list>
      <input-dialog
        :text="selectedTask?.label"
        :dialog="dialog"
        @cancel="dialog = false"
        @save="updateTask"
      ></input-dialog>
      <a ref="download" style="visibility: hidden"></a>
      <input ref="fileUpload" type="file" style="visibility: hidden" @change="appStore.uploadFile($event)" />
      <input ref="imageUpload" type="file" style="visibility: hidden" @change="appStore.uploadImage($event)" />
    </div>
  </v-main>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { computedAsync } from '@vueuse/core';

import { useAppStore } from '@/store/app';

import InputDialog from '@/components/InputDialog.vue';
import { Task } from '../../ldo/Task$.typings'
import { File as FileObject } from '../../ldo/File$.typings'


const download = ref<HTMLAnchorElement>();
const fileUpload = ref<HTMLInputElement>();
const imageUpload = ref<HTMLInputElement>();

const route = useRoute();
const dialog = ref(false);

const selectedTask = ref<Task | null>(null);

const appStore = useAppStore();

// eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
const imageUrls = computedAsync(async () => Promise.all(appStore.currentProject?.hasImage?.map(({ '@id': id }) => appStore.dataUrl(id)) || []));

const files = computed(() => appStore.currentProject?.hasFile?.map(({ '@id': id }) => appStore.getFileObject(id)) || [])

watch(
  () => route.query.project,
  async (project) => {
    if (project && route.query.resourceServer) {
      appStore.setCurrentProject(route.query.resourceServer as string, project as string);
      appStore.loadTasks(project as string);
      appStore.loadFiles(project as string);
      appStore.loadImages(project as string);
    }
  },
  { immediate: true }
);

async function downloadFile(file: FileObject) {
  if (download.value) {
    download.value.download = file.fileName ?? 'file';
    download.value.href = await appStore.dataUrl(file['@id']!);
    download.value.click();
  }
}

async function updateTask(label: string) {
  let cTask: Task
  if (selectedTask.value) {
    cTask = appStore.changeData(selectedTask.value);
  } else {
    const newTask = await appStore.draftTask(appStore.currentProject!['@id']!)
    cTask = appStore.changeData(newTask);
  }
  cTask.label = label;
  appStore.updateTask(cTask);
  selectedTask.value = null;
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
</script>
