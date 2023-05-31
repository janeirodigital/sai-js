import {
  AgentsHandler,
  SessionManager,
  agentRedirectUrl,
  UnauthenticatedAuthnContext,
  AuthenticatedAuthnContext,
  webId2agentUrl,
  encodeWebId
} from '../../../src';
import { jest } from '@jest/globals';

jest.mock('../../../src/session-manager', () => {
  const originalModule = jest.requireActual('../../../src/session-manager') as object;

  return {
    ...originalModule,
    SessionManager: jest.fn(() => {
      return {
        getSaiSession: jest.fn()
      };
    })
  };
});

import { AuthorizationAgent } from '@janeirodigital/interop-authorization-agent';
import { INTEROP } from '@janeirodigital/interop-namespaces';
import { InMemoryStorage } from '@inrupt/solid-client-authn-node';
import { HttpHandlerRequest } from '@digita-ai/handlersjs-http';

const aliceWebId = 'https://alice.example';
const aliceAgentUrl = webId2agentUrl(aliceWebId);

const manager = jest.mocked(new SessionManager(new InMemoryStorage()));
let agentsHandler: AgentsHandler;

beforeEach(() => {
  manager.getSaiSession.mockReset();
  agentsHandler = new AgentsHandler(manager);
});

describe('unauthenticated request', () => {
  test('should contain valid Client ID Document', (done) => {
    const request = {
      headers: {},
      url: aliceAgentUrl
    } as unknown as HttpHandlerRequest;
    const authn = {
      authenticated: false
    };
    const ctx = { request, authn } as UnauthenticatedAuthnContext;

    agentsHandler.handle(ctx).subscribe((response) => {
      expect(response.body.client_id).toContain(encodeWebId(aliceWebId));
      expect(response.body.redirect_uris).toContain(agentRedirectUrl(aliceAgentUrl));
      expect(response.body.grant_types).toEqual(expect.arrayContaining(['authorization_code', 'refresh_token']));
      done();
    });
  });
});

describe('authenticated request', () => {
  const clientId = 'https://client.example/';

  const authn = {
    authenticated: true,
    webId: aliceWebId,
    clientId
  };

  test('application registration discovery', (done) => {
    const applicationRegistrationIri = 'https://some.example/application-registration';

    manager.getSaiSession.mockImplementation(async (webId) => {
      return {
        webId,
        findApplicationRegistration: async (applicationId) => {
          expect(applicationId).toBe(clientId);
          return { iri: applicationRegistrationIri };
        }
      } as AuthorizationAgent;
    });

    const request = {
      url: aliceAgentUrl
    } as unknown as HttpHandlerRequest;

    const ctx = { request, authn } as AuthenticatedAuthnContext;

    agentsHandler.handle(ctx).subscribe((response) => {
      expect(manager.getSaiSession).toBeCalledWith(aliceWebId);
      expect(response.headers.Link).toBe(
        `<${clientId}>; anchor="${applicationRegistrationIri}"; rel="${INTEROP.registeredAgent.value}"`
      );
      done();
    });
  });

  test('social agent registration discovery', (done) => {
    const bobWebId = 'https://bob.example/';
    const socialAgentRegistrationIri = 'https://some.example/application-registration';

    manager.getSaiSession.mockImplementation(async (webId) => {
      return {
        webId,
        findSocialAgentRegistration: async (webid) => {
          expect(webid).toBe(bobWebId);
          return { iri: socialAgentRegistrationIri };
        }
      } as AuthorizationAgent;
    });

    const request = {
      url: aliceAgentUrl
    } as unknown as HttpHandlerRequest;

    const authn = {
      authenticated: true,
      webId: bobWebId,
      clientId
    };

    const ctx = { request, authn: authn } as AuthenticatedAuthnContext;

    agentsHandler.handle(ctx).subscribe((response) => {
      expect(manager.getSaiSession).toBeCalledWith(aliceWebId);
      expect(response.headers.Link).toBe(
        `<${bobWebId}>; anchor="${socialAgentRegistrationIri}"; rel="${INTEROP.registeredAgent.value}"`
      );
      done();
    });
  });
});
