// Utilities
import { useBackend } from '@/backend';
import {
  Resource,
  AuthorizationData,
  SocialAgent,
  Application,
  ShareAuthorization,
  ShareAuthorizationConfirmation,
  Authorization,
  AccessAuthorization,
  DataInstance
} from '@janeirodigital/sai-api-messages';
import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';

export const useAppStore = defineStore('app', () => {
  const lang = ref('en');
  const resource = ref<Resource | null>(null);
  const shareAuthorizationConfirmation = ref<ShareAuthorizationConfirmation | null>(null);
  const authorizationData = ref<AuthorizationData | null>(null);
  const accessAuthorization = ref<AccessAuthorization | null>(null);
  const socialAgents = ref<SocialAgent[]>([]);
  const application = ref<Partial<Application> | null>(null);
  const loadedDataInstances = reactive<DataInstance[]>([]);

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

  async function getSocialAgents() {
    socialAgents.value = await backend.getSocialAgents();
  }

  async function getApplication(applicationId: string) {
    application.value = await backend.getApplication(applicationId);
  }

  return {
    lang,
    resource,
    authorizationData,
    accessAuthorization,
    loadedDataInstances,
    socialAgents,
    application,
    shareAuthorizationConfirmation,
    getResource,
    shareResource,
    getAuthoriaztion,
    listDataInstances,
    authorizeApp,
    getSocialAgents,
    getApplication
  };
});
