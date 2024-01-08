import { from, Observable } from 'rxjs';
import { BadRequestHttpError, HttpHandler, HttpHandlerResponse } from '@digita-ai/handlersjs-http';
import { getLogger } from '@digita-ai/handlersjs-logging';
import { type LoginStatus, RequestMessageTypes, ResponseMessageTypes } from '@janeirodigital/sai-api-messages';
import type { IQueue } from '@janeirodigital/sai-server-interfaces';
import {
  getApplications,
  getDescriptions,
  recordAuthorization,
  getDataRegistries,
  getSocialAgents,
  addSocialAgent,
  getUnregisteredApplicationProfile,
  getResource,
  shareResource,
  listDataInstances,
  requestAccessUsingApplicationNeeds,
  acceptInvitation,
  createInvitation,
  getSocialAgentInvitations,
  initLogin
} from '../services';
import type { AuthenticatedAuthnContext } from '../models/http-solid-context';
import { validateContentType } from '../utils/http-validators';
import { IReciprocalRegistrationsJobData } from '../models/jobs';
import { SessionManager } from '../session-manager';

export class ApiHandler extends HttpHandler {
  private logger = getLogger();

  constructor(
    private sessionManager: SessionManager,
    private queue: IQueue
  ) {
    super();
  }

  async handleAsync(context: AuthenticatedAuthnContext): Promise<HttpHandlerResponse> {
    validateContentType(context, 'application/json');
    const { body } = context.request;
    if (!body) {
      throw new BadRequestHttpError('body is required');
    }
    if (body.type === RequestMessageTypes.HELLO_REQUEST) {
      if (body.subscription) {
        await this.sessionManager.addPushSubscription(context.authn.webId, body.subscription);
      }

      const oidcSession = await this.sessionManager.getOidcSession(context.authn.webId);
      let loginStatus: LoginStatus;

      if (oidcSession.info.isLoggedIn) {
        loginStatus = {
          isLoggedIn: true
        };
      } else {
        loginStatus = {
          completeRedirectUrl: await initLogin(oidcSession, context.authn.webId, context.authn.issuer),
          isLoggedIn: false
        };
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

    switch (body.type) {
      case RequestMessageTypes.APPLICATIONS_REQUEST:
        return {
          body: {
            type: ResponseMessageTypes.APPLICATIONS_RESPONSE,
            payload: await getApplications(saiSession)
          },
          status: 200,
          headers: {}
        };
      case RequestMessageTypes.UNREGISTERED_APPLICATION_PROFILE:
        return {
          body: {
            type: ResponseMessageTypes.UNREGISTERED_APPLICATION_PROFILE,
            payload: await getUnregisteredApplicationProfile(saiSession, body.id)
          },
          status: 200,
          headers: {}
        };
      case RequestMessageTypes.SOCIAL_AGENTS_REQUEST:
        return {
          body: {
            type: ResponseMessageTypes.SOCIAL_AGENTS_RESPONSE,
            payload: await getSocialAgents(saiSession)
          },
          status: 200,
          headers: {}
        };
      case RequestMessageTypes.ADD_SOCIAL_AGENT_REQUEST: {
        // eslint-disable-next-line no-case-declarations
        const { webId, label, note } = body;
        // eslint-disable-next-line no-case-declarations
        const socialAgent = await addSocialAgent(saiSession, { webId, label, note });
        // eslint-disable-next-line no-case-declarations
        const jobData: IReciprocalRegistrationsJobData = {
          webId: saiSession.webId,
          registeredAgent: socialAgent.id
        };
        await this.queue.add(jobData);
        return {
          body: {
            type: ResponseMessageTypes.SOCIAL_AGENT_RESPONSE,
            payload: socialAgent
          },
          status: 200,
          headers: {}
        };
      }
      case RequestMessageTypes.DATA_REGISTRIES_REQUEST:
        return {
          body: {
            type: ResponseMessageTypes.DATA_REGISTRIES_RESPONSE,
            payload: await getDataRegistries(body.agentId, body.lang, saiSession)
          },
          status: 200,
          headers: {}
        };
      case RequestMessageTypes.DESCRIPTIONS_REQUEST:
        return {
          body: {
            type: ResponseMessageTypes.DESCRIPTIONS_RESPONSE,
            payload: await getDescriptions(body.agentId, body.agentType, body.lang, saiSession)
          },
          status: 200,
          headers: {}
        };
      case RequestMessageTypes.LIST_DATA_INSTANCES_REQUEST:
        return {
          body: {
            type: ResponseMessageTypes.LIST_DATA_INSTANCES_RESPONSE,
            payload: await listDataInstances(body.agentId, body.registrationId, saiSession)
          },
          status: 200,
          headers: {}
        };
      case RequestMessageTypes.APPLICATION_AUTHORIZATION:
        return {
          body: {
            type: ResponseMessageTypes.APPLICATION_AUTHORIZATION_REGISTERED,
            payload: await recordAuthorization(body.authorization, saiSession)
          },
          status: 200,
          headers: {}
        };
      case RequestMessageTypes.REQUEST_AUTHORIZATION_USING_APPLICATION_NEEDS:
        await requestAccessUsingApplicationNeeds(body.applicationId, body.agentId, saiSession);
        return {
          body: {
            type: ResponseMessageTypes.REQUEST_ACCESS_USING_APPLICATION_NEEDS_CONFIRMTION,
            payload: null
          },
          status: 200,
          headers: {}
        };
      case RequestMessageTypes.RESOURCE_REQUEST: {
        const { id, lang } = body;
        return {
          body: {
            type: ResponseMessageTypes.RESOURCE_RESPONSE,
            payload: await getResource(saiSession, id, lang)
          },
          status: 200,
          headers: {}
        };
      }
      case RequestMessageTypes.SHARE_AUTHORIZATION: {
        const { shareAuthorization } = body;
        return {
          body: {
            type: ResponseMessageTypes.SHARE_AUTHORIZATION_CONFIRMATION,
            payload: await shareResource(saiSession, shareAuthorization)
          },
          status: 200,
          headers: {}
        };
      }
      case RequestMessageTypes.SOCIAL_AGENT_INVITATIONS_REQUEST: {
        return {
          body: {
            type: ResponseMessageTypes.SOCIAL_AGENT_INVITATIONS_RESPONSE,
            payload: await getSocialAgentInvitations(saiSession)
          },
          status: 200,
          headers: {}
        };
      }
      case RequestMessageTypes.CREATE_INVITATION: {
        return {
          body: {
            type: ResponseMessageTypes.INVITATION_REGISTRATION,
            payload: await createInvitation(saiSession, body)
          },
          status: 200,
          headers: {}
        };
      }
      case RequestMessageTypes.ACCEPT_INVITATION: {
        const socialAgent = await acceptInvitation(saiSession, body);
        const jobData: IReciprocalRegistrationsJobData = {
          webId: saiSession.webId,
          registeredAgent: socialAgent.id
        };
        await this.queue.add(jobData);
        return {
          body: {
            type: ResponseMessageTypes.SOCIAL_AGENT_RESPONSE,
            payload: socialAgent
          },
          status: 200,
          headers: {}
        };
      }
      default:
        throw new BadRequestHttpError();
    }
  }

  handle(context: AuthenticatedAuthnContext): Observable<HttpHandlerResponse> {
    return from(this.handleAsync(context));
  }
}
