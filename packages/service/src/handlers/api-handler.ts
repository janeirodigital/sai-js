import { from, Observable } from 'rxjs';
import { BadRequestHttpError, HttpHandler, HttpHandlerResponse } from '@digita-ai/handlersjs-http';
import { getLogger } from '@digita-ai/handlersjs-logging';
import { RequestMessageTypes, ResponseMessageTypes } from '@janeirodigital/sai-api-messages';
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
  getSocialAgentInvitations
} from '../services';
import type { SaiContext } from '../models/http-solid-context';
import { validateContentType } from '../utils/http-validators';
import { IReciprocalRegistrationsJobData } from '../models/jobs';

export class ApiHandler extends HttpHandler {
  private logger = getLogger();

  constructor(private queue: IQueue) {
    super();
  }

  async handleAsync(context: SaiContext): Promise<HttpHandlerResponse> {
    validateContentType(context, 'application/json');
    const { body } = context.request;
    if (!body) {
      throw new BadRequestHttpError('body is required');
    }
    switch (body.type) {
      case RequestMessageTypes.APPLICATIONS_REQUEST:
        return {
          body: {
            type: ResponseMessageTypes.APPLICATIONS_RESPONSE,
            payload: await getApplications(context.saiSession)
          },
          status: 200,
          headers: {}
        };
      case RequestMessageTypes.UNREGISTERED_APPLICATION_PROFILE:
        return {
          body: {
            type: ResponseMessageTypes.UNREGISTERED_APPLICATION_PROFILE,
            payload: await getUnregisteredApplicationProfile(context.saiSession, body.id)
          },
          status: 200,
          headers: {}
        };
      case RequestMessageTypes.SOCIAL_AGENTS_REQUEST:
        return {
          body: {
            type: ResponseMessageTypes.SOCIAL_AGENTS_RESPONSE,
            payload: await getSocialAgents(context.saiSession)
          },
          status: 200,
          headers: {}
        };
      case RequestMessageTypes.ADD_SOCIAL_AGENT_REQUEST: {
        // eslint-disable-next-line no-case-declarations
        const { webId, label, note } = body;
        // eslint-disable-next-line no-case-declarations
        const socialAgent = await addSocialAgent(context.saiSession, { webId, label, note });
        // eslint-disable-next-line no-case-declarations
        const jobData: IReciprocalRegistrationsJobData = {
          webId: context.saiSession.webId,
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
            payload: await getDataRegistries(body.agentId, body.lang, context.saiSession)
          },
          status: 200,
          headers: {}
        };
      case RequestMessageTypes.DESCRIPTIONS_REQUEST:
        return {
          body: {
            type: ResponseMessageTypes.DESCRIPTIONS_RESPONSE,
            payload: await getDescriptions(body.agentId, body.agentType, body.lang, context.saiSession)
          },
          status: 200,
          headers: {}
        };
      case RequestMessageTypes.LIST_DATA_INSTANCES_REQUEST:
        return {
          body: {
            type: ResponseMessageTypes.LIST_DATA_INSTANCES_RESPONSE,
            payload: await listDataInstances(body.agentId, body.registrationId, context.saiSession)
          },
          status: 200,
          headers: {}
        };
      case RequestMessageTypes.APPLICATION_AUTHORIZATION:
        return {
          body: {
            type: ResponseMessageTypes.APPLICATION_AUTHORIZATION_REGISTERED,
            payload: await recordAuthorization(body.authorization, context.saiSession)
          },
          status: 200,
          headers: {}
        };
      case RequestMessageTypes.REQUEST_AUTHORIZATION_USING_APPLICATION_NEEDS:
        await requestAccessUsingApplicationNeeds(body.applicationId, body.agentId, context.saiSession);
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
            payload: await getResource(context.saiSession, id, lang)
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
            payload: await shareResource(context.saiSession, shareAuthorization)
          },
          status: 200,
          headers: {}
        };
      }
      case RequestMessageTypes.SOCIAL_AGENT_INVITATIONS_REQUEST: {
        return {
          body: {
            type: ResponseMessageTypes.SOCIAL_AGENT_INVITATIONS_RESPONSE,
            payload: await getSocialAgentInvitations(context.saiSession)
          },
          status: 200,
          headers: {}
        };
      }
      case RequestMessageTypes.CREATE_INVITATION: {
        return {
          body: {
            type: ResponseMessageTypes.INVITATION_REGISTRATION,
            payload: await createInvitation(context.saiSession, body)
          },
          status: 200,
          headers: {}
        };
      }
      case RequestMessageTypes.ACCEPT_INVITATION: {
        const socialAgent = await acceptInvitation(context.saiSession, body);
        const jobData: IReciprocalRegistrationsJobData = {
          webId: context.saiSession.webId,
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

  handle(context: SaiContext): Observable<HttpHandlerResponse> {
    return from(this.handleAsync(context));
  }
}
