import * as S from 'effect/Schema';

import {
  AccessAuthorization,
  // AgentType,
  // Application,
  ApplicationAuthorizationRequest,
  ApplicationAuthorizationResponse,
  ApplicationAuthorizationResponseMessage,
  // ApplicationsRequest,
  // ApplicationsResponse,
  // ApplicationsResponseMessage,
  Authorization,
  // AuthorizationData,
  // DataInstance,
  // DataRegistriesRequest,
  // DataRegistriesResponse,
  // DataRegistriesResponseMessage,
  // DataRegistry,
  // DescriptionsRequest,
  // DescriptionsResponse,
  // DescriptionsResponseMessage,
  // ListDataInstancesRequest,
  // ListDataInstancesResponse,
  // ListDataInstancesResponseMessage,
  Request,
  RequestAccessUsingApplicationNeedsRequest,
  RequestAccessUsingApplicationNeedsResponse,
  // Resource,
  // ResourceRequest,
  // ResourceResponse,
  ResponseMessage,
  ShareAuthorization,
  ShareAuthorizationConfirmation,
  ShareAuthorizationRequest,
  ShareAuthorizationResponse,
  ShareAuthorizationResponseMessage,
  SocialAgentOld,
  // SocialAgentsRequest,
  // SocialAgentsResponse,
  // SocialAgentsResponseMessage,
  // UnregisteredApplicationProfileRequest,
  // UnregisteredApplicationProfileResponse,
  SocialAgentInvitation,
  CreateInvitationRequest,
  InvitationResponseMessage,
  SocialAgentInvitationResponse,
  AcceptInvitationRequest,
  SocialAgentResponseMessage,
  SocialAgentResponse
  // SocialAgentInvitationsRequest,
  // SocialAgentInvitationsResponseMessage,
  // SocialAgentInvitationsResponse,
} from '@janeirodigital/sai-api-messages';

const backendBaseUrl = import.meta.env.VITE_BACKEND_BASE_URL;

async function getDataFromApi<T extends ResponseMessage>(request: Request): Promise<T> {
  const response = await fetch(`${backendBaseUrl}/api`, {
    method: 'POST',
    body: request.stringify(),
    credentials: 'include',
    headers: {
      'content-type': 'application/json'
    }
  });
  return (await response.json()) as T;
}

// async function checkServerSession(subscription?: PushSubscription): Promise<LoginStatus> {
//   const request = new HelloRequest(subscription);
//   const data = await getDataFromApi<HelloResponseMessage>(request);
//   const response = new HelloResponse(data);
//   return response.payload;
// }

// async function getResource(resourceId: string, lang: string): Promise<Resource> {
//   const request = new ResourceRequest(resourceId, lang);
//   const data = await getDataFromApi<ResourceResponse>(request);
//   const response = new ResourceResponse(data);
//   return response.payload;
// }

// async function getAuthorization(agentId: string, agentType: AgentType, lang: string): Promise<AuthorizationData> {
//   const request = new DescriptionsRequest(agentId, agentType, lang);
//   const data = await getDataFromApi<DescriptionsResponseMessage>(request);
//   const response = new DescriptionsResponse(data);
//   return response.payload;
// }

// async function listDataInstances(agentId: string, registrationId: string): Promise<DataInstance[]> {
//   const request = new ListDataInstancesRequest(agentId, registrationId);
//   const data = await getDataFromApi<ListDataInstancesResponseMessage>(request);
//   const response = new ListDataInstancesResponse(data);
//   return response.payload;
// }

async function authorizeApp(authorization: Authorization): Promise<AccessAuthorization> {
  const request = new ApplicationAuthorizationRequest(authorization);
  const data = await getDataFromApi<ApplicationAuthorizationResponseMessage>(request);
  const response = new ApplicationAuthorizationResponse(data);
  return response.payload;
}

async function requestAccess(applicationId: string, agentId: string): Promise<void> {
  const request = new RequestAccessUsingApplicationNeedsRequest(applicationId, agentId);
  await getDataFromApi<RequestAccessUsingApplicationNeedsResponse>(request);
}

// async function listSocialAgents(): Promise<SocialAgent[]> {
//   const request = new SocialAgentsRequest();
//   const data = await getDataFromApi<SocialAgentsResponseMessage>(request);
//   const response = new SocialAgentsResponse(data);
//   return response.payload;
// }

// async function getApplication(applicationId: string): Promise<Partial<Application>> {
//   const request = new UnregisteredApplicationProfileRequest(applicationId);
//   const data = await getDataFromApi<UnregisteredApplicationProfileResponse>(request);
//   const response = new UnregisteredApplicationProfileResponse(data);
//   return response.payload;
// }

// async function listApplications(): Promise<Application[]> {
//   const request = new ApplicationsRequest();
//   const data = await getDataFromApi<ApplicationsResponseMessage>(request);
//   const response = new ApplicationsResponse(data);
//   return response.payload;
// }

// async function listDataRegistires(agentId: string, lang: string): Promise<DataRegistry[]> {
//   const request = new DataRegistriesRequest(agentId, lang);
//   const data = await getDataFromApi<DataRegistriesResponseMessage>(request);
//   const response = new DataRegistriesResponse(data);
//   return response.payload;
// }

async function shareResource(shareAuthorization: ShareAuthorization): Promise<ShareAuthorizationConfirmation> {
  const request = new ShareAuthorizationRequest(shareAuthorization);
  const data = await getDataFromApi<ShareAuthorizationResponseMessage>(request);
  const response = new ShareAuthorizationResponse(data);
  return response.payload;
}

async function createInvitation(label: string, note?: string): Promise<S.Schema.Type<typeof SocialAgentInvitation>> {
  const request = new CreateInvitationRequest(label, note);
  const data = await getDataFromApi<InvitationResponseMessage>(request);
  const response = new SocialAgentInvitationResponse(data);
  return response.payload;
}

// async function listSocialAgentInvitations(): Promise<SocialAgentInvitation[]> {
//   const request = new SocialAgentInvitationsRequest();
//   const data = await getDataFromApi<SocialAgentInvitationsResponseMessage>(request);
//   const response = new SocialAgentInvitationsResponse(data);
//   return response.payload;
// }

async function acceptInvitation(capabilityUrl: string, label: string, note?: string): Promise<SocialAgentOld> {
  const request = new AcceptInvitationRequest(capabilityUrl, label, note);
  const data = await getDataFromApi<SocialAgentResponseMessage>(request);
  const response = new SocialAgentResponse(data);
  return response.payload;
}

export function useBackend() {
  return {
    // getResource,
    shareResource,
    // getAuthorization,
    // listDataInstances,
    authorizeApp,
    requestAccess,
    // listSocialAgents,
    // getApplication,
    // listApplications,
    // listDataRegistires,
    createInvitation,
    // listSocialAgentInvitations,
    acceptInvitation
  };
}
