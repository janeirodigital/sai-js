// Utilities
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { Agent, FileInstance, ImageInstance, Registration } from '@/models';
import { useCoreStore } from './core';
import { LdoBase } from '@ldo/ldo';
import { DataInstance } from '@janeirodigital/interop-data-model';
import { changeData as ldoChangeData, commitData, createSolidLdoDataset, type SolidLdoDataset } from "@ldo/solid"

import { getDefaultSession } from '@inrupt/solid-client-authn-browser';
import { Application, SaiEvent } from '@janeirodigital/interop-application';
import { ACL, RequestError, buildNamespace } from '@janeirodigital/interop-utils';
import { ProjectShapeType } from '../../ldo/Project$.shapeTypes';
import { TaskShapeType } from '../../ldo/Task$.shapeTypes';
import { Task } from '../../ldo/Task$.typings';
import { Project } from '../../ldo/Project$.typings';

const ownerIndex: { [key: string]: string } = {};

const NFO = buildNamespace('http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#');
const AWOL = buildNamespace('http://bblfish.net/work/atom-owl/2006-06-06/#');

const shapeTrees = {
  project: 'http://localhost:3000/shapetrees/trees/Project',
  task: 'http://localhost:3000/shapetrees/trees/Task',
  image: 'http://localhost:3000/shapetrees/trees/Image',
  file: 'http://localhost:3000/shapetrees/trees/File'
};

type RegistrationId = string;
type AgentId = string;
type ProjectId = string;

type ProjectInfo = {
  instance: DataInstance
  registration: RegistrationId
  agent: AgentId
}

type ProjectChildInfo = {
  instance: DataInstance
  agent: AgentId
  project: ProjectId
}

export const useAppStore = defineStore('app', () => {
  const projectInstances: Record<string, ProjectInfo> = {}
  const taskInstances: Record<string, ProjectChildInfo> = {}
  const imageInstances: Record<string, ProjectChildInfo> = {}
  const fileInstances: Record<string, ProjectChildInfo> = {}
  const coreStore = useCoreStore();
  const agents = ref<Agent[]>([]);
  const registrations = ref<Record<AgentId, Registration[]>>({});
  const tasks = ref<Record<ProjectId, Task[]>>({});
  const files = ref<FileInstance[]>([]);
  const images = ref<ImageInstance[]>([]);
  const currentAgent = ref<Agent>();
  const currentProject = ref<Project>();
  const saiError = ref<string | undefined>();
  
  let solidLdoDataset: SolidLdoDataset
  const ldoProjects = ref<Record<RegistrationId, Project[]>>({});
  const ldoTasks = ref<Record<ProjectId, Task[]>>({});

  async function loadAgents(force = false): Promise<void> {
    if (force || !agents.value.length) {
      agents.value = await getAgents();
    }
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

  async function loadProjects(ownerId: string): Promise<void> {
    if (registrations.value[ownerId]) return;
    
    const session = await ensureSaiSession();
    const user = session.dataOwners.find((agent) => agent.iri === ownerId);
    if (!user) {
      throw new Error(`data registration not found for ${ownerId}`);
    }
    const ldoOwnerProjects: Record<string, Project[]> = {};
    const ownerRegistration: Record<string, Registration[]> = {};
    ownerRegistration[ownerId] = [];
    for (const registration of user.selectRegistrations(shapeTrees.project)) {
      ownerRegistration[ownerId].push({
        id: registration.iri,
        label: 'TODO',
        owner: ownerId,
        canCreate: registration.grant.accessMode.includes(ACL.Create.value)
      });
      ldoOwnerProjects[registration.iri] = [];
      // eslint-disable-next-line no-await-in-loop
      for await (const dataInstance of registration.dataInstances) {
        projectInstances[dataInstance.iri] = {
          instance: dataInstance,
          agent: ownerId,
          registration: registration.iri
        }
        ownerIndex[dataInstance.iri] = ownerId;
        
        // @ldo-solid
        const ldoResource = solidLdoDataset.getResource(dataInstance.iri)
        const readResult = await ldoResource.read()
        if (readResult.isError) throw readResult

        const ldoSolidProject = solidLdoDataset
          .usingType(ProjectShapeType)
          .fromSubject(dataInstance.iri)
        ldoOwnerProjects[registration.iri].push(ldoSolidProject);
      }
    }

    ldoProjects.value = { ...ldoProjects.value, ...ldoOwnerProjects };
    registrations.value = { ...registrations.value, ...ownerRegistration };
  }

  async function loadTasks(projectId: string): Promise<void> {
    await ensureSaiSession();
    const project = projectInstances[projectId];
    if (!project) {
      throw new Error(`Project not found for: ${projectId}`);
    }
    const ldoProjectTasks = [];
    for await (const dataInstance of project.instance.getChildInstancesIterator(shapeTrees.task)) {
      taskInstances[dataInstance.iri] = {
        instance: dataInstance,
        agent: project.agent,
        project: projectId
      }

      // @ldo-solid
      const ldoResource = solidLdoDataset.getResource(dataInstance.iri)
      const readResult = await ldoResource.read()
      if (readResult.isError) throw readResult

      const ldoSolidTask = solidLdoDataset
        .usingType(TaskShapeType)
        .fromSubject(dataInstance.iri)
      ldoProjectTasks.push(ldoSolidTask);
    }

    ldoTasks.value[projectId] = ldoProjectTasks
  }
  
  async function draftTask(projectId: string): Promise<Task> {
    const projectInfo = projectInstances[projectId]
    const newTaskInstance = await projectInfo.instance.newChildDataInstance(shapeTrees.task)
    taskInstances[newTaskInstance.iri] = {
      instance: newTaskInstance,
      agent: projectInfo.agent,
      project: projectInfo.instance.iri
    }
    const ldoSolidTask = solidLdoDataset
      .usingType(TaskShapeType)
      .fromSubject(newTaskInstance.iri)
    ldoTasks.value[projectId].push(ldoSolidTask);
    return ldoSolidTask
    // return solidLdoDataset.createData(TaskShapeType, newTaskInstance.iri, ldoResource)
  }

  async function updateTask(task: Task) {
    await ensureSaiSession();
    if (!task['@id']) throw task
    const info = getProjectChildInfo(task['@id'])
    const project = projectInstances[info.project];
    if (!project) {
      throw new Error(`project not found ${info.project}`);
    }
    const instance = taskInstances[task['@id']];
    if (!instance) {
      throw new Error(`Data Instance not found for: ${task['@id']}`);
    }

    const ldoProject = ldoProjects.value[project.registration]
      .find(p => p['@id'] === project.instance.iri)
    if (!ldoProject) throw new Error(`ldo project not found: ${project.instance.iri}`)
    const isDraft = !ldoProject.hasTask?.find(t => t['@id'] === task['@id'])
    if (isDraft) {
      // add reference to new task
      const cProject = changeData(ldoProject)
      if (!cProject.hasTask) cProject.hasTask = []
      cProject.hasTask.push({ '@id': task['@id'] })
      const result = await commitData(cProject)
      if (result.isError) throw result
    }
    const result = await commitData(task)
    if (result.isError) throw result

    const indexToUpdate = ldoTasks.value[info.project].findIndex((t) => t['@id'] === task['@id']);
    if (indexToUpdate === -1) throw new Error(`task not found: ${task['@id']}`)
    // trigger effects
    const same = ldoTasks.value[info.project][indexToUpdate];
    delete ldoTasks.value[info.project][indexToUpdate]
    ldoTasks.value[info.project][indexToUpdate] = same
  }

  async function deleteTask(task: Task) {
    await ensureSaiSession();
    if (!task['@id']) throw task
    const info = getProjectChildInfo(task['@id'])
    const toDelete = tasks.value[info.project].find((t) => t['@id'] === task['@id']);
    if (!toDelete) {
      throw new Error(`task not found: ${task['@id']}`);
    }
    tasks.value[info.project].splice(tasks.value[info.project].indexOf(toDelete), 1);

    const instance = taskInstances[task['@id']].instance;
    await instance.delete();
    delete taskInstances[task['@id']];
  }

  async function loadFiles(projectId: string): Promise<void> {
    const data = await getFiles(projectId);
    files.value = data.files;
  }

  async function updateFile(file: FileInstance, blob?: File) {
    await ensureSaiSession();
    let instance: DataInstance;
    if (file.id !== 'DRAFT') {
      const cached = fileInstances[file.id];
      if (!cached) {
        throw new Error(`Data Instance not found for: ${file.id}`);
      }
      instance = cached.instance;
    } else {
      if (!blob) {
        throw new Error(`image file missing`);
      }
      const project = fileInstances[file.project];
      if (!project) {
        throw new Error(`project not found ${file.project}`);
      }
  
      instance = await project.instance.newChildDataInstance(shapeTrees.file);
      instance.replaceValue(NFO.fileName, blob.name);
      instance.replaceValue(AWOL.type, blob.type);
      fileInstances[instance.iri] ={
        instance,
        agent: project.agent,
        project: project.instance.iri
      }
    }
  
    const updated = instance2File(instance, file.project, file.owner);

    if (file.id === 'DRAFT') {
      files.value.push(updated);
    } else {
      const toUpdate = files.value.find((t) => t.id === file.id);
      if (!toUpdate) {
        throw new Error(`task not found: ${file.id}`);
      }
      toUpdate.filename = updated.filename;
    }
    // update(updated.id, blob);
  }

  async function loadImages(projectId: string): Promise<void> {
    const data = await getImages(projectId);
    images.value = data.images;
  }

  function setCurrentAgent(agentId: string) {
    currentAgent.value = agents.value.find((a) => a.id === agentId);
  }

  function setCurrentProject(registrationId: string, projectId: string) {
    currentProject.value = ldoProjects.value[registrationId]?.find((p) => p['@id'] === projectId);
  }

  async function shareProject(projectId: string) {
    share(projectId);
  }


  function changeData<Type extends LdoBase>(input: Type): Type {
    const resource = solidLdoDataset.getResource(input['@id']);
    return ldoChangeData(input, resource);

  }

  function getProjectChildInfo(id: string): ProjectChildInfo {
    return taskInstances[id] || imageInstances[id] || fileInstances[id]
  }
  
  function getInfo(id: string): ProjectInfo | ProjectChildInfo {
    return projectInstances[id] || getProjectChildInfo(id)
  }

  function canUpdate(id: string): boolean {
    const info = getInfo(id)
    return info.instance.accessMode.includes(ACL.Update.value)
  }
  
  function canDelete(id: string): boolean {
    const info = getInfo(id)
    return info.instance.accessMode.includes(ACL.Delete.value)
  }

  function canAddTasks(id: string): boolean {
    const info = projectInstances[id]
    return info.instance.findChildGrant(shapeTrees.task)?.accessMode.includes(ACL.Create.value)
  }

  function canAddImages(id: string): boolean {
    const info = projectInstances[id]
    return info.instance.findChildGrant(shapeTrees.image)?.accessMode.includes(ACL.Create.value)
  }

  function canAddFiles(id: string): boolean {
    const info = projectInstances[id]
    return info.instance.findChildGrant(shapeTrees.file)?.accessMode.includes(ACL.Create.value)
  }

  function getAgentId(id: string): string {
    return getInfo(id).agent
  }

  function getRegistrationId(id: string): string {
    return projectInstances[id].registration
  }

  function instance2File(instance: DataInstance, project: string, owner: string): FileInstance {
    return {
      id: instance.iri,
      filename: instance.getObject(NFO.fileName)?.value,
      project,
      owner,
    };
  }

  async function authorize() {
    if (!coreStore.userId) {
      throw new Error('no user id');
    }
    window.location.href = await getAuthorizationRedirectUri();
  }

  let saiSession: Application | undefined;

  const authnFetch = getDefaultSession().fetch;

  async function ensureSaiSession(): Promise<Application> {
    if (!coreStore.userId) {
      throw new Error('no user id');
    }
    if (saiSession) return saiSession;
    const deps = { fetch: authnFetch, randomUUID: crypto.randomUUID.bind(crypto) };
    try {
      saiSession = await Application.build(coreStore.userId, import.meta.env.VITE_APPLICATION_ID, deps);
    } catch (err) {
      if (err instanceof RequestError) {
        saiError.value = err.message;
        if (err.response) console.error(err.response);
      }
      throw err
    }
    solidLdoDataset = createSolidLdoDataset({ fetch: authnFetch})
    return saiSession;
  }

  async function getStream(): Promise<ReadableStream<SaiEvent>> {
    const session = await ensureSaiSession();
    return session.stream;
  }

  async function checkAuthoriztion(): Promise<boolean> {
    const session = await ensureSaiSession();
    return !!session.hasApplicationRegistration?.hasAccessGrant.granted;
  }

  async function getAuthorizationRedirectUri(): Promise<string> {
    const session = await ensureSaiSession();
    return session.authorizationRedirectUri;
  }

  async function share(resourceId: string) {
    const session = await ensureSaiSession();
    const shareUri = session.getShareUri(resourceId);
    if (!shareUri) throw new Error('shareUri is undefined');
    window.localStorage.setItem('restorePath', `${window.location.pathname}${window.location.search}`);
    window.location.href = shareUri;
  }

  async function getAgents(): Promise<Agent[]> {
    const session = await ensureSaiSession();

    const profiles = await Promise.all(
      session.dataOwners.map((owner) => session.factory.readable.webIdProfile(owner.iri))
    );

    return profiles.map((profile) => ({
      id: profile.iri,
      label: profile.label ?? 'unknown' // TODO think of a better fallback
    }));
  }

  async function getFiles(projectId: string): Promise<{ projectId: string; files: FileInstance[] }> {
    await ensureSaiSession();
    const project = projectInstances[projectId];
    if (!project) {
      throw new Error(`Project not found for: ${projectId}`);
    }
    const files = [];
    for await (const instance of project.instance.getChildInstancesIterator(shapeTrees.file)) {
      fileInstances[instance.iri] = {
        instance,
        agent: project.agent,
        project: project.instance.iri
      }
      files.push(instance2File(instance, projectId, ownerIndex[projectId]));
    }

    return { projectId, files };
  }

  async function getImages(projectId: string): Promise<{ projectId: string; images: ImageInstance[] }> {
    await ensureSaiSession();
    const project = projectInstances[projectId];
    if (!project) {
      throw new Error(`Project not found for: ${projectId}`);
    }
    const images = [];
    for await (const instance of project.instance.getChildInstancesIterator(shapeTrees.image)) {
      imageInstances[instance.iri] = {
        instance,
        agent: project.agent,
        project: project.instance.iri
      }
      images.push(instance2File(instance, projectId, ownerIndex[projectId]));
    }

    return { projectId, images };
  }

  async function dataUrl(url: string): Promise<string> {
    const { fetch } = getDefaultSession();
    return fetch(url)
      .then((response) => response.blob())
      .then((blb) => URL.createObjectURL(blb));
  }


  return {
    agents,
    currentAgent,
    currentProject,
    registrations,
    tasks,
    files,
    images,
    setCurrentAgent,
    setCurrentProject,
    shareProject,
    watchSai,
    loadAgents,
    loadProjects,
    loadTasks,
    updateTask,
    deleteTask,
    loadFiles,
    updateFile,
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
    ldoProjects,
    ldoTasks,
    draftTask
  };
});
