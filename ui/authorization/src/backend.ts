import { getDefaultSession } from '@inrupt/solid-client-authn-browser';
import {
  AccessAuthorization,
  AgentType,
  Application,
  ApplicationAuthorizationRequest,
  ApplicationAuthorizationResponse,
  ApplicationAuthorizationResponseMessage,
  ApplicationsRequest,
  ApplicationsResponse,
  ApplicationsResponseMessage,
  Authorization,
  AuthorizationData,
  DataInstance,
  DataRegistriesRequest,
  DataRegistriesResponse,
  DataRegistriesResponseMessage,
  DataRegistry,
  DescriptionsRequest,
  DescriptionsResponse,
  DescriptionsResponseMessage,
  IRI,
  ListDataInstancesRequest,
  ListDataInstancesResponse,
  ListDataInstancesResponseMessage,
  Request,
  RequestAccessUsingApplicationNeedsRequest,
  RequestAccessUsingApplicationNeedsResponse,
  Resource,
  ResourceRequest,
  ResourceResponse,
  ResponseMessage,
  ShareAuthorization,
  ShareAuthorizationConfirmation,
  ShareAuthorizationRequest,
  ShareAuthorizationResponse,
  ShareAuthorizationResponseMessage,
  SocialAgent,
  SocialAgentsRequest,
  SocialAgentsResponse,
  SocialAgentsResponseMessage,
  UnregisteredApplicationProfileRequest,
  UnregisteredApplicationProfileResponse,
  SocialAgentInvitation,
  CreateInvitationRequest,
  InvitationResponseMessage,
  SocialAgentInvitationResponse,
  AcceptInvitationRequest,
  SocialAgentResponseMessage,
  SocialAgentResponse,
  SocialAgentInvitationsRequest,
  SocialAgentInvitationsResponseMessage,
  SocialAgentInvitationsResponse
} from '@janeirodigital/sai-api-messages';

const backendBaseUrl = import.meta.env.VITE_BACKEND_BASE_URL;
const authnFetch = getDefaultSession().fetch;

async function checkServerSession(): Promise<{ isLoggedIn: boolean; redirectUrl?: string }> {
  const options = {
    method: 'POST'
  };
  const result = await authnFetch(`${backendBaseUrl}/login`, options);
  if (result.status === 204) return { isLoggedIn: true };
  if (result.status === 200) {
    const { redirectUrl } = await result.json();
    return { isLoggedIn: false, redirectUrl };
  }
  throw new Error(`login check failed, status = ${result.status}`);
}

async function getDataFromApi<T extends ResponseMessage>(request: Request): Promise<T> {
  const commonOptions = {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    }
  };
  const options = {
    ...commonOptions,
    body: request.stringify()
  };
  const response = await authnFetch(`${backendBaseUrl}/api`, options);
  return (await response.json()) as T;
}

async function getResource(resourceId: IRI, lang: string): Promise<Resource> {
  const request = new ResourceRequest(resourceId, lang);
  const data = await getDataFromApi<ResourceResponse>(request);
  const response = new ResourceResponse(data);
  return response.payload;
}

async function getAuthorization(agentId: IRI, agentType: AgentType, lang: string): Promise<AuthorizationData> {
  const request = new DescriptionsRequest(agentId, agentType, lang);
  const data = await getDataFromApi<DescriptionsResponseMessage>(request);
  const response = new DescriptionsResponse(data);
  return response.payload;
}

async function listDataInstances(agentId: IRI, registrationId: IRI): Promise<DataInstance[]> {
  const request = new ListDataInstancesRequest(agentId, registrationId);
  const data = await getDataFromApi<ListDataInstancesResponseMessage>(request);
  const response = new ListDataInstancesResponse(data);
  return response.payload;
}

async function authorizeApp(authorization: Authorization): Promise<AccessAuthorization> {
  const request = new ApplicationAuthorizationRequest(authorization);
  const data = await getDataFromApi<ApplicationAuthorizationResponseMessage>(request);
  const response = new ApplicationAuthorizationResponse(data);
  return response.payload;
}

async function requestAccess(applicationId: IRI, agentId: IRI): Promise<void> {
  const request = new RequestAccessUsingApplicationNeedsRequest(applicationId, agentId);
  await getDataFromApi<RequestAccessUsingApplicationNeedsResponse>(request);
}

async function listSocialAgents(): Promise<SocialAgent[]> {
  const request = new SocialAgentsRequest();
  const data = await getDataFromApi<SocialAgentsResponseMessage>(request);
  const response = new SocialAgentsResponse(data);
  return response.payload;
}

async function getApplication(applicationId: IRI): Promise<Partial<Application>> {
  const request = new UnregisteredApplicationProfileRequest(applicationId);
  const data = await getDataFromApi<UnregisteredApplicationProfileResponse>(request);
  const response = new UnregisteredApplicationProfileResponse(data);
  return response.payload;
}

async function listApplications(): Promise<Application[]> {
  const request = new ApplicationsRequest();
  const data = await getDataFromApi<ApplicationsResponseMessage>(request);
  const response = new ApplicationsResponse(data);
  return response.payload;
}

async function listDataRegistires(agentId: string, lang: string): Promise<DataRegistry[]> {
  const request = new DataRegistriesRequest(agentId, lang);
  const data = await getDataFromApi<DataRegistriesResponseMessage>(request);
  const response = new DataRegistriesResponse(data);
  return response.payload;
}

async function shareResource(shareAuthorization: ShareAuthorization): Promise<ShareAuthorizationConfirmation> {
  const request = new ShareAuthorizationRequest(shareAuthorization);
  const data = await getDataFromApi<ShareAuthorizationResponseMessage>(request);
  const response = new ShareAuthorizationResponse(data);
  return response.payload;
}

async function createInvitation(label: string, note?: string): Promise<SocialAgentInvitation> {
  const request = new CreateInvitationRequest(label, note);
  const data = await getDataFromApi<InvitationResponseMessage>(request);
  const response = new SocialAgentInvitationResponse(data);
  return response.payload;
}

async function listSocialAgentInvitations(): Promise<SocialAgentInvitation[]> {
  const request = new SocialAgentInvitationsRequest();
  const data = await getDataFromApi<SocialAgentInvitationsResponseMessage>(request);
  const response = new SocialAgentInvitationsResponse(data);
  return response.payload;
}

async function acceptInvitation(capabilityUrl: string, label: string, note?: string): Promise<SocialAgent> {
  const request = new AcceptInvitationRequest(capabilityUrl, label, note);
  const data = await getDataFromApi<SocialAgentResponseMessage>(request);
  const response = new SocialAgentResponse(data);
  return response.payload;
}

// TODO: use api messages
async function subscribeToPushNotifications(subscription: PushSubscription) {
  const options = {
    method: 'POST',
    body: JSON.stringify(subscription),
    headers: {
      'Content-Type': 'application/json'
    }
  };
  await authnFetch(`${backendBaseUrl}/push-subscribe`, options);
}

export function useBackend() {
  return {
    checkServerSession,
    getResource,
    shareResource,
    getAuthorization,
    listDataInstances,
    authorizeApp,
    requestAccess,
    listSocialAgents,
    getApplication,
    listApplications,
    listDataRegistires,
    createInvitation,
    listSocialAgentInvitations,
    acceptInvitation,
    subscribeToPushNotifications
  };
}
