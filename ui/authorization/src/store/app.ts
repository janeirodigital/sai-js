// Utilities
import { reactive, ref } from 'vue';
import { defineStore } from 'pinia';
import {
  Resource,
  AuthorizationData,
  SocialAgent,
  Application,
  ShareAuthorization,
  ShareAuthorizationConfirmation,
  Authorization,
  AccessAuthorization,
  DataInstance,
  DataRegistry,
  AgentType
} from '@janeirodigital/sai-api-messages';
import { useBackend } from '@/backend';

export const useAppStore = defineStore('app', () => {
  const lang = ref('en');
  const resource = ref<Resource | null>(null);
  const shareAuthorizationConfirmation = ref<ShareAuthorizationConfirmation | null>(null);
  const authorizationData = ref<AuthorizationData | null>(null);
  const accessAuthorization = ref<AccessAuthorization | null>(null);
  const socialAgentList = ref<SocialAgent[]>([]);
  const application = ref<Partial<Application> | undefined>();
  const loadedDataInstances = reactive<Record<string, DataInstance[]>>({});
  const applicationList = ref<Application[]>([]);
  const dataRegistryList = reactive<Record<string, DataRegistry[]>>({});

  const backend = useBackend();

  async function getResource(resourceId: string) {
    resource.value = await backend.getResource(resourceId, lang.value);
  }

  async function shareResource(shareAuthorization: ShareAuthorization) {
    shareAuthorizationConfirmation.value = await backend.shareResource(shareAuthorization);
  }

  async function getAuthoriaztion(agentId: string, agentType: AgentType) {
    authorizationData.value = await backend.getAuthorization(agentId, agentType, lang.value);
  }

  // TODO rename list with load
  async function listDataInstances(agentId: string, registrationId: string) {
    const dataInstances = await backend.listDataInstances(agentId, registrationId);
    loadedDataInstances[registrationId] = [...dataInstances];
  }

  async function listApplications(force = false) {
    if (!applicationList.value.length || force) {
      applicationList.value = await backend.listApplications();
    }
  }

  async function listSocialAgents(force = false) {
    if (!socialAgentList.value.length || force) {
      socialAgentList.value = await backend.listSocialAgents();
    }
  }

  async function authorizeApp(authorization: Authorization) {
    accessAuthorization.value = await backend.authorizeApp(authorization);
    listApplications(true);
    listSocialAgents(true);
  }

  async function requestAccess(applicationId: string, agentId: string) {
    await backend.requestAccess(applicationId, agentId);
    listSocialAgents(true);
  }

  async function getApplication(applicationId: string) {
    application.value = await backend.getApplication(applicationId);
  }

  async function listDataRegistries(agentId: string, lang = 'en') {
    if (!dataRegistryList.length) {
      const dataRegistries = await backend.listDataRegistires(agentId, lang);
      dataRegistryList[agentId] = [...dataRegistries];
    }
  }

  return {
    lang,
    resource,
    authorizationData,
    accessAuthorization,
    loadedDataInstances,
    socialAgentList,
    application,
    applicationList,
    dataRegistryList,
    shareAuthorizationConfirmation,
    getResource,
    shareResource,
    getAuthoriaztion,
    listDataInstances,
    authorizeApp,
    requestAccess,
    listSocialAgents,
    getApplication,
    listApplications,
    listDataRegistries
  };
});
