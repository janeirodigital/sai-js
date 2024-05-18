/* eslint-disable no-continue, no-await-in-loop */

import { ref, shallowRef, triggerRef } from 'vue';
import { useStorage } from '@vueuse/core';
import { defineStore } from 'pinia';
import { LdoBase } from '@ldo/ldo';
import { changeData as ldoChangeData, commitData, createSolidLdoDataset, type SolidLdoDataset } from '@ldo/solid';
import { getDefaultSession } from '@inrupt/solid-client-authn-browser';
import { Application, SaiEvent } from '@janeirodigital/interop-application';
import { RequestError } from '@janeirodigital/interop-utils';
import { Agent, ResourceServer } from '@/models';
import { useCoreStore } from './core';
import { ProjectShapeType } from '../../ldo/Project$.shapeTypes';
import { TaskShapeType } from '../../ldo/Task$.shapeTypes';
import { FileShapeType } from '../../ldo/File$.shapeTypes';
import { Task } from '../../ldo/Task$.typings';
import { Project } from '../../ldo/Project$.typings';
import { File as FileObject } from '../../ldo/File$.typings';

const scopes = {
  project: 'http://localhost:3000/shapetrees/trees/Project',
  task: 'http://localhost:3000/shapetrees/trees/Task',
  image: 'http://localhost:3000/shapetrees/trees/Image',
  file: 'http://localhost:3000/shapetrees/trees/File'
};

type AgentId = string;

export const useAppStore = defineStore('app', () => {
  const subscriptions = useStorage<Map<string, string>>('subscriptions', new Map());
  const coreStore = useCoreStore();
  const agents = ref<Agent[]>([]);
  const resourceServers = ref<Record<AgentId, ResourceServer[]>>({});
  const currentAgent = ref<Agent>();
  const currentProject = shallowRef<Project>();
  const saiError = ref<string | undefined>();
  const pushSubscription = ref<PushSubscription | null>(null);

  // TODO: find a better way to ensure it was created
  let session: Application;
  let solidLdoDataset: SolidLdoDataset;
  const projects = ref<Project[]>([]);

  const authnFetch = getDefaultSession().fetch;

  async function ensureSaiSession(): Promise<Application> {
    if (!coreStore.userId) {
      throw new Error('no user id');
    }
    if (session) return session;
    const deps = { fetch: authnFetch, randomUUID: crypto.randomUUID.bind(crypto) };
    try {
      session = await Application.build(coreStore.userId, import.meta.env.VITE_APPLICATION_ID, deps);
    } catch (err) {
      if (err instanceof RequestError) {
        saiError.value = err.message;
        if (err.response) console.error(err.response);
      }
      throw err;
    }
    solidLdoDataset = createSolidLdoDataset({ fetch: authnFetch });
    return session;
  }

  function changeData<Type extends LdoBase>(input: Type): Type {
    const resource = solidLdoDataset.getResource(input['@id']);
    return ldoChangeData(input, resource);
  }

  async function loadAgents(force = false): Promise<void> {
    if (agents.value.length && !force) return;
    const session = await ensureSaiSession();
    const profiles = await Promise.all(
      [...session.resourceOwners()].map((owner) => session.factory.readable.webIdProfile(owner))
    );

    agents.value = profiles.map((profile) => ({
      id: profile.iri,
      label: profile.label ?? 'unknown' // TODO think of a better fallback
    }));
  }

  function projectsFor(resourceServer: string): Project[] {
    return projects.value.filter(
      (project) => session.parentMap.get(project['@id']!)?.resourceServer === resourceServer
    );
  }

  async function loadProjects(ownerId: string): Promise<void> {
    if (resourceServers.value[ownerId]) return;

    await ensureSaiSession();
    const servers: ResourceServer[] = [];
    const scope = scopes.project;
    for (const resourceServer of session.resourceServers(ownerId, scope)) {
      servers.push({
        id: resourceServer,
        label: resourceServer, // TODO replace with human readabel label
        owner: ownerId,
        canCreate: session.canCreate(resourceServer, scope)
      });
      const serverProjects: Project[] = [];
      // eslint-disable-next-line no-await-in-loop
      for await (const projectId of await session.resources(resourceServer, scope)) {
        // @ldo-solid
        const ldoResource = solidLdoDataset.getResource(projectId);
        const readResult = await ldoResource.read();
        if (readResult.isError) throw readResult;

        const ldoSolidProject = solidLdoDataset.usingType(ProjectShapeType).fromSubject(projectId);
        serverProjects.push(ldoSolidProject);
      }
      projects.value = [...projects.value, ...serverProjects];
    }
    resourceServers.value[ownerId] = servers;
  }

  const propForScope = {
    [scopes.task]: 'hasTask',
    [scopes.image]: 'hasImage',
    [scopes.file]: 'hasFile'
  };

  function findProject(projectId: string): Project {
    const ldoProject = projects.value.find((project) => project['@id'] === projectId);
    if (!ldoProject) {
      throw new Error(`LDO Project not found for: ${projectId}`);
    }
    return ldoProject;
  }

  async function loadChildren(projectId: string, scope: string, nonRdf = false): Promise<void> {
    await ensureSaiSession();
    const ldoProject = findProject(projectId);

    // @ts-expect-error
    for (const { '@id': childId } of ldoProject[propForScope[scope]]) {
      let description: string | undefined;
      if (nonRdf) {
        description = await session.discoverDescription(childId);
        if (!description) continue;
      }

      // @ldo-solid
      const ldoResource = solidLdoDataset.getResource(nonRdf ? description : childId);
      const readResult = await ldoResource.read();
      if (readResult.isError) throw readResult;
      session.setChildInfo(childId, scope, ldoProject['@id']!);
    }
  }

  async function loadTasks(projectId: string): Promise<void> {
    await loadChildren(projectId, scopes.task);
    triggerRef(currentProject);
  }

  async function loadImages(projectId: string): Promise<void> {
    await loadChildren(projectId, scopes.image, true);
    triggerRef(currentProject);
  }

  async function loadFiles(projectId: string): Promise<void> {
    await loadChildren(projectId, scopes.file, true);
    triggerRef(currentProject);
  }

  async function draftTask(projectId: string): Promise<Task> {
    await ensureSaiSession();
    const iri = session.iriForChild(projectId, scopes.task);
    const ldoSolidTask = solidLdoDataset.usingType(TaskShapeType).fromSubject(iri);
    return ldoSolidTask;
  }

  async function updateTask(task: Task) {
    await ensureSaiSession();
    if (!task['@id']) throw task;
    const projectId = session.findParent(task['@id']!);
    const ldoProject = findProject(projectId);
    const isDraft = !ldoProject.hasTask?.find((t) => t['@id'] === task['@id']);
    if (isDraft) {
      // add reference to new task
      const cProject = changeData(ldoProject);
      // @ts-expect-error
      cProject.hasTask.push({ '@id': task['@id'] });
      const result = await commitData(cProject);
      if (result.isError) throw result;
    }
    const result = await commitData(task);
    if (result.isError) throw result;
    triggerRef(currentProject);
  }

  async function deleteTask(task: Task) {
    await ensureSaiSession();
    if (!task['@id']) throw task;

    // @ldo-solid
    const ldoResource = solidLdoDataset.getResource(task['@id']);
    const deleteResult = await ldoResource.delete();
    if (deleteResult.isError) throw deleteResult;

    const projectId = session.findParent(task['@id']!);
    const ldoProject = findProject(projectId);
    // remove reference from the project
    const cProject = changeData(ldoProject);
    // @ts-expect-error
    const taskIndex = cProject.hasTask.findIndex((t) => t['@id'] === task['@id']);
    // @ts-expect-error
    delete cProject.hasTask[taskIndex];
    const result = await commitData(cProject);
    if (result.isError) throw result;
    triggerRef(currentProject);
  }

  async function upload(projectId: string, blob: File, scope: string) {
    await ensureSaiSession();
    const ldoProject = findProject(projectId);

    const fileId = session.iriForChild(projectId, scope);

    // add reference from project to new file
    const cProject = changeData(ldoProject);
    // @ts-expect-error
    cProject[propForScope[scope]].push({ '@id': fileId });
    const projectResult = await commitData(cProject);
    if (projectResult.isError) throw projectResult;

    // upload file
    const { ok } = await session.rawFetch(fileId, {
      method: 'PUT',
      headers: { 'Content-Type': blob.type },
      body: blob
    });

    if (!ok) {
      throw new Error('failed to upload file');
    }

    // update description resource
    // must be done after the file was uploaded!
    const descriptionIri = await session.discoverDescription(fileId);
    if (!descriptionIri) throw new Error(`no description resource for ${fileId}`);
    const newFile = solidLdoDataset.usingType(FileShapeType).fromSubject(fileId);

    const resource = solidLdoDataset.getResource(descriptionIri);
    const cFile = ldoChangeData(newFile, resource);
    cFile.fileName = blob.name;
    cFile.format = blob.type;

    const fileResult = await commitData(cFile);
    if (fileResult.isError) throw fileResult;
    triggerRef(currentProject);
  }

  async function uploadFile(e: Event): Promise<void> {
    const target = e.target as HTMLInputElement;
    const blob = target.files?.item(0);
    if (blob && currentProject.value) {
      upload(currentProject.value['@id']!, blob, scopes.file);
    }
  }

  async function uploadImage(e: Event): Promise<void> {
    const target = e.target as HTMLInputElement;
    const blob = target.files?.item(0);
    if (blob && currentProject.value) {
      upload(currentProject.value['@id']!, blob, scopes.image);
    }
  }

  function getFileObject(id: string): FileObject {
    return solidLdoDataset.usingType(FileShapeType).fromSubject(id);
  }

  function setCurrentAgent(agentId: string) {
    currentAgent.value = agents.value.find((a) => a.id === agentId);
  }

  function setCurrentProject(resourceServer: string, projectId: string) {
    currentProject.value = projects.value.find((p) => p['@id'] === projectId);
  }

  function canUpdate(id: string): boolean {
    return session.canUpdate(id);
  }

  function canDelete(id: string): boolean {
    return session.canDelete(id);
  }

  function canAddTasks(id: string): boolean {
    return session.canCreateChild(id, scopes.task);
  }

  function canAddImages(id: string): boolean {
    return session.canCreateChild(id, scopes.image);
  }

  function canAddFiles(id: string): boolean {
    return session.canCreateChild(id, scopes.file);
  }

  async function checkAuthoriztion(): Promise<boolean> {
    await ensureSaiSession();
    return !!session.hasApplicationRegistration?.hasAccessGrant.granted;
  }

  async function getAuthorizationRedirectUri(): Promise<string> {
    await ensureSaiSession();
    return session.authorizationRedirectUri;
  }

  async function authorize() {
    if (!coreStore.userId) {
      throw new Error('no user id');
    }
    window.location.href = await getAuthorizationRedirectUri();
  }

  async function share(resourceId: string) {
    await ensureSaiSession();
    const shareUri = session.getShareUri(resourceId);
    if (!shareUri) throw new Error('shareUri is undefined');
    window.localStorage.setItem('restorePath', `${window.location.pathname}${window.location.search}`);
    window.location.href = shareUri;
  }

  async function shareProject(projectId: string) {
    share(projectId);
  }

  async function dataUrl(url: string): Promise<string> {
    const { fetch } = getDefaultSession();
    return fetch(url)
      .then((response) => response.blob())
      .then((blb) => URL.createObjectURL(blb));
  }

  async function getStream(): Promise<ReadableStream<SaiEvent>> {
    await ensureSaiSession();
    return session.stream;
  }

  // DO NOT AWAIT! (infinite loop)
  async function watchSai(): Promise<void> {
    const stream = await getStream();
    if (stream.locked) return;
    const reader = stream.getReader();
    // eslint-disable-next-line no-constant-condition
    while (true) {
      // eslint-disable-next-line no-await-in-loop
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      if (value.type === 'GRANT') loadAgents(true);
    }
  }

  async function getPushSubscription() {
    if (pushSubscription.value) return;
    const resourceServer = await navigator.serviceWorker.ready;
    const subscription = await resourceServer.pushManager.getSubscription();
    if (subscription) {
      pushSubscription.value = subscription;
    }
  }

  async function enableNotifications() {
    await ensureSaiSession();
    if (!session.webPushService) {
      return null;
    }
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      const resourceServer = await navigator.serviceWorker.ready;
      let subscription = await resourceServer.pushManager.getSubscription();
      if (!subscription) {
        subscription = await resourceServer.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: session.webPushService?.vapidPublicKey
        });
      }
      pushSubscription.value = subscription;
    }
    return result;
  }

  async function subscribeViaPush(id: string): Promise<void> {
    await ensureSaiSession();
    await getPushSubscription();
    const channel = await session.subscribeViaPush(pushSubscription.value!, id);
    const project = projects.value.find((p) => p['@id'] === id);
    // also all the tasks
    const taskChannels = await Promise.all(
      // @ts-expect-error
      project.hasTask.map((task) => session.subscribeViaPush(pushSubscription.value!, task['@id']))
    );
    subscriptions.value.set(id, channel.id);
    for (const taskChannel of taskChannels) {
      subscriptions.value.set(taskChannel.topic as string, taskChannel.id);
    }
  }

  async function unsubscribeViaPush(id: string): Promise<void> {
    await ensureSaiSession();
    const channelId = subscriptions.value.get(id);
    if (!channelId) throw new Error('channel not found');
    const response = await session.rawFetch(channelId, { method: 'DELETE' });
    if (!response.ok) throw new Error('failed to unsubscribe');
    const project = projects.value.find((p) => p['@id'] === id);
    const result = (await Promise.all(
      // @ts-expect-error
      project?.hasTask.map((task) => session.unsubscribeFromPush(task['@id'], subscriptions.value.get(task['@id'])))
    )) as boolean[];
    if (result.includes(false)) throw new Error('failed to unsubscribe some of the tasks');
    subscriptions.value.delete(id);
    // @ts-expect-error
    project?.hasTask.forEach((task) => subscriptions.value.delete(task['@id']));
  }

  return {
    pushSubscription,
    subscriptions,
    getPushSubscription,
    enableNotifications,
    subscribeViaPush,
    unsubscribeViaPush,
    agents,
    currentAgent,
    currentProject,
    resourceServers,
    setCurrentAgent,
    setCurrentProject,
    shareProject,
    watchSai,
    loadAgents,
    projectsFor,
    loadProjects,
    loadTasks,
    updateTask,
    deleteTask,
    loadFiles,
    uploadFile,
    uploadImage,
    loadImages,
    changeData,
    authorize,
    getStream,
    saiError,
    getAuthorizationRedirectUri,
    checkAuthoriztion,
    share,
    dataUrl,
    canUpdate,
    canDelete,
    canAddTasks,
    canAddImages,
    canAddFiles,
    draftTask,
    getFileObject
  };
});
