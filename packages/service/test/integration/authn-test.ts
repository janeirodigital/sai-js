import { jest } from '@jest/globals';
import { ComponentsManager } from 'componentsjs';
import { lastValueFrom } from 'rxjs';
import { Server } from '@digita-ai/handlersjs-http';
import { MockedSessionManager } from '@janeirodigital/sai-server-mocks';
import { baseUrl, agentRedirectUrl, frontendUrl, webId2agentUrl } from '../../src/url-templates';
import { createTestServer } from './components-builder';

import {
  createSolidTokenVerifier,
  SolidAccessTokenPayload,
  SolidTokenVerifierFunction
} from '@solid/access-token-verifier';
jest.mock('@solid/access-token-verifier', () => {
  return {
    createSolidTokenVerifier: jest.fn()
  };
});
const mockedCreateSolidTokenVerifier = jest.mocked(createSolidTokenVerifier);

import { Session } from '@inrupt/solid-client-authn-node';

jest.setTimeout(50000);

let server: Server;
let componentsManager: ComponentsManager<Server>;
let manager: MockedSessionManager;

const webId = 'https://alice.example';
const agentUrl = webId2agentUrl(webId);

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

// This is handled by AuthnContextHandler
test('should respond 401 for unauthenticated request', async () => {
  const response = await fetch(`${baseUrl}/login`, {
    method: 'POST'
  });
  expect(response.ok).toBeFalsy();
  expect(response.status).toBe(401);
});

describe('authenticated request', () => {
  const dpopProof = 'dpop-proof';
  const authorization = 'DPoP some-token';
  const path = '/login';
  const url = `${baseUrl}${path}`;
  const clientId = 'https://projectron.example';
  beforeEach(() => {
    mockedCreateSolidTokenVerifier.mockImplementation(() => {
      return async function verifier(authorizationHeader, dpop) {
        expect(authorizationHeader).toBe(authorization);
        expect(dpop).toEqual({
          header: dpopProof,
          method: 'POST',
          url
        });
        return { webid: webId, client_id: clientId } as SolidAccessTokenPayload;
      } as SolidTokenVerifierFunction;
    });
    manager.getOidcSession.mockReset();
  });

  test('should respond 400 if not json content type', async () => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        DPoP: dpopProof,
        Authorization: authorization
      }
    });
    expect(response.ok).toBeFalsy();
    expect(response.status).toBe(400);
  });

  test('should respond 400 if json content type but idp not specified', async () => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        DPoP: dpopProof,
        Authorization: authorization,
        'Content-Type': 'application/json'
      }
    });
    expect(response.ok).toBeFalsy();
    expect(response.status).toBe(400);
  });

  test('should respond with 204 No Content status when already logged in', async () => {
    const idp = 'https://op.example';
    const opRedirectUrl = 'https:/op.example/auth/?something';
    const loginMock = jest.fn(async (loginOptions: any) => {
      loginOptions.handleRedirect(opRedirectUrl);
    });
    manager.getOidcSession.mockImplementationOnce(async (sessionId: string) => {
      expect(sessionId).toBe(webId);
      return {
        info: {
          isLoggedIn: true,
          sessionId: webId
        },
        login: loginMock
      } as unknown as Session;
    });
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        DPoP: dpopProof,
        Authorization: authorization,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ idp })
    });
    expect(response.ok).toBeTruthy();
    expect(response.status).toBe(204);
    const payload = await response.text();
    expect(payload).toBeFalsy();
    expect(loginMock).toBeCalledTimes(0);
  });

  test('should respond with url for redirecting', async () => {
    const idp = 'https://op.example';
    const opRedirectUrl = 'https:/op.example/auth/?something';
    const loginMock = jest.fn(async (loginOptions: any) => {
      loginOptions.handleRedirect(opRedirectUrl);
    });
    const mockedOidcSession = {
      info: { sessionId: webId },
      login: loginMock
    } as unknown as Session;
    manager.getOidcSession.mockImplementationOnce(async (sessionId: string) => {
      expect(sessionId).toBe(webId);
      return mockedOidcSession;
    });
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        DPoP: dpopProof,
        Authorization: authorization,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ idp })
    });
    expect(response.ok).toBeTruthy();
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.redirectUrl).toBe(opRedirectUrl);
    expect(loginMock).toHaveBeenCalledWith(
      expect.objectContaining({
        oidcIssuer: idp
      })
    );
  });
});

describe('login-redirect', () => {
  const url = agentRedirectUrl(agentUrl);

  beforeEach(() => {
    manager.getOidcSession.mockReset();
  });

  test('responds 500 if oidc session handling throws', async () => {
    const handleIncomingRedirectMock = jest.fn(async (url: string) => {
      throw new Error('boom!');
    });
    manager.getOidcSession.mockImplementationOnce(async (sessionId: string) => {
      return {
        handleIncomingRedirect: handleIncomingRedirectMock
      } as unknown as Session;
    });

    const response = await fetch(url);
    expect(manager.getOidcSession).toBeCalledWith(webId);
    expect(handleIncomingRedirectMock).toBeCalledTimes(1);
    expect(response.ok).toBeFalsy();
    expect(response.status).toBe(500);
  });

  test('responds 500 if oidc session handling of incoming redirect failed', async () => {
    const handleIncomingRedirectMock = jest.fn(async (url: string) => {
      return undefined;
    });
    manager.getOidcSession.mockImplementationOnce(async (sessionId: string) => {
      return {
        info: {
          sessionId,
          isLoggedIn: false
        },
        handleIncomingRedirect: handleIncomingRedirectMock
      } as unknown as Session;
    });

    const response = await fetch(url);
    expect(manager.getOidcSession).toBeCalledWith(webId);
    expect(handleIncomingRedirectMock).toBeCalledTimes(1);
    expect(response.ok).toBeFalsy();
    expect(response.status).toBe(500);
  });

  test('responds 302 when successful', async () => {
    const handleIncomingRedirectMock = jest.fn(async (url: string) => {
      return undefined;
    });
    manager.getOidcSession.mockImplementationOnce(async (sessionId: string) => {
      return {
        info: {
          sessionId,
          webId,
          isLoggedIn: true
        },
        handleIncomingRedirect: handleIncomingRedirectMock
      } as unknown as Session;
    });

    const response = await fetch(url, { redirect: 'manual' });
    expect(manager.getOidcSession).toBeCalledWith(webId);
    expect(handleIncomingRedirectMock).toBeCalledTimes(1);
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe(frontendUrl);
  });
});
