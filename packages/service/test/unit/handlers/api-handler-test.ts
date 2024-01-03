// eslint-disable-next-line import/no-extraneous-dependencies
import { jest, describe, beforeEach, test, expect } from '@jest/globals';
import { Session } from '@inrupt/solid-client-authn-node';
import { BadRequestHttpError, HttpError, HttpHandlerRequest, HttpHandlerResponse } from '@digita-ai/handlersjs-http';
import { getLogger } from '@digita-ai/handlersjs-logging';

import { AuthorizationAgent } from '@janeirodigital/interop-authorization-agent';
import {
  AccessAuthorization,
  AgentType,
  Application,
  AuthorizationData,
  DataInstance,
  DataRegistry,
  RequestMessageTypes,
  Resource,
  ResponseMessageTypes,
  ShareAuthorizationConfirmation,
  SocialAgent,
  SocialAgentInvitation
} from '@janeirodigital/sai-api-messages';

import { ApiHandler, AuthenticatedAuthnContext, SessionManager } from '../../../src';
import { MockedQueue } from '../mocked-queue';
import * as services from '../../../src/services';

jest.mock('../../../src/services', () => ({
  getApplications: jest.fn(),
  getUnregisteredApplicationProfile: jest.fn(),
  getSocialAgents: jest.fn(),
  addSocialAgent: jest.fn(),
  getDataRegistries: jest.fn(),
  getDescriptions: jest.fn(),
  listDataInstances: jest.fn(),
  recordAuthorization: jest.fn(),
  requestAccessUsingApplicationNeeds: jest.fn(),
  getResource: jest.fn(),
  shareResource: jest.fn(),
  getSocialAgentInvitations: jest.fn(),
  initLogin: jest.fn(),
  createInvitation: jest.fn(),
  acceptInvitation: jest.fn()
}));

const mocked = jest.mocked(services);
const logger = getLogger();
const saiSession: AuthorizationAgent = {} as AuthorizationAgent;
const manager = {
  getSaiSession: jest.fn(() => saiSession),
  getOidcSession: jest.fn()
} as unknown as jest.Mocked<SessionManager>;

let apiHandler: ApiHandler;
let queue: MockedQueue;

const webId = 'https://alice.example';

const authn = {
  webId,
  clientId: 'https://frontend.example',
  authenticated: true,
  issuer: 'https://op.example'
};

const headers = { 'content-type': 'application/json' };

beforeEach(() => {
  manager.getSaiSession.mockClear();
  manager.getOidcSession.mockReset();
  queue = new MockedQueue('grants');
  apiHandler = new ApiHandler(manager, queue);
});

describe('hello', () => {
  test('when is logged in', (done) => {
    const oidcSession = { info: { isLoggedIn: true, webId } } as Session;
    const request = {
      headers,
      body: {
        type: RequestMessageTypes.HELLO_REQUEST
      }
    } as unknown as HttpHandlerRequest;
    const ctx = { request, authn, logger } as AuthenticatedAuthnContext;
    manager.getOidcSession.mockResolvedValueOnce(oidcSession);

    apiHandler.handle(ctx).subscribe({
      next: (response: HttpHandlerResponse) => {
        expect(response.status).toBe(200);
        expect(response.body.type).toBe(ResponseMessageTypes.HELLO_RESPONSE);
        expect(response.body.payload.isLoggedIn).toBe(true);
        expect(response.body.payload.completeRedirectUrl).toBeUndefined();
        expect(mocked.initLogin).not.toBeCalled();
        done();
      }
    });
  });

  test('when is not logged in', (done) => {
    const opRedirectUrl = 'https:/op.example/auth/?something';
    const oidcSession = {
      info: { isLoggedIn: false }
    } as unknown as Session;
    manager.getOidcSession.mockResolvedValueOnce(oidcSession);

    const request = {
      headers,
      body: {
        type: RequestMessageTypes.HELLO_REQUEST
      }
    } as unknown as HttpHandlerRequest;
    const ctx = { request, authn, logger } as AuthenticatedAuthnContext;
    mocked.initLogin.mockResolvedValueOnce(opRedirectUrl);
    apiHandler.handle(ctx).subscribe({
      next: (response: HttpHandlerResponse) => {
        expect(response.status).toBe(200);
        expect(response.body.type).toBe(ResponseMessageTypes.HELLO_RESPONSE);
        expect(response.body.payload.isLoggedIn).toBe(false);
        expect(response.body.payload.completeRedirectUrl).toBe(opRedirectUrl);
        expect(mocked.initLogin).toBeCalledTimes(1);
        done();
      }
    });
  });
});

describe('incorrect request', () => {
  test('should respond with 400 if not application/ld+json', (done) => {
    const request = {
      headers: { 'content-type': 'text/turtle' },
      body: '<a> <b> <c> .'
    } as unknown as HttpHandlerRequest;
    const ctx = { request, authn, logger } as AuthenticatedAuthnContext;

    apiHandler.handle(ctx).subscribe({
      error: (e: HttpError) => {
        expect(e).toBeInstanceOf(BadRequestHttpError);
        expect(e.message).toBe('wrong content-type');
        done();
      }
    });
  });

  test('should respond with 400 if nobody', (done) => {
    const request = {
      headers: { 'content-type': 'application/json' }
    } as unknown as HttpHandlerRequest;
    const ctx = { request, authn, logger } as AuthenticatedAuthnContext;

    apiHandler.handle(ctx).subscribe({
      error: (e: HttpError) => {
        expect(e).toBeInstanceOf(BadRequestHttpError);
        expect(e.message).toBe('body is required');
        done();
      }
    });
  });

  test('should respond with 400 if unsupported message type', (done) => {
    const request = {
      headers: { 'content-type': 'application/json' },
      body: {
        type: 'unsupported'
      }
    } as unknown as HttpHandlerRequest;
    const ctx = { request, authn, logger } as AuthenticatedAuthnContext;

    apiHandler.handle(ctx).subscribe({
      error: (e: HttpError) => {
        expect(e).toBeInstanceOf(BadRequestHttpError);
        done();
      }
    });
  });
});

describe('getApplications', () => {
  test('sucessful response', (done) => {
    const request = {
      headers,
      body: {
        type: RequestMessageTypes.APPLICATIONS_REQUEST
      }
    } as unknown as HttpHandlerRequest;
    const ctx = { request, authn, logger } as AuthenticatedAuthnContext;
    const applications = [] as unknown as Application[];
    mocked.getApplications.mockResolvedValueOnce(applications);

    apiHandler.handle(ctx).subscribe({
      next: (response: HttpHandlerResponse) => {
        expect(response.status).toBe(200);
        expect(response.body.type).toBe(ResponseMessageTypes.APPLICATIONS_RESPONSE);
        expect(response.body.payload).toBe(applications);
        expect(mocked.getApplications).toBeCalledTimes(1);
        done();
      }
    });
  });
});

describe('getUnregisteredApplicationProfile', () => {
  test('sucessful response', (done) => {
    const request = {
      headers,
      body: {
        type: RequestMessageTypes.UNREGISTERED_APPLICATION_PROFILE
      }
    } as unknown as HttpHandlerRequest;
    const ctx = { request, authn, logger } as AuthenticatedAuthnContext;
    const profile = {} as unknown as Partial<Application>;
    mocked.getUnregisteredApplicationProfile.mockResolvedValueOnce(profile);

    apiHandler.handle(ctx).subscribe({
      next: (response: HttpHandlerResponse) => {
        expect(response.status).toBe(200);
        expect(response.body.type).toBe(ResponseMessageTypes.UNREGISTERED_APPLICATION_PROFILE);
        expect(response.body.payload).toBe(profile);
        expect(mocked.getUnregisteredApplicationProfile).toBeCalledTimes(1);
        done();
      }
    });
  });
});

describe('getSocialAgents', () => {
  test('sucessful response', (done) => {
    const request = {
      headers,
      body: {
        type: RequestMessageTypes.SOCIAL_AGENTS_REQUEST
      }
    } as unknown as HttpHandlerRequest;
    const ctx = { request, authn, logger } as AuthenticatedAuthnContext;
    const socialAgents = [] as unknown as SocialAgent[];
    mocked.getSocialAgents.mockResolvedValueOnce(socialAgents);

    apiHandler.handle(ctx).subscribe({
      next: (response: HttpHandlerResponse) => {
        expect(response.status).toBe(200);
        expect(response.body.type).toBe(ResponseMessageTypes.SOCIAL_AGENTS_RESPONSE);
        expect(response.body.payload).toBe(socialAgents);
        expect(mocked.getSocialAgents).toBeCalledTimes(1);
        done();
      }
    });
  });
});

describe('addSocialAgent', () => {
  test('sucessful response', (done) => {
    const bobWebId = 'https://bob.example';
    const request = {
      headers,
      body: {
        type: RequestMessageTypes.ADD_SOCIAL_AGENT_REQUEST,
        webId: bobWebId,
        label: 'Bob',
        note: 'Funny fella'
      }
    } as unknown as HttpHandlerRequest;
    const ctx = { request, authn, logger } as AuthenticatedAuthnContext;

    const socialAgent = { id: bobWebId } as unknown as SocialAgent;
    mocked.addSocialAgent.mockResolvedValueOnce(socialAgent);

    apiHandler.handle(ctx).subscribe({
      next: (response: HttpHandlerResponse) => {
        expect(response.status).toBe(200);
        expect(response.body.type).toBe(ResponseMessageTypes.SOCIAL_AGENT_RESPONSE);
        expect(response.body.payload).toBe(socialAgent);

        const { webId, label, note } = request.body;
        expect(mocked.addSocialAgent).toBeCalledWith(saiSession, { webId, label, note });
        done();
      }
    });
  });
});

describe('getDataRegistries', () => {
  test('sucessful response', (done) => {
    const request = {
      headers,
      body: {
        type: RequestMessageTypes.DATA_REGISTRIES_REQUEST
      }
    } as unknown as HttpHandlerRequest;
    const ctx = { request, authn, logger } as AuthenticatedAuthnContext;
    const dataRegistries = [] as unknown as DataRegistry[];
    mocked.getDataRegistries.mockResolvedValueOnce(dataRegistries);

    apiHandler.handle(ctx).subscribe({
      next: (response: HttpHandlerResponse) => {
        expect(response.status).toBe(200);
        expect(response.body.type).toBe(ResponseMessageTypes.DATA_REGISTRIES_RESPONSE);
        expect(response.body.payload).toBe(dataRegistries);
        expect(mocked.getDataRegistries).toBeCalledTimes(1);
        done();
      }
    });
  });
});

describe('getDescriptions', () => {
  test('sucessful response', (done) => {
    const request = {
      headers,
      body: {
        type: RequestMessageTypes.DESCRIPTIONS_REQUEST,
        agentId: 'https://projectron.example',
        agentType: AgentType.Application,
        lang: 'en'
      }
    } as unknown as HttpHandlerRequest;
    const ctx = { request, authn, logger } as AuthenticatedAuthnContext;

    const authorizationData = {} as unknown as AuthorizationData;
    mocked.getDescriptions.mockResolvedValueOnce(authorizationData);

    apiHandler.handle(ctx).subscribe({
      next: (response: HttpHandlerResponse) => {
        expect(response.status).toBe(200);
        expect(response.body.type).toBe(ResponseMessageTypes.DESCRIPTIONS_RESPONSE);
        expect(response.body.payload).toBe(authorizationData);

        const { agentId, agentType, lang } = request.body;
        expect(mocked.getDescriptions).toBeCalledWith(agentId, agentType, lang, saiSession);
        done();
      }
    });
  });
});

describe('listDataInstances', () => {
  test('sucessful response', (done) => {
    const request = {
      headers,
      body: {
        type: RequestMessageTypes.LIST_DATA_INSTANCES_REQUEST,
        agentId: 'https://bob.example',
        registrationId: 'https://hr.acme.example/data/projects/'
      }
    } as unknown as HttpHandlerRequest;
    const ctx = { request, authn, logger } as AuthenticatedAuthnContext;

    const dataInstances = [] as unknown as DataInstance[];
    mocked.listDataInstances.mockResolvedValueOnce(dataInstances);

    apiHandler.handle(ctx).subscribe({
      next: (response: HttpHandlerResponse) => {
        expect(response.status).toBe(200);
        expect(response.body.type).toBe(ResponseMessageTypes.LIST_DATA_INSTANCES_RESPONSE);
        expect(response.body.payload).toBe(dataInstances);

        expect(mocked.listDataInstances).toBeCalledWith(request.body.agentId, request.body.registrationId, saiSession);
        done();
      }
    });
  });
});

describe('recordAuthorization', () => {
  test('sucessful response', (done) => {
    const request = {
      headers,
      body: {
        type: RequestMessageTypes.APPLICATION_AUTHORIZATION,
        authorization: {}
      }
    } as unknown as HttpHandlerRequest;
    const ctx = { request, authn, logger } as AuthenticatedAuthnContext;

    const accessAuthorization = {} as unknown as AccessAuthorization;
    mocked.recordAuthorization.mockResolvedValueOnce(accessAuthorization);

    apiHandler.handle(ctx).subscribe({
      next: (response: HttpHandlerResponse) => {
        expect(response.status).toBe(200);
        expect(response.body.type).toBe(ResponseMessageTypes.APPLICATION_AUTHORIZATION_REGISTERED);
        expect(response.body.payload).toBe(accessAuthorization);

        expect(mocked.recordAuthorization).toBeCalledWith(request.body.authorization, saiSession);
        done();
      }
    });
  });
});

describe('requestAccessUsingApplicationNeeds', () => {
  test('sucessful response', (done) => {
    const request = {
      headers,
      body: {
        type: RequestMessageTypes.REQUEST_AUTHORIZATION_USING_APPLICATION_NEEDS,
        applicationId: 'https://projectron.example',
        agentId: 'https://alice.example'
      }
    } as unknown as HttpHandlerRequest;
    const ctx = { request, authn, logger } as AuthenticatedAuthnContext;

    apiHandler.handle(ctx).subscribe({
      next: (response: HttpHandlerResponse) => {
        expect(response.status).toBe(200);
        expect(response.body.type).toBe(ResponseMessageTypes.REQUEST_ACCESS_USING_APPLICATION_NEEDS_CONFIRMTION);
        expect(response.body.payload).toBe(null);

        expect(mocked.requestAccessUsingApplicationNeeds).toBeCalledWith(
          request.body.applicationId,
          request.body.agentId,
          saiSession
        );
        done();
      }
    });
  });
});

describe('getResource', () => {
  test('sucessful response', (done) => {
    const request = {
      headers,
      body: {
        type: RequestMessageTypes.RESOURCE_REQUEST,
        id: 'some-resource=iri',
        lang: 'fr'
      }
    } as unknown as HttpHandlerRequest;
    const ctx = { request, authn, logger } as AuthenticatedAuthnContext;

    const resource = {} as unknown as Resource;
    mocked.getResource.mockResolvedValueOnce(resource);

    apiHandler.handle(ctx).subscribe({
      next: (response: HttpHandlerResponse) => {
        expect(response.status).toBe(200);
        expect(response.body.type).toBe(ResponseMessageTypes.RESOURCE_RESPONSE);
        expect(response.body.payload).toBe(resource);

        expect(mocked.getResource).toBeCalledWith(saiSession, request.body.id, request.body.lang);
        done();
      }
    });
  });
});

describe('shareResource', () => {
  test('sucessful response', (done) => {
    const request = {
      headers,
      body: {
        type: RequestMessageTypes.SHARE_AUTHORIZATION,
        shareAuthorization: {}
      }
    } as unknown as HttpHandlerRequest;
    const ctx = { request, authn, logger } as AuthenticatedAuthnContext;

    const confirmation = {} as unknown as ShareAuthorizationConfirmation;
    mocked.shareResource.mockResolvedValueOnce(confirmation);

    apiHandler.handle(ctx).subscribe({
      next: (response: HttpHandlerResponse) => {
        expect(response.status).toBe(200);
        expect(response.body.type).toBe(ResponseMessageTypes.SHARE_AUTHORIZATION_CONFIRMATION);
        expect(response.body.payload).toBe(confirmation);

        expect(mocked.shareResource).toBeCalledWith(saiSession, request.body.shareAuthorization);
        done();
      }
    });
  });
});

describe('getSocialAgentInvitations', () => {
  test('sucessful response', (done) => {
    const request = {
      headers,
      body: {
        type: RequestMessageTypes.SOCIAL_AGENT_INVITATIONS_REQUEST
      }
    } as unknown as HttpHandlerRequest;
    const ctx = { request, authn, logger } as AuthenticatedAuthnContext;
    const socialAgentInvitations = [] as unknown as SocialAgentInvitation[];
    mocked.getSocialAgentInvitations.mockResolvedValueOnce(socialAgentInvitations);

    apiHandler.handle(ctx).subscribe({
      next: (response: HttpHandlerResponse) => {
        expect(response.status).toBe(200);
        expect(response.body.type).toBe(ResponseMessageTypes.SOCIAL_AGENT_INVITATIONS_RESPONSE);
        expect(response.body.payload).toBe(socialAgentInvitations);
        expect(mocked.getSocialAgentInvitations).toBeCalledTimes(1);
        done();
      }
    });
  });
});

describe('createInvitation', () => {
  test('sucessful response', (done) => {
    const request = {
      headers,
      body: {
        type: RequestMessageTypes.CREATE_INVITATION
      }
    } as unknown as HttpHandlerRequest;
    const ctx = { request, authn, logger } as AuthenticatedAuthnContext;
    const socialAgentInvitation = {} as SocialAgentInvitation;
    mocked.createInvitation.mockResolvedValueOnce(socialAgentInvitation);

    apiHandler.handle(ctx).subscribe({
      next: (response: HttpHandlerResponse) => {
        expect(response.status).toBe(200);
        expect(response.body.type).toBe(ResponseMessageTypes.INVITATION_REGISTRATION);
        expect(response.body.payload).toBe(socialAgentInvitation);
        expect(mocked.createInvitation).toBeCalledWith(saiSession, request.body);
        done();
      }
    });
  });
});

describe('acceptInvitation', () => {
  test('sucessful response', (done) => {
    const request = {
      headers,
      body: {
        type: RequestMessageTypes.ACCEPT_INVITATION
      }
    } as unknown as HttpHandlerRequest;
    const ctx = { request, authn, logger } as AuthenticatedAuthnContext;
    const socialAgent = {} as SocialAgent;
    mocked.acceptInvitation.mockResolvedValueOnce(socialAgent);

    apiHandler.handle(ctx).subscribe({
      next: (response: HttpHandlerResponse) => {
        expect(response.status).toBe(200);
        expect(response.body.type).toBe(ResponseMessageTypes.SOCIAL_AGENT_RESPONSE);
        expect(response.body.payload).toBe(socialAgent);
        expect(mocked.acceptInvitation).toBeCalledWith(saiSession, request.body);
        done();
      }
    });
  });
});
