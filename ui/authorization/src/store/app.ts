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
  DataRegistry
} from '@janeirodigital/sai-api-messages';
import { useBackend } from '@/backend';

export const useAppStore = defineStore('app', () => {
  const lang = ref('en');
  const resource = ref<Resource | null>(null);
  const shareAuthorizationConfirmation = ref<ShareAuthorizationConfirmation | null>(null);
  const authorizationData = ref<AuthorizationData | null>(null);
  const accessAuthorization = ref<AccessAuthorization | null>(null);
  const socialAgentList = ref<SocialAgent[]>([]);
  const application = ref<Partial<Application> | null>(null);
  const loadedDataInstances = reactive<DataInstance[]>([]);
  const applicationList = reactive<Application[]>([]);
  const dataRegistryList = reactive<DataRegistry[]>([]);

  const backend = useBackend();

  async function getResource(resourceId: string) {
    resource.value = await backend.getResource(resourceId, lang.value);
  }

  async function shareResource(shareAuthorization: ShareAuthorization) {
    shareAuthorizationConfirmation.value = await backend.shareResource(shareAuthorization);
  }

  async function getAuthoriaztion(clientId: string) {
    authorizationData.value = await backend.getAuthorization(clientId, lang.value);
  }

  // TODO change to computed in component
  async function listDataInstances(registrationId: string) {
    const dataInstances = await backend.listDataInstances(registrationId);
    loadedDataInstances.push(...dataInstances);
    return dataInstances;
  }

  async function authorizeApp(authorization: Authorization) {
    accessAuthorization.value = await backend.authorizeApp(authorization);
  }

  async function listSocialAgents() {
    socialAgentList.value = await backend.listSocialAgents();
  }

  async function getApplication(applicationId: string) {
    application.value = await backend.getApplication(applicationId);
  }

  async function listApplications() {
    if (!applicationList.length) {
      const applications = await backend.listApplications();
      applicationList.push(...applications);
    }
  }

  async function listDataRegistries(lang = 'en') {
    if (!dataRegistryList.length) {
      const dataRegistries = await backend.listDataRegistires(lang);
      dataRegistryList.push(...dataRegistries);
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
    listSocialAgents,
    getApplication,
    listApplications,
    listDataRegistries
  };
});
