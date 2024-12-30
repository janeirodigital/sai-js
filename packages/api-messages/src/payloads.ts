import { IRI, UniqueId } from './index';

// duplicated so that we don't need to use RDFJS and namespace builder on the frontend
export const AccessModes = {
  Read: 'http://www.w3.org/ns/auth/acl#Read',
  Update: 'http://www.w3.org/ns/auth/acl#Update',
  Create: 'http://www.w3.org/ns/auth/acl#Create',
  Delete: 'http://www.w3.org/ns/auth/acl#Delete'
} as const;

export type LoginStatus = {
  webId?: string;
};

export interface Application extends UniqueId {
  name: string;
  logo?: IRI;
  callbackEndpoint?: IRI;
  authorizationDate: string; // interop:registeredAt
  lastUpdateDate?: string; // interop:updatedAt
  accessNeedGroup: IRI; // interop:hasAccessNeedGroup
}

export interface SocialAgent extends UniqueId {
  label: string;
  note?: string;
  accessNeedGroup?: IRI;
  accessRequested: boolean;
  accessGrant?: IRI;
  authorizationDate: string; // interop:registeredAt TODO: rename to not imply access
  lastUpdateDate?: string; // interop:updatedAt
}

export interface DataRegistration extends UniqueId {
  shapeTree: IRI;
  // TODO dataOwner: IRI;
  dataRegistry?: IRI;
  count?: number;
  label?: string; // TODO label should be ensured
}

export interface DataRegistry extends UniqueId {
  label: string;
  registrations: DataRegistration[];
}

export interface Description extends UniqueId {
  label: string;
  description?: string;
  needId: IRI;
}

export interface AccessNeed extends UniqueId {
  label: string;
  description?: string;
  required?: boolean;
  // IRIs for the access modes
  access: Array<IRI>;
  shapeTree: {
    id: IRI;
    label: string;
  };
  children?: AccessNeed[];
  parent?: IRI;
}

export interface AccessNeedGroup extends UniqueId {
  label: string;
  description?: string;
  required?: boolean;
  needs: AccessNeed[];
  descriptionLanguages: string[];
  lang: string;
}

export interface DataOwner extends UniqueId {
  label: string;
  dataRegistrations: DataRegistration[];
}

export enum AgentType {
  SocialAgent = 'http://www.w3.org/ns/solid/interop#SocialAgent',
  Application = 'http://www.w3.org/ns/solid/interop#Application'
}

export interface AuthorizationData extends UniqueId {
  agentType: AgentType;
  accessNeedGroup: AccessNeedGroup;
  dataOwners: DataOwner[];
}

export interface DataAuthorization {
  accessNeed: IRI;
  scope: string;
  dataOwner?: IRI;
  dataRegistration?: IRI;
  dataInstances?: IRI[];
}

export interface BaseAuthorization {
  grantee: IRI;
  agentType: AgentType;
  accessNeedGroup: IRI;
}
export interface GrantedAuthorization extends BaseAuthorization {
  dataAuthorizations: DataAuthorization[];
  granted: true;
}

export interface DeniedAuthorization extends BaseAuthorization {
  granted: false;
  dataAuthorizations?: never;
}

export type Authorization = GrantedAuthorization | DeniedAuthorization;

export interface AccessAuthorization extends UniqueId, GrantedAuthorization {
  callbackEndpoint: IRI;
}

export type ShapeTree = {
  id: IRI;
  label: string;
  references?: ShapeTree[];
};

export type ChildResource = {
  count: number;
  shapeTree: {
    id: string;
    label: string;
  };
};
export type DataInstance = {
  id: IRI;
  label?: string;
};

export type Resource = DataInstance & {
  shapeTree: ShapeTree;
  children: ChildResource[];
  accessGrantedTo: IRI[];
};

export type ShareAuthorizationModes = {
  accessMode: IRI[];
  children: {
    shapeTree: IRI;
    accessMode: IRI[];
  }[];
};

export type ShareAuthorization = {
  applicationId: IRI;
  resource: IRI;
  agents: IRI[];
} & ShareAuthorizationModes;

export interface ShareAuthorizationConfirmation {
  callbackEndpoint: IRI;
}

export type RequestAccessUsingApplicationNeeds = {
  applicationId: IRI;
  agentId: IRI;
};

export type InvitationBase = {
  label: string;
  note?: string;
};

export type Invitation = InvitationBase & {
  capabilityUrl: IRI;
};

export type SocialAgentInvitation = Invitation & {
  id: IRI;
};

export type Payloads =
  | LoginStatus
  | Application[]
  | SocialAgent[]
  | SocialAgent
  | DataRegistry[]
  | AuthorizationData
  | DataInstance[]
  | AccessAuthorization
  | Partial<Application>
  | Resource
  | ShareAuthorizationConfirmation
  | RequestAccessUsingApplicationNeeds
  | InvitationBase
  | Invitation
  | SocialAgentInvitation;
