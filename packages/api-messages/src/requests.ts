/* eslint-disable max-classes-per-file */

import { IRI } from './index';
import { Authorization, ShareAuthorization } from './payloads';

export const RequestMessageTypes = {
  APPLICATIONS_REQUEST: '[APPLICATION PROFILES] Application Profiles Requested',
  SOCIAL_AGENTS_REQUEST: '[SOCIAL AGENTS] Application Profiles Requested',
  DESCRIPTIONS_REQUEST: '[DESCRIPTIONS] Descriptions Requested',
  LIST_DATA_INSTANCES_REQUEST: '[LIST DATA INSTANCES] List Data Instances Requested',
  DATA_REGISTRIES_REQUEST: '[DATA_REGISTRIES] Data Registries Requested',
  ADD_SOCIAL_AGENT_REQUEST: '[SOCIAL AGENTS] Data Registries Requested',
  APPLICATION_AUTHORIZATION: '[APPLICATION] Authorization submitted',
  UNREGISTERED_APPLICATION_PROFILE: 'ApplicationProfileRequest',
  RESOURCE_REQUEST: '[RESOURCE] Resource Requested',
  SHARE_AUTHORIZATION: '[RESOURCE] Share Authorization Requested'
} as const;

abstract class MessageBase {
  stringify(): string {
    return JSON.stringify(this);
  }
}

export class ApplicationsRequest extends MessageBase {
  public type = RequestMessageTypes.APPLICATIONS_REQUEST;
}

export class UnregisteredApplicationProfileRequest extends MessageBase {
  public type = RequestMessageTypes.UNREGISTERED_APPLICATION_PROFILE;

  constructor(private id: IRI) {
    super();
  }
}

export class SocialAgentsRequest extends MessageBase {
  public type = RequestMessageTypes.SOCIAL_AGENTS_REQUEST;
}

export class AddSocialAgentRequest extends MessageBase {
  public type = RequestMessageTypes.ADD_SOCIAL_AGENT_REQUEST;

  constructor(
    public webId: IRI,
    public label: string,
    public note?: string
  ) {
    super();
  }
}

export class DataRegistriesRequest extends MessageBase {
  public type = RequestMessageTypes.DATA_REGISTRIES_REQUEST;

  constructor(
    private agentId: string,
    private lang: string
  ) {
    super();
  }
}

export class DescriptionsRequest extends MessageBase {
  public type = RequestMessageTypes.DESCRIPTIONS_REQUEST;

  constructor(
    private applicationId: IRI,
    private lang: string
  ) {
    super();
  }
}

export class ListDataInstancesRequest extends MessageBase {
  public type = RequestMessageTypes.LIST_DATA_INSTANCES_REQUEST;

  constructor(
    private agentId: string,
    private registrationId: IRI
  ) {
    super();
  }
}

export class ApplicationAuthorizationRequest extends MessageBase {
  public type = RequestMessageTypes.APPLICATION_AUTHORIZATION;

  constructor(private authorization: Authorization) {
    super();
  }
}

export class ResourceRequest extends MessageBase {
  public type = RequestMessageTypes.RESOURCE_REQUEST;

  constructor(
    public id: IRI,
    private lang: string
  ) {
    super();
  }
}

export class ShareAuthorizationRequest extends MessageBase {
  public type = RequestMessageTypes.SHARE_AUTHORIZATION;

  constructor(private shareAuthorization: ShareAuthorization) {
    super();
  }
}

export type Request =
  | ApplicationsRequest
  | SocialAgentsRequest
  | AddSocialAgentRequest
  | DataRegistriesRequest
  | DescriptionsRequest
  | ListDataInstancesRequest
  | ApplicationAuthorizationRequest
  | UnregisteredApplicationProfileRequest
  | ResourceRequest
  | ShareAuthorizationRequest;
