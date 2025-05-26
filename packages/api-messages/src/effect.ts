import { Rpc, RpcRouter } from '@effect/rpc'
import { Context, Effect, pipe } from 'effect'
import * as S from 'effect/Schema'
import type { PushSubscription } from 'web-push'

export const IRI = pipe(S.String, S.brand('IRI'))
export type IRI = S.Schema.Type<typeof IRI>

export enum Scopes {
  Inherited = 'Inherited',
  All = 'All',
  AllFromAgent = 'AllFromAgent',
  AllFromRegistry = 'AllFromRegistry',
  SelectedFromRegistry = 'SelectedFromRegistry',
}

export const AccessModes = {
  Read: 'http://www.w3.org/ns/auth/acl#Read',
  Update: 'http://www.w3.org/ns/auth/acl#Update',
  Create: 'http://www.w3.org/ns/auth/acl#Create',
  Delete: 'http://www.w3.org/ns/auth/acl#Delete',
} as const

export enum AgentType {
  SocialAgent = 'http://www.w3.org/ns/solid/interop#SocialAgent',
  Application = 'http://www.w3.org/ns/solid/interop#Application',
}

export const WebPushSubscription = S.Struct({
  endpoint: S.String,
  keys: S.Struct({
    p256dh: S.String,
    auth: S.String,
  }),
})

export const Application = S.Struct({
  id: IRI,
  name: S.String,
  logo: S.optional(S.String),
  callbackEndpoint: S.optional(S.String),
  authorizationDate: S.String, // interop:registeredAt
  lastUpdateDate: S.optional(S.String), // interop:updatedAt
  accessNeedGroup: S.String, // interop:hasAccessNeedGroup
})

export const ApplicationList = S.Array(Application)

export const UnregisteredApplication = S.Struct({
  id: IRI,
  name: S.String,
  logo: S.optional(S.String),
  accessNeedGroup: S.String, // interop:hasAccessNeedGroup
})

const accessNeedFields = {
  id: IRI,
  label: S.String,
  description: S.optional(S.String),
  required: S.optional(S.Boolean),
  // IRIs for the access modes
  access: S.Array(IRI),
  shapeTree: S.Struct({
    id: IRI,
    label: S.String,
  }),
  parent: S.optional(IRI),
}

interface AccessNeed extends S.Struct.Type<typeof accessNeedFields> {
  readonly children?: ReadonlyArray<AccessNeed>
}

interface AccessNeedEncoded extends S.Struct.Encoded<typeof accessNeedFields> {
  readonly children?: ReadonlyArray<AccessNeedEncoded>
}

export const AccessNeed = S.Struct({
  ...accessNeedFields,
  children: S.optional(
    S.Array(S.suspend((): S.Schema<AccessNeed, AccessNeedEncoded> => AccessNeed))
  ),
})

export const AccessNeedGroup = S.Struct({
  id: IRI,
  label: S.String,
  description: S.optional(S.String),
  required: S.optional(S.Boolean),
  needs: S.Array(AccessNeed),
  descriptionLanguages: S.Array(S.String),
  lang: S.String,
})

export const DataRegistration = S.Struct({
  id: IRI,
  shapeTree: S.String,
  // TODO dataOwner: IRI,
  dataRegistry: S.optional(S.String),
  count: S.optional(S.Number),
  label: S.optional(S.String), // TODO label should be ensured
})

export const DataOwner = S.Struct({
  id: IRI,
  label: S.String,
  dataRegistrations: S.Array(DataRegistration),
})

export const AuthorizationData = S.Struct({
  id: IRI, // TODO change to agentId
  agentType: S.Enums(AgentType),
  accessNeedGroup: AccessNeedGroup,
  dataOwners: S.Array(DataOwner),
})

export const ShapeTree = S.Struct({
  id: IRI,
  label: S.String,
})

export const ChildInfo = S.Struct({
  count: S.Int,
  shapeTree: ShapeTree,
})

export const Resource = S.Struct({
  id: IRI,
  label: S.optional(S.String),
  shapeTree: ShapeTree,
  children: S.Array(ChildInfo),
  accessGrantedTo: S.Array(IRI),
})

export const SocialAgent = S.Struct({
  id: IRI,
  label: S.String,
  note: S.optional(S.String),
  accessNeedGroup: S.optional(S.String),
  accessRequested: S.Boolean,
  accessGrant: S.optional(S.String),
  authorizationDate: S.String, // interop:registeredAt TODO: rename to not imply access
  lastUpdateDate: S.optional(S.String), // interop:updatedAt
})

export const SocialAgentList = S.Array(SocialAgent)

export const SocialAgentInvitation = S.Struct({
  id: IRI,
  label: S.String,
  note: S.optional(S.String),
  capabilityUrl: S.String,
})

export const SocialAgentInvitationList = S.Array(SocialAgentInvitation)

export const DataRegistry = S.Struct({
  id: IRI,
  label: S.String,
  registrations: S.Array(DataRegistration),
})

export const DataRegistryList = S.Array(DataRegistry)

export const DataInstance = S.Struct({
  id: IRI,
  label: S.String,
})

export const DataInstanceList = S.Array(DataInstance)

export const ShareAuthorization = S.Struct({
  applicationId: IRI,
  resource: IRI,
  agents: S.Array(IRI),
  accessMode: S.Array(IRI),
  children: S.Array(
    S.Struct({
      shapeTree: IRI,
      accessMode: S.Array(IRI),
    })
  ),
})

export const ShareAuthorizationConfirmation = S.Struct({
  callbackEndpoint: S.String,
})

export const BaseAuthorization = S.Struct({
  grantee: IRI,
  agentType: S.Enums(AgentType),
  accessNeedGroup: IRI,
})

export const DataAuthorization = S.Struct({
  accessNeed: IRI,
  scope: S.Enums(Scopes),
  dataOwner: S.optional(IRI),
  dataRegistration: S.optional(IRI),
  dataInstances: S.optional(S.Array(IRI)),
})

export const GrantedAuthorization = S.Struct({
  ...BaseAuthorization.fields,
  dataAuthorizations: S.Array(DataAuthorization),
  granted: S.Literal(true),
})

export const DeniedAuthorization = S.Struct({
  ...BaseAuthorization.fields,
  granted: S.Literal(false),
})

export const Authorization = S.Union(GrantedAuthorization, DeniedAuthorization)

export const AccessAuthorization = S.Struct({
  id: IRI,
  callbackEndpoint: S.String,
  ...GrantedAuthorization.fields,
})

export class GetWebId extends S.TaggedRequest<GetWebId>()('GetWebId', {
  failure: S.Never,
  success: S.String,
  payload: {},
}) {}

export class RegisterPushSubscription extends S.TaggedRequest<RegisterPushSubscription>()(
  'RegisterPushSubscription',
  {
    failure: S.Never,
    success: S.Void,
    payload: {
      subscription: WebPushSubscription,
    },
  }
) {}

export class ListApplications extends S.TaggedRequest<ListApplications>()('ListApplications', {
  failure: S.Never,
  success: ApplicationList,
  payload: {},
}) {}

export class GetUnregisteredApplication extends S.TaggedRequest<GetUnregisteredApplication>()(
  'GetUnregisteredApplication',
  {
    failure: S.Never,
    success: UnregisteredApplication,
    payload: { id: IRI },
  }
) {}

export class GetAuthoriaztionData extends S.TaggedRequest<GetAuthoriaztionData>()(
  'GetAuthoriaztionData',
  {
    failure: S.Never,
    success: AuthorizationData,
    payload: {
      agentId: IRI,
      agentType: S.Enums(AgentType),
      lang: S.String, // TODO lang code validation
    },
  }
) {}

export class GetResource extends S.TaggedRequest<GetResource>()('GetResource', {
  failure: S.Never,
  success: Resource,
  payload: {
    id: IRI,
    lang: S.String, // TODO lang code validation
  },
}) {}

export class ListSocialAgents extends S.TaggedRequest<ListSocialAgents>()('ListSocialAgents', {
  failure: S.Never,
  success: SocialAgentList,
  payload: {},
}) {}

export class ListSocialAgentInvitations extends S.TaggedRequest<ListSocialAgentInvitations>()(
  'ListSocialAgentInvitations',
  {
    failure: S.Never,
    success: SocialAgentInvitationList,
    payload: {},
  }
) {}

export class ListDataRegistries extends S.TaggedRequest<ListDataRegistries>()(
  'ListDataRegistries',
  {
    failure: S.Never,
    success: DataRegistryList,
    payload: {
      agentId: IRI,
      lang: S.String, // TODO lang code validation
    },
  }
) {}

export class ListDataInstances extends S.TaggedRequest<ListDataInstances>()('ListDataInstances', {
  failure: S.Never,
  success: DataInstanceList,
  payload: {
    agentId: IRI,
    registrationId: IRI,
  },
}) {}

export class RequestAccessUsingApplicationNeeds extends S.TaggedRequest<RequestAccessUsingApplicationNeeds>()(
  'RequestAccessUsingApplicationNeeds',
  {
    failure: S.Never,
    success: S.Void,
    payload: {
      applicationId: IRI,
      agentId: IRI,
    },
  }
) {}

export class CreateInvitation extends S.TaggedRequest<CreateInvitation>()('CreateInvitation', {
  failure: S.Never,
  success: SocialAgentInvitation,
  payload: {
    label: S.String,
    note: S.optional(S.String),
  },
}) {}

export class AcceptInvitation extends S.TaggedRequest<AcceptInvitation>()('AcceptInvitation', {
  failure: S.Never,
  success: SocialAgent,
  payload: {
    capabilityUrl: S.String,
    label: S.String,
    note: S.optional(S.String),
  },
}) {}

export class ShareResource extends S.TaggedRequest<ShareResource>()('ShareResource', {
  failure: S.Never,
  success: ShareAuthorizationConfirmation,
  payload: {
    authorization: ShareAuthorization,
  },
}) {}

export class AuthorizeApp extends S.TaggedRequest<AuthorizeApp>()('AuthorizeApp', {
  failure: S.Never,
  success: AccessAuthorization,
  payload: {
    authorization: Authorization,
  },
}) {}

export class SaiService extends Context.Tag('SaiService')<
  SaiService,
  {
    readonly getWebId: () => Effect.Effect<S.Schema.Type<typeof S.String>>
    readonly registerPushSubscription: (
      subscription: PushSubscription
    ) => Effect.Effect<S.Schema.Type<typeof S.Void>>
    readonly getApplications: () => Effect.Effect<S.Schema.Type<typeof ApplicationList>>
    readonly getUnregisteredApplication: (
      id: IRI
    ) => Effect.Effect<S.Schema.Type<typeof UnregisteredApplication>>
    readonly getAuthorizationData: (
      agentId: IRI,
      agentType: AgentType,
      lang: string
    ) => Effect.Effect<S.Schema.Type<typeof AuthorizationData>>
    readonly getResource: (id: IRI, lang: string) => Effect.Effect<S.Schema.Type<typeof Resource>>
    readonly getSocialAgents: () => Effect.Effect<S.Schema.Type<typeof SocialAgentList>>
    readonly getSocialAgentInvitations: () => Effect.Effect<
      S.Schema.Type<typeof SocialAgentInvitationList>
    >
    readonly getDataRegistries: (
      agentId: IRI,
      lang: string
    ) => Effect.Effect<S.Schema.Type<typeof DataRegistryList>>
    readonly listDataInstances: (
      agentId: IRI,
      registrationId: string
    ) => Effect.Effect<S.Schema.Type<typeof DataInstanceList>>
    readonly requestAccessUsingApplicationNeeds: (
      applicationId: string,
      agentId: string
    ) => Effect.Effect<S.Schema.Type<typeof S.Void>>
    readonly createInvitation: (
      label: string,
      note?: string
    ) => Effect.Effect<S.Schema.Type<typeof SocialAgentInvitation>>
    readonly acceptInvitation: (
      capabilityUrl: string,
      label: string,
      note?: string
    ) => Effect.Effect<S.Schema.Type<typeof SocialAgent>>
    readonly shareResource: (
      authorization: S.Schema.Type<typeof ShareAuthorization>
    ) => Effect.Effect<S.Schema.Type<typeof ShareAuthorizationConfirmation>>
    readonly authorizeApp: (
      authorization: S.Schema.Type<typeof Authorization>
    ) => Effect.Effect<S.Schema.Type<typeof AccessAuthorization>>
  }
>() {}

export const router = RpcRouter.make(
  Rpc.effect(GetWebId, () =>
    Effect.gen(function* () {
      const saiService = yield* SaiService
      return yield* saiService.getWebId()
    })
  ),
  Rpc.effect(RegisterPushSubscription, ({ subscription }) =>
    Effect.gen(function* () {
      const saiService = yield* SaiService
      return yield* saiService.registerPushSubscription(subscription)
    })
  ),
  Rpc.effect(ListApplications, () =>
    Effect.gen(function* () {
      const saiService = yield* SaiService
      return yield* saiService.getApplications()
    })
  ),
  Rpc.effect(GetUnregisteredApplication, ({ id }) =>
    Effect.gen(function* () {
      const saiService = yield* SaiService
      return yield* saiService.getUnregisteredApplication(id)
    })
  ),
  Rpc.effect(GetAuthoriaztionData, ({ agentId, agentType, lang }) =>
    Effect.gen(function* () {
      const saiService = yield* SaiService
      return yield* saiService.getAuthorizationData(agentId, agentType, lang)
    })
  ),
  Rpc.effect(GetResource, ({ id, lang }) =>
    Effect.gen(function* () {
      const saiService = yield* SaiService
      return yield* saiService.getResource(id, lang)
    })
  ),
  Rpc.effect(ListSocialAgents, () =>
    Effect.gen(function* () {
      const saiService = yield* SaiService
      return yield* saiService.getSocialAgents()
    })
  ),
  Rpc.effect(ListSocialAgentInvitations, () =>
    Effect.gen(function* () {
      const saiService = yield* SaiService
      return yield* saiService.getSocialAgentInvitations()
    })
  ),
  Rpc.effect(ListDataRegistries, ({ agentId, lang }) =>
    Effect.gen(function* () {
      const saiService = yield* SaiService
      return yield* saiService.getDataRegistries(agentId, lang)
    })
  ),
  Rpc.effect(ListDataInstances, ({ agentId, registrationId }) =>
    Effect.gen(function* () {
      const saiService = yield* SaiService
      return yield* saiService.listDataInstances(agentId, registrationId)
    })
  ),
  Rpc.effect(RequestAccessUsingApplicationNeeds, ({ applicationId, agentId }) =>
    Effect.gen(function* () {
      const saiService = yield* SaiService
      return yield* saiService.requestAccessUsingApplicationNeeds(applicationId, agentId)
    })
  ),
  Rpc.effect(CreateInvitation, ({ label, note }) =>
    Effect.gen(function* () {
      const saiService = yield* SaiService
      return yield* saiService.createInvitation(label, note)
    })
  ),
  Rpc.effect(AcceptInvitation, ({ capabilityUrl, label, note }) =>
    Effect.gen(function* () {
      const saiService = yield* SaiService
      return yield* saiService.acceptInvitation(capabilityUrl, label, note)
    })
  ),
  Rpc.effect(ShareResource, ({ authorization }) =>
    Effect.gen(function* () {
      const saiService = yield* SaiService
      return yield* saiService.shareResource(authorization)
    })
  ),
  Rpc.effect(AuthorizeApp, ({ authorization }) =>
    Effect.gen(function* () {
      const saiService = yield* SaiService
      return yield* saiService.authorizeApp(authorization)
    })
  )
)

export type UiRpcRouter = typeof router
