import { Context, Effect, pipe } from "effect"
import * as S from "effect/Schema"
import { Rpc, RpcRouter } from '@effect/rpc';
import { AgentType } from "./payloads";

export const IRI = pipe(S.String, S.brand("IRI"))
export type IRI = S.Schema.Type<typeof IRI>

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
  children: S.optional(S.Array(S.suspend((): S.Schema<AccessNeed, AccessNeedEncoded> => AccessNeed))),
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
  dataOwners: S.Array(DataOwner)
})

export const ShapeTree = S.Struct({
  id: IRI,
  label: S.String
})

export const ChildInfo = S.Struct({
  count: S.Int,
  shapeTree: ShapeTree
})

export const Resource = S.Struct({
  id: IRI,
  label: S.optional(S.String),
  shapeTree: ShapeTree,
  children: S.Array(ChildInfo),
  accessGrantedTo: S.Array(IRI)
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
  registrations: S.Array(DataRegistration)
})

export const DataRegistryList = S.Array(DataRegistry)

export const DataInstance = S.Struct({
  id: IRI,
  label: S.String,
})

export const DataInstanceList = S.Array(DataInstance)

export class ListApplications extends S.TaggedRequest<ListApplications>()("ListApplications", {
  failure: S.Never,
  success: ApplicationList,
  payload: {}
}) {}

export class GetUnregisteredApplication extends S.TaggedRequest<GetUnregisteredApplication>()("GetUnregisteredApplication", {
  failure: S.Never,
  success: UnregisteredApplication,
  payload: { id: IRI }
}) {}

export class GetAuthoriaztionData extends S.TaggedRequest<GetAuthoriaztionData>()("GetAuthoriaztionData", {
  failure: S.Never,
  success: AuthorizationData,
  payload: {
    agentId: IRI,
    agentType: S.Enums(AgentType),
    lang: S.String // TODO lang code validation
  }
}) {}

export class GetResource extends S.TaggedRequest<GetResource>()("GetResource", {
  failure: S.Never,
  success: Resource,
  payload: {
    id: IRI,
    lang: S.String // TODO lang code validation
  }
}) {}

export class ListSocialAgents extends S.TaggedRequest<ListSocialAgents>()("ListSocialAgents", {
  failure: S.Never,
  success: SocialAgentList,
  payload: {}
}) {}

export class ListSocialAgentInvitations extends S.TaggedRequest<ListSocialAgentInvitations>()("ListSocialAgentInvitations", {
  failure: S.Never,
  success: SocialAgentInvitationList,
  payload: {}
}) {}

export class ListDataRegistries extends S.TaggedRequest<ListDataRegistries>()("ListDataRegistries", {
  failure: S.Never,
  success: DataRegistryList,
  payload: {
    agentId: IRI,
    lang: S.String // TODO lang code validation
  }
}) {}

export class ListDataInstances extends S.TaggedRequest<ListDataInstances>()("ListDataInstances", {
  failure: S.Never,
  success: DataInstanceList,
  payload: {
    agentId: IRI,
    registrationId: IRI,
  }
}) {}

export class SaiService extends Context.Tag('SaiService')<
  SaiService,
  {
    readonly getApplications: () => Effect.Effect<S.Schema.Type<typeof ApplicationList>>,
    readonly getUnregisteredApplication: (id: IRI) => Effect.Effect<S.Schema.Type<typeof UnregisteredApplication>>,
    readonly getAuthorizationData: (agentId: IRI, agentType: AgentType, lang: string) => Effect.Effect<S.Schema.Type<typeof AuthorizationData>>,
    readonly getResource: (id: IRI, lang: string) => Effect.Effect<S.Schema.Type<typeof Resource>>,
    readonly getSocialAgents: () => Effect.Effect<S.Schema.Type<typeof SocialAgentList>>,
    readonly getSocialAgentInvitations: () => Effect.Effect<S.Schema.Type<typeof SocialAgentInvitationList>>,
    readonly getDataRegistries: (agentId: IRI, lang: string) => Effect.Effect<S.Schema.Type<typeof DataRegistryList>>,
    readonly listDataInstances: (agentId: IRI, registrationId: string) => Effect.Effect<S.Schema.Type<typeof DataInstanceList>>,
  }
>() {}

export const router = RpcRouter.make(
  Rpc.effect(ListApplications, () => Effect.gen(function* () {
    const saiService = yield* SaiService
    return yield* saiService.getApplications()
  })),
  Rpc.effect(GetUnregisteredApplication, ({ id }) => Effect.gen(function* () {
    const saiService = yield* SaiService
    return yield* saiService.getUnregisteredApplication(id)
  })),
  Rpc.effect(GetAuthoriaztionData, ({ agentId, agentType, lang }) => Effect.gen(function* () {
    const saiService = yield* SaiService
    return yield* saiService.getAuthorizationData(agentId, agentType, lang)
  })),
  Rpc.effect(GetResource, ({ id, lang }) => Effect.gen(function* () {
    const saiService = yield* SaiService
    return yield* saiService.getResource(id, lang)
  })),
  Rpc.effect(ListSocialAgents, () => Effect.gen(function* () {
    const saiService = yield* SaiService
    return yield* saiService.getSocialAgents()
  })),
  Rpc.effect(ListSocialAgentInvitations, () => Effect.gen(function* () {
    const saiService = yield* SaiService
    return yield* saiService.getSocialAgentInvitations()
  })),
  Rpc.effect(ListDataRegistries, ({ agentId, lang }) => Effect.gen(function* () {
    const saiService = yield* SaiService
    return yield* saiService.getDataRegistries(agentId, lang)
  })),
  Rpc.effect(ListDataInstances, ({ agentId, registrationId }) => Effect.gen(function* () {
    const saiService = yield* SaiService
    return yield* saiService.listDataInstances(agentId, registrationId)
  })),
)

export type UiRpcRouter = typeof router
