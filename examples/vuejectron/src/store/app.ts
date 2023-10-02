// Utilities
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { Agent, FileInstance, ImageInstance, Project, Registration, Task } from '@/models';
import { useSai } from '@/sai';
import { useCoreStore } from './core';

export const useAppStore = defineStore('app', () => {
  const coreStore = useCoreStore();
  const agents = ref<Agent[]>([]);
  const projects = ref<Project[]>([]);
  const registrations = ref<Registration[]>([]);
  const tasks = ref<Task[]>([]);
  const files = ref<FileInstance[]>([]);
  const images = ref<ImageInstance[]>([]);

  // DO NOT AWAIT! (infinite loop)
  async function watchSai(): Promise<void> {
    const sai = useSai(coreStore.userId);
    const stream = await sai.getStream();
    if (stream.locked) return;
    const reader = stream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      if (value.type === 'GRANT') loadAgents();
    }
  }

  async function loadAgents(): Promise<void> {
    const sai = useSai(coreStore.userId);
    agents.value = await sai.getAgents();
  }

  async function loadProjects(ownerId: string): Promise<void> {
    const sai = useSai(coreStore.userId);
    const data = await sai.getProjects(ownerId);
    projects.value = data.projects;
    registrations.value = data.registrations;
  }

  async function loadTasks(projectId: string): Promise<void> {
    const sai = useSai(coreStore.userId);
    const data = await sai.getTasks(projectId);
    tasks.value = data.tasks;
  }

  async function updateTask(task: Task) {
    const sai = useSai(coreStore.userId);
    const updated = await sai.updateTask(task);

    if (task.id === 'DRAFT') {
      tasks.value.push(updated);
    } else {
      const toUpdate = tasks.value.find((t) => t.id === task.id);
      if (!toUpdate) {
        throw new Error(`task not found: ${task.id}`);
      }
      toUpdate.label = updated.label;
    }
    sai.update(updated.id);
  }

  function deleteTask(task: Task) {
    const toDelete = tasks.value.find((t) => t.id === task.id);
    if (!toDelete) {
      throw new Error(`task not found: ${task.id}`);
    }
    tasks.value.splice(tasks.value.indexOf(toDelete), 1);

    const sai = useSai(coreStore.userId);
    sai.deleteTask(task);
  }

  async function loadFiles(projectId: string): Promise<void> {
    const sai = useSai(coreStore.userId);
    const data = await sai.getFiles(projectId);
    files.value = data.files;
  }

  async function updateFile(file: FileInstance, blob?: File) {
    const sai = useSai(coreStore.userId);
    const updated = await sai.updateFile(file, blob);

    if (file.id === 'DRAFT') {
      files.value.push(updated);
    } else {
      const toUpdate = files.value.find((t) => t.id === file.id);
      if (!toUpdate) {
        throw new Error(`task not found: ${file.id}`);
      }
      toUpdate.filename = updated.filename;
    }
    sai.update(updated.id, blob);
  }

  async function loadImages(projectId: string): Promise<void> {
    const sai = useSai(coreStore.userId);
    const data = await sai.getImages(projectId);
    images.value = data.images;
  }

  return {
    agents,
    registrations,
    projects,
    tasks,
    files,
    images,
    watchSai,
    loadAgents,
    loadProjects,
    loadTasks,
    updateTask,
    deleteTask,
    loadFiles,
    updateFile,
    loadImages
  };
});
