// eslint-disable-next-line import/no-extraneous-dependencies
import { jest, beforeEach, test, expect } from '@jest/globals';
import { InMemoryStorage, Session } from '@inrupt/solid-client-authn-node';
import { HttpHandlerContext, HttpHandlerRequest } from '@digita-ai/handlersjs-http';

import { AuthorizationAgent } from '@janeirodigital/interop-authorization-agent';
import { MockedQueue } from '../mocked-queue';
import { LoginRedirectHandler, frontendUrl, baseUrl, encodeWebId } from '../../../src';

import { SessionManager } from '../../../src/session-manager';

jest.mock('../../../src/session-manager', () => ({
  SessionManager: jest.fn(() => ({
    getOidcSession: jest.fn(),
    getSaiSession: jest.fn()
  }))
}));

let loginRedirectHandler: LoginRedirectHandler;
const manager = jest.mocked(new SessionManager(new InMemoryStorage()));
const queue = new MockedQueue('access-inbox');

const aliceWebId = 'https://alice.example';
const encodedWebId = encodeWebId(aliceWebId);

beforeEach(() => {
  loginRedirectHandler = new LoginRedirectHandler(manager, queue);
  manager.getOidcSession.mockReset();
});

test('redirects to frontend after handing a valid redirect', (done) => {
  const pathname = '/agents/123/redirect';
  const search = 'code=some-code&state=some-state';
  const request = {
    headers: {},
    parameters: { encodedWebId },
    url: new URL(pathname + search, baseUrl)
  } as unknown as HttpHandlerRequest;
  const ctx = { request } as HttpHandlerContext;

  const handleIncomingRedirectMock = jest.fn(async (completeUrl) => {
    expect(completeUrl).toContain(request.url.pathname + request.url.search);
  });

  manager.getOidcSession.mockImplementationOnce(async (id: string) => {
    expect(id).toBe(aliceWebId);
    return {
      handleIncomingRedirect: handleIncomingRedirectMock,
      info: {
        isLoggedIn: true,
        webId: aliceWebId
      }
    } as unknown as Session;
  });

  manager.getSaiSession.mockImplementationOnce(async (id: string) => {
    expect(id).toBe(aliceWebId);
    return {
      socialAgentRegistrations: []
    } as unknown as AuthorizationAgent;
  });

  loginRedirectHandler.handle(ctx).subscribe((response) => {
    expect(manager.getOidcSession).toBeCalledTimes(1);
    expect(handleIncomingRedirectMock).toBeCalledTimes(1);
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe(frontendUrl);
    done();
  });
});
