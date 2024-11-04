import * as S from "effect/Schema"
import { AuthorizationData, UniqueId } from './index';

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

// export interface Application extends UniqueId {
//   name: string;
//   logo?: string;
//   callbackEndpoint?: string;
//   authorizationDate: string; // interop:registeredAt
//   lastUpdateDate?: string; // interop:updatedAt
//   accessNeedGroup: string; // interop:hasAccessNeedGroup
// }

export interface SocialAgentOld extends UniqueId {
  label: string;
  note?: string;
  accessNeedGroup?: string;
  accessRequested: boolean;
  accessGrant?: string;
  authorizationDate: string; // interop:registeredAt TODO: rename to not imply access
  lastUpdateDate?: string; // interop:updatedAt
}

// export interface DataRegistration extends UniqueId {
//   shapeTree: string;
//   // TODO dataOwner: string;
//   dataRegistry?: string;
//   count?: number;
//   label?: string; // TODO label should be ensured
// }

// export interface DataRegistry extends UniqueId {
//   label: string;
//   registrations: S.Schema.Type<typeof DataRegistration>[];
// }

export interface Description extends UniqueId {
  label: string;
  description?: string;
  needId: string;
}

// export interface AccessNeed extends UniqueId {
//   label: string;
//   description?: string;
//   required?: boolean;
//   // IRIs for the access modes
//   access: Array<string>;
//   shapeTree: {
//     id: string;
//     label: string;
//   };
//   children?: AccessNeed[];
//   parent?: string;
// }

// export interface AccessNeedGroup extends UniqueId {
//   label: string;
//   description?: string;
//   required?: boolean;
//   needs: AccessNeed[];
//   descriptionLanguages: string[];
//   lang: string;
// }

// export interface DataOwner extends UniqueId {
//   label: string;
//   dataRegistrations: DataRegistration[];
// }

export enum AgentType {
  SocialAgent = 'http://www.w3.org/ns/solid/interop#SocialAgent',
  Application = 'http://www.w3.org/ns/solid/interop#Application'
}

// export interface AuthorizationData extends UniqueId {
//   agentType: AgentType;
//   accessNeedGroup: AccessNeedGroup;
//   dataOwners: DataOwner[];
// }

export interface DataAuthorization {
  accessNeed: string;
  scope: string;
  dataOwner?: string;
  dataRegistration?: string;
  dataInstances?: string[];
}

export interface BaseAuthorization {
  grantee: string;
  agentType: AgentType;
  accessNeedGroup: string;
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
  callbackEndpoint: string;
}

// export type ShapeTree = {
//   id: string;
//   label: string;
//   references?: ShapeTree[];
// };

// export type ChildResource = {
//   count: number;
//   shapeTree: {
//     id: string;
//     label: string;
//   };
// };

// export type DataInstance = {
//   id: string;
//   label?: string;
// };

// export type Resource = DataInstance & {
//   shapeTree: ShapeTree;
//   children: ChildResource[];
//   accessGrantedTo: string[];
// };

export type ShareAuthorizationModes = {
  accessMode: string[];
  children: {
    shapeTree: string;
    accessMode: string[];
  }[];
};

export type ShareAuthorization = {
  applicationId: string;
  resource: string;
  agents: string[];
} & ShareAuthorizationModes;

export interface ShareAuthorizationConfirmation {
  callbackEndpoint: string;
}

export type RequestAccessUsingApplicationNeeds = {
  applicationId: string;
  agentId: string;
};

export type InvitationBase = {
  label: string;
  note?: string;
};

export type Invitation = InvitationBase & {
  capabilityUrl: string;
};

// export type SocialAgentInvitation = Invitation & {
//   id: string;
// };

export type Payloads =
  | LoginStatus
  // | Application[]
  // | SocialAgent[]
  // | SocialAgentInvitation[]
  | SocialAgentOld
  // | DataRegistry[]
  | S.Schema.Type<typeof AuthorizationData>
  // | DataInstance[]
  | AccessAuthorization
  // | Partial<Application>
  // | Resource
  | ShareAuthorizationConfirmation
  | RequestAccessUsingApplicationNeeds
  | InvitationBase
  | Invitation
  // | SocialAgentInvitation;
