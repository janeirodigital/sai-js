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
  AgentType,
  SocialAgentInvitation
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
  const invitationList = ref<SocialAgentInvitation[]>([]);

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

  async function listSocialAgentInvitations(force = false) {
    if (!invitationList.value.length || force) {
      invitationList.value = await backend.listSocialAgentInvitations();
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
    const dataRegistries = await backend.listDataRegistires(agentId, lang);
    dataRegistryList[agentId] = [...dataRegistries];
  }

  async function createInvitation(label: string, note?: string): Promise<SocialAgentInvitation> {
    const socialAgentInvitation = await backend.createInvitation(label, note);
    invitationList.value.push(socialAgentInvitation);
    return socialAgentInvitation;
  }

  async function acceptInvitation(capabilityUrl: string, label: string, note?: string): Promise<SocialAgent> {
    const socialAgent = await backend.acceptInvitation(capabilityUrl, label, note);
    listSocialAgents(true);
    return socialAgent;
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
    invitationList,
    getResource,
    shareResource,
    getAuthoriaztion,
    listDataInstances,
    authorizeApp,
    requestAccess,
    listSocialAgents,
    getApplication,
    listApplications,
    listDataRegistries,
    createInvitation,
    listSocialAgentInvitations,
    acceptInvitation
  };
});
