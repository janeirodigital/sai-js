import { from, Observable } from 'rxjs';
import { BadRequestHttpError, HttpHandler, HttpHandlerResponse } from '@digita-ai/handlersjs-http';
import { getLogger } from '@digita-ai/handlersjs-logging';
import { type LoginStatus, RequestMessageTypes, ResponseMessageTypes } from '@janeirodigital/sai-api-messages';
// import type { IQueue } from '@janeirodigital/sai-server-interfaces';
import {
  getApplications,
  getDescriptions,
  // recordAuthorization,
  getDataRegistries,
  getSocialAgents,
  // addSocialAgent,
  getUnregisteredApplication,
  getResource,
  // shareResource,
  listDataInstances,
  // requestAccessUsingApplicationNeeds,
  // acceptInvitation,
  // createInvitation,
  getSocialAgentInvitations
} from '../services';
import type { AuthenticatedAuthnContext } from '../models/http-solid-context';
// import { IReciprocalRegistrationsJobData } from '../models/jobs';
import { SessionManager } from '../session-manager';
import { Effect, Layer } from 'effect';
import { RpcRouter } from '@effect/rpc';
import { router, SaiService } from '@janeirodigital/sai-api-messages';

export class RpcHandler extends HttpHandler {
  private logger = getLogger();

  constructor(
    private sessionManager: SessionManager // private queue: IQueue
  ) {
    super();
  }

  async handleAsync(context: AuthenticatedAuthnContext): Promise<HttpHandlerResponse> {
    const { body } = context.request;
    if (!body) {
      throw new BadRequestHttpError('body is required');
    }
    if (body.type === RequestMessageTypes.HELLO_REQUEST) {
      if (body.subscription) {
        await this.sessionManager.addPushSubscription(context.authn.webId, body.subscription);
      }

      const oidcSession = await this.sessionManager.getOidcSession(context.authn.webId);
      const loginStatus: LoginStatus = {};

      if (oidcSession.info.isLoggedIn) {
        loginStatus.webId = oidcSession.info.webId;
      }

      return {
        body: {
          type: ResponseMessageTypes.HELLO_RESPONSE,
          payload: loginStatus
        },
        status: 200,
        headers: {}
      };
    }
    const saiSession = await this.sessionManager.getSaiSession(context.authn.webId);
    const SaiServiceLive = Layer.succeed(
      SaiService,
      SaiService.of({
        getApplications: () => Effect.promise(() => getApplications(saiSession)),
        getUnregisteredApplication: (id) => Effect.promise(() => getUnregisteredApplication(saiSession, id)),
        getAuthorizationData: (agentId, agentType, lang) =>
          Effect.promise(() => getDescriptions(saiSession, agentId, agentType, lang)),
        getResource: (id, lang) => Effect.promise(() => getResource(saiSession, id, lang)),
        getSocialAgents: () => Effect.promise(() => getSocialAgents(saiSession)),
        getSocialAgentInvitations: () => Effect.promise(() => getSocialAgentInvitations(saiSession)),
        getDataRegistries: (agentId, lang) => Effect.promise(() => getDataRegistries(saiSession, agentId, lang)),
        listDataInstances: (agentId, registrationId) =>
          Effect.promise(() => listDataInstances(saiSession, agentId, registrationId))
      })
    );
    const rpcHandler = RpcRouter.toHandlerNoStream(router);

    const program = Effect.gen(function* () {
      return yield* rpcHandler(body);
    }).pipe(Effect.provide(SaiServiceLive));
    const payload = await Effect.runPromise(program);

    return {
      body: payload,
      status: 200,
      headers: {}
    };
  }

  handle(context: AuthenticatedAuthnContext): Observable<HttpHandlerResponse> {
    return from(this.handleAsync(context));
  }
}
