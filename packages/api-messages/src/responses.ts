/* eslint-disable max-classes-per-file */

import {
  AccessAuthorization,
  Application,
  AuthorizationData,
  DataRegistry,
  Payloads,
  SocialAgent,
  Resource,
  ShareAuthorizationConfirmation,
  DataInstance,
  SocialAgentInvitation
} from './payloads';

export const ResponseMessageTypes = {
  APPLICATIONS_RESPONSE: '[APPLICATION PROFILES] Application Profiles Received',
  SOCIAL_AGENTS_RESPONSE: '[SOCIAL AGENTS PROFILES] Application Profiles Received',
  DESCRIPTIONS_RESPONSE: '[DESCRIPTIONS] Descriptions Received',
  LIST_DATA_INSTANCES_RESPONSE: '[LIST DATA INSTANCES] List Data Instances Received',
  DATA_REGISTRIES_RESPONSE: '[DATA_REGISTRIES] Data Registries Received',
  SOCIAL_AGENT_RESPONSE: '[SOCIAL AGENTS] Social Agent Received',
  APPLICATION_AUTHORIZATION_REGISTERED: '[APPLICATION] Authorization registered',
  UNREGISTERED_APPLICATION_PROFILE: 'ApplicationProfileResponse',
  RESOURCE_RESPONSE: '[RESOURCE] Resource Received',
  SHARE_AUTHORIZATION_CONFIRMATION: '[RESOURCE] Share Authorization Confirmed',
  REQUEST_ACCESS_USING_APPLICATION_NEEDS_CONFIRMTION:
    '[REQUEST ACCESS USING APPLICATION NEEDS] Request Access Using Application Needs Confirmed',
  SOCIAL_AGENT_INVITATIONS_RESPONSE: '[SOCIAL AGENT INVITATIONS] Social Agent Invitations Received',
  INVITATION_REGISTRATION: '[INVITATION_REGISTRATION] Invitation registration'
} as const;

export type TResponseMessage = typeof ResponseMessageTypes;
export type TResponseMessages = keyof TResponseMessage;
export type VResponseMessages = TResponseMessage[TResponseMessages];

export type IResponseMessage<T extends VResponseMessages, P extends Payloads> = {
  type: T;
  payload: P;
};

export type ApplicationsResponseMessage = IResponseMessage<
  typeof ResponseMessageTypes.APPLICATIONS_RESPONSE,
  Application[]
>;
export type SocialAgentsResponseMessage = IResponseMessage<
  typeof ResponseMessageTypes.SOCIAL_AGENTS_RESPONSE,
  SocialAgent[]
>;
export type SocialAgentResponseMessage = IResponseMessage<
  typeof ResponseMessageTypes.SOCIAL_AGENT_RESPONSE,
  SocialAgent
>;
export type DataRegistriesResponseMessage = IResponseMessage<
  typeof ResponseMessageTypes.DATA_REGISTRIES_RESPONSE,
  DataRegistry[]
>;
export type DescriptionsResponseMessage = IResponseMessage<
  typeof ResponseMessageTypes.DESCRIPTIONS_RESPONSE,
  AuthorizationData
>;
export type ListDataInstancesResponseMessage = IResponseMessage<
  typeof ResponseMessageTypes.LIST_DATA_INSTANCES_RESPONSE,
  DataInstance[]
>;
export type ApplicationAuthorizationResponseMessage = IResponseMessage<
  typeof ResponseMessageTypes.APPLICATION_AUTHORIZATION_REGISTERED,
  AccessAuthorization
>;
export type RequestAccessUsingApplicationNeedResponseMessage = IResponseMessage<
  typeof ResponseMessageTypes.REQUEST_ACCESS_USING_APPLICATION_NEEDS_CONFIRMTION,
  null
>;
export type UnregisteredApplicationResponseMessage = IResponseMessage<
  typeof ResponseMessageTypes.UNREGISTERED_APPLICATION_PROFILE,
  Partial<Application>
>;
export type ResourceResponseMessage = IResponseMessage<typeof ResponseMessageTypes.RESOURCE_RESPONSE, Resource>;
export type ShareAuthorizationResponseMessage = IResponseMessage<
  typeof ResponseMessageTypes.SHARE_AUTHORIZATION_CONFIRMATION,
  ShareAuthorizationConfirmation
>;
export type SocialAgentInvitationsResponseMessage = IResponseMessage<
  typeof ResponseMessageTypes.SOCIAL_AGENT_INVITATIONS_RESPONSE,
  SocialAgentInvitation[]
>;
export type InvitationResponseMessage = IResponseMessage<
  typeof ResponseMessageTypes.INVITATION_REGISTRATION,
  SocialAgentInvitation
>;

export type ResponseMessage =
  | ApplicationsResponseMessage
  | SocialAgentsResponseMessage
  | SocialAgentResponseMessage
  | DataRegistriesResponseMessage
  | DescriptionsResponseMessage
  | ListDataInstancesResponseMessage
  | ApplicationAuthorizationResponseMessage
  | RequestAccessUsingApplicationNeedResponseMessage
  | UnregisteredApplicationResponseMessage
  | ResourceResponseMessage
  | ShareAuthorizationResponseMessage
  | SocialAgentInvitationsResponseMessage
  | InvitationResponseMessage;

function validateType(messageType: VResponseMessages, requiredType: VResponseMessages) {
  if (messageType !== requiredType) {
    throw new Error(`Invalid message type! Expected: ${messageType}, received: ${requiredType}`);
  }
}

export class ApplicationsResponse {
  public type = ResponseMessageTypes.APPLICATIONS_RESPONSE;

  public payload: Application[];

  constructor(message: ApplicationsResponseMessage) {
    validateType(message.type, this.type);
    this.payload = message.payload;
  }
}

export class UnregisteredApplicationProfileResponse {
  public type = ResponseMessageTypes.UNREGISTERED_APPLICATION_PROFILE;

  public payload: Partial<Application>;

  constructor(message: UnregisteredApplicationResponseMessage) {
    validateType(message.type, this.type);
    this.payload = message.payload;
  }
}

export class SocialAgentsResponse {
  public type = ResponseMessageTypes.SOCIAL_AGENTS_RESPONSE;

  public payload: SocialAgent[];

  constructor(message: SocialAgentsResponseMessage) {
    validateType(message.type, this.type);
    this.payload = message.payload;
  }
}

export class SocialAgentResponse {
  public type = ResponseMessageTypes.SOCIAL_AGENT_RESPONSE;

  public payload: SocialAgent;

  constructor(message: SocialAgentResponseMessage) {
    validateType(message.type, this.type);
    this.payload = message.payload;
  }
}

export class DataRegistriesResponse {
  public type = ResponseMessageTypes.DATA_REGISTRIES_RESPONSE;

  public payload: DataRegistry[];

  constructor(message: DataRegistriesResponseMessage) {
    validateType(message.type, this.type);
    this.payload = message.payload;
  }
}

export class DescriptionsResponse {
  public type = ResponseMessageTypes.DESCRIPTIONS_RESPONSE;

  public payload: AuthorizationData;

  constructor(message: DescriptionsResponseMessage) {
    validateType(message.type, this.type);
    this.payload = message.payload;
  }
}

export class ListDataInstancesResponse {
  public type = ResponseMessageTypes.LIST_DATA_INSTANCES_RESPONSE;

  public payload: DataInstance[];

  constructor(message: ListDataInstancesResponseMessage) {
    validateType(message.type, this.type);
    this.payload = message.payload;
  }
}

export class ApplicationAuthorizationResponse {
  public type = ResponseMessageTypes.APPLICATION_AUTHORIZATION_REGISTERED;

  public payload: AccessAuthorization;

  constructor(message: ApplicationAuthorizationResponseMessage) {
    validateType(message.type, this.type);
    this.payload = message.payload;
  }
}

export class ResourceResponse {
  public type = ResponseMessageTypes.RESOURCE_RESPONSE;

  public payload: Resource;

  constructor(message: ResourceResponseMessage) {
    validateType(message.type, this.type);
    this.payload = message.payload;
  }
}

export class ShareAuthorizationResponse {
  public type = ResponseMessageTypes.SHARE_AUTHORIZATION_CONFIRMATION;

  public payload: ShareAuthorizationConfirmation;

  constructor(message: ShareAuthorizationResponseMessage) {
    validateType(message.type, this.type);
    this.payload = message.payload;
  }
}

export class RequestAccessUsingApplicationNeedsResponse {
  public type = ResponseMessageTypes.REQUEST_ACCESS_USING_APPLICATION_NEEDS_CONFIRMTION;

  public payload: null;

  constructor(message: RequestAccessUsingApplicationNeedResponseMessage) {
    validateType(message.type, this.type);
  }
}

export class SocialAgentInvitationsResponse {
  public type = ResponseMessageTypes.SOCIAL_AGENT_INVITATIONS_RESPONSE;

  public payload: SocialAgentInvitation[];

  constructor(message: SocialAgentInvitationsResponseMessage) {
    validateType(message.type, this.type);
    this.payload = message.payload;
  }
}

export class SocialAgentInvitationResponse {
  public type = ResponseMessageTypes.INVITATION_REGISTRATION;

  public payload: SocialAgentInvitation;

  constructor(message: InvitationResponseMessage) {
    validateType(message.type, this.type);
    this.payload = message.payload;
  }
}
