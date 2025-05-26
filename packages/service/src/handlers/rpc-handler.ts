import {
  BadRequestHttpError,
  HttpHandler,
  type HttpHandlerResponse,
} from '@digita-ai/handlersjs-http'
import { getLogger } from '@digita-ai/handlersjs-logging'
import { RpcRouter } from '@effect/rpc'
import { SaiService, router } from '@janeirodigital/sai-api-messages'
import { Effect, Layer } from 'effect'
import { type Observable, from } from 'rxjs'
import type { PushSubscription } from 'web-push'
import type { AuthenticatedAuthnContext, CookieContext } from '../models/http-solid-context'
// import type { IQueue } from '@janeirodigital/sai-server-interfaces';
import {
  acceptInvitation,
  createInvitation,
  getApplications,
  getDataRegistries,
  getDescriptions,
  getResource,
  getSocialAgentInvitations,
  getSocialAgents,
  // addSocialAgent,
  getUnregisteredApplication,
  listDataInstances,
  recordAuthorization,
  requestAccessUsingApplicationNeeds,
  shareResource,
} from '../services'
// import { IReciprocalRegistrationsJobData } from '../models/jobs';
import type { SessionManager } from '../session-manager'

export class RpcHandler extends HttpHandler {
  private logger = getLogger()

  constructor(
    private sessionManager: SessionManager // private queue: IQueue
  ) {
    super()
  }

  async handleAsync(context: CookieContext): Promise<HttpHandlerResponse> {
    const { body } = context.request
    if (!body) {
      throw new BadRequestHttpError('body is required')
    }
    const saiSession = await this.sessionManager.getSaiSession(context.authn.webId)
    const SaiServiceLive = Layer.succeed(
      SaiService,
      SaiService.of({
        getWebId: () => Effect.succeed(saiSession.webId),
        registerPushSubscription: (subscription: PushSubscription) =>
          Effect.promise(() =>
            this.sessionManager.addPushSubscription(saiSession.webId, subscription)
          ),
        getApplications: () => Effect.promise(() => getApplications(saiSession)),
        getUnregisteredApplication: (id) =>
          Effect.promise(() => getUnregisteredApplication(saiSession, id)),
        getAuthorizationData: (agentId, agentType, lang) =>
          Effect.promise(() => getDescriptions(saiSession, agentId, agentType, lang)),
        getResource: (id, lang) => Effect.promise(() => getResource(saiSession, id, lang)),
        getSocialAgents: () => Effect.promise(() => getSocialAgents(saiSession)),
        getSocialAgentInvitations: () =>
          Effect.promise(() => getSocialAgentInvitations(saiSession)),
        getDataRegistries: (agentId, lang) =>
          Effect.promise(() => getDataRegistries(saiSession, agentId, lang)),
        listDataInstances: (agentId, registrationId) =>
          Effect.promise(() => listDataInstances(saiSession, agentId, registrationId)),
        requestAccessUsingApplicationNeeds: (applicationId, agentId) =>
          Effect.promise(() =>
            requestAccessUsingApplicationNeeds(saiSession, applicationId, agentId)
          ),
        createInvitation: (label, note) =>
          Effect.promise(() => createInvitation(saiSession, { label, note })),
        acceptInvitation: (capabilityUrl, label, note) =>
          Effect.promise(() => acceptInvitation(saiSession, { capabilityUrl, label, note })),
        shareResource: (authorization) =>
          Effect.promise(() => shareResource(saiSession, authorization)),
        authorizeApp: (authorization) =>
          Effect.promise(() => recordAuthorization(saiSession, authorization)),
      })
    )
    const rpcHandler = RpcRouter.toHandlerNoStream(router)

    const program = Effect.gen(function* () {
      return yield* rpcHandler(body)
    }).pipe(Effect.provide(SaiServiceLive))
    const payload = await Effect.runPromise(program)

    return {
      body: payload,
      status: 200,
      headers: {},
    }
  }

  handle(context: AuthenticatedAuthnContext): Observable<HttpHandlerResponse> {
    return from(this.handleAsync(context))
  }
}
