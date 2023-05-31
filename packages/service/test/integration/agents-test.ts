import { jest } from '@jest/globals';
import { lastValueFrom } from 'rxjs';
import { ComponentsManager } from 'componentsjs';
import { Server } from '@digita-ai/handlersjs-http';
import {
  createSolidTokenVerifier,
  SolidAccessTokenPayload,
  SolidTokenVerifierFunction
} from '@solid/access-token-verifier';
import { MockedSessionManager } from '@janeirodigital/sai-server-mocks';
import { AuthorizationAgent } from '@janeirodigital/interop-authorization-agent';
import { INTEROP } from '@janeirodigital/interop-namespaces';
import { baseUrl, agentRedirectUrl, encodeWebId, webId2agentUrl } from '../../src/url-templates';
import { createTestServer } from './components-builder';

jest.setTimeout(50000);

jest.mock('@solid/access-token-verifier', () => {
  return {
    createSolidTokenVerifier: jest.fn()
  };
});
const mockedCreateSolidTokenVerifier = jest.mocked(createSolidTokenVerifier);

let server: Server;
let componentsManager: ComponentsManager<Server>;
let manager: MockedSessionManager;

const webId = 'https://alice.example';
const encodedWebId = encodeWebId(webId);
const agentUrl = webId2agentUrl(webId);
const redirectUrl = agentRedirectUrl(agentUrl);
const dpopProof = 'dpop-proof';
const authorization = 'DPoP some-token';
const clientId = 'https://projectron.example';

beforeAll(async () => {
  const created = await createTestServer();
  server = created.server;
  componentsManager = created.componentsManager;
  await lastValueFrom(server.start());
  const instanceRegistry = await componentsManager.configConstructorPool.getInstanceRegistry();
  manager = (await instanceRegistry['urn:ssv:SessionManager']) as unknown as MockedSessionManager;
});

afterAll(async () => {
  await lastValueFrom(server.stop());
});

beforeEach(async () => {
  mockedCreateSolidTokenVerifier.mockReset();
});

describe('unauthenticated request', () => {
  const path = `/agents/${encodedWebId}`;
  const url = `${baseUrl}${path}`;

  test('should contain valid Client ID Document', async () => {
    const response = await fetch(url, {
      method: 'GET'
    });
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/ld+json');

    const document = await response.json();
    expect(document.client_id).toContain(agentUrl);
    expect(document.redirect_uris).toContain(redirectUrl);
    expect(document.grant_types).toEqual(expect.arrayContaining(['authorization_code', 'refresh_token']));
  });
});

// This is handled by AuthnContextHandler
describe('request without client_id', () => {
  const path = `/agents/${encodedWebId}`;
  const url = `${baseUrl}${path}`;

  test('should respond 401 when applicationId from token is undefined', async () => {
    mockedCreateSolidTokenVerifier.mockImplementation(() => {
      return async function verifier(authorizationHeader, dpop) {
        expect(authorizationHeader).toBe(authorization);
        expect(dpop).toEqual({
          header: dpopProof,
          method: 'GET',
          url
        });
        return { webid: webId } as SolidAccessTokenPayload;
      } as SolidTokenVerifierFunction;
    });
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        DPoP: dpopProof,
        Authorization: authorization
      }
    });

    expect(response.ok).toBeFalsy();
    expect(response.status).toBe(401);
  });
});

describe('authenticated request', () => {
  const path = `/agents/${encodedWebId}`;
  const url = `${baseUrl}${path}`;
  const headers = {
    DPoP: dpopProof,
    Authorization: authorization
  };

  test('application registration discovery', async () => {
    const applicationRegistrationIri = 'https://some.example/application-registration';

    mockedCreateSolidTokenVerifier.mockImplementation(() => {
      return async function verifier(authorizationHeader, dpop) {
        expect(authorizationHeader).toBe(authorization);
        expect(dpop).toEqual({
          header: dpopProof,
          method: 'GET',
          url
        });
        return { webid: webId, client_id: clientId } as SolidAccessTokenPayload;
      } as SolidTokenVerifierFunction;
    });

    manager.getSaiSession.mockImplementationOnce(async (webId) => {
      return {
        webId,
        findApplicationRegistration: async (applicationId) => {
          expect(applicationId).toBe(clientId);
          return { iri: applicationRegistrationIri };
        }
      } as AuthorizationAgent;
    });

    const response = await fetch(url, {
      method: 'GET',
      headers
    });
    expect(manager.getSaiSession).toBeCalledWith(webId);
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    expect(response.headers.get('Link')).toBe(
      `<${clientId}>; anchor="${applicationRegistrationIri}"; rel="${INTEROP.registeredAgent.value}"`
    );
  });

  test('social agent registration discovery', async () => {
    const differentWebId = 'https://different-user.example/';
    const socialAgentRegistrationIri = 'https://some.example/application-registration';

    mockedCreateSolidTokenVerifier.mockImplementation(() => {
      return async function verifier(authorizationHeader, dpop) {
        expect(authorizationHeader).toBe(authorization);
        expect(dpop).toEqual({
          header: dpopProof,
          method: 'GET',
          url
        });
        return { webid: differentWebId, client_id: clientId } as SolidAccessTokenPayload;
      } as SolidTokenVerifierFunction;
    });

    manager.getSaiSession.mockImplementation(async (webId) => {
      return {
        webId,
        findSocialAgentRegistration: async (webid) => {
          expect(webid).toBe(differentWebId);
          return { iri: socialAgentRegistrationIri };
        }
      } as AuthorizationAgent;
    });

    const response = await fetch(url, {
      method: 'GET',
      headers
    });

    expect(manager.getSaiSession).toBeCalledWith(webId);
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    expect(response.headers.get('Link')).toBe(
      `<${differentWebId}>; anchor="${socialAgentRegistrationIri}"; rel="${INTEROP.registeredAgent.value}"`
    );
  });
});
