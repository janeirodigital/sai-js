import { jest } from '@jest/globals';
import { Mock } from 'jest-mock';
import { InMemoryStorage, Session } from '@inrupt/solid-client-authn-node';
import { HttpError, BadRequestHttpError, HttpHandlerRequest } from '@digita-ai/handlersjs-http';
import { agentRedirectUrl, AuthenticatedAuthnContext, LoginHandler, webId2agentUrl } from '../../../src';

import { SessionManager } from '../../../src/session-manager';

jest.mock('../../../src/session-manager', () => {
  return {
    SessionManager: jest.fn(() => {
      return {
        getOidcSession: jest.fn()
      };
    })
  };
});

jest.mock('@inrupt/solid-client-authn-node');
const MockedSession = Session as jest.MockedFunction<any>;

const idp = 'https://op.example';
let loginHandler: LoginHandler;
const manager = jest.mocked(new SessionManager(new InMemoryStorage()));

beforeEach(() => {
  loginHandler = new LoginHandler(manager);
});

describe('authenticated request', () => {
  const aliceWebId = 'https://alice.example';
  const authn = {
    webId: aliceWebId,
    clientId: 'https://projectron.example'
  };
  const opRedirectUrl = 'https:/op.example/auth/?something';
  const agentUrl = webId2agentUrl(authn.webId);

  let loginMock: Mock;
  beforeEach(() => {
    manager.getOidcSession.mockReset();
    MockedSession.mockReset();
    loginMock = jest.fn(async (loginOptions: any) => {
      loginOptions.handleRedirect(opRedirectUrl);
    });
    loginHandler = new LoginHandler(manager);
  });

  test('should respond with 400 if not application/json', (done) => {
    const request = {
      headers: {}
    } as unknown as HttpHandlerRequest;
    const ctx = { request, authn } as AuthenticatedAuthnContext;

    loginHandler.handle(ctx).subscribe({
      error: (e: HttpError) => {
        expect(e).toBeInstanceOf(BadRequestHttpError);
        done();
      }
    });
  });

  test('should respond with 400 if not idp provided', (done) => {
    const request = {
      headers: {
        'content-type': 'application/json'
      }
    } as unknown as HttpHandlerRequest;
    const ctx = { request, authn } as AuthenticatedAuthnContext;

    loginHandler.handle(ctx).subscribe({
      error: (e: HttpError) => {
        expect(e).toBeInstanceOf(BadRequestHttpError);
        done();
      }
    });
  });

  test('should respond 204 if already logged in', (done) => {
    const request = {
      headers: {
        'content-type': 'application/json'
      },
      body: { idp }
    } as unknown as HttpHandlerRequest;
    const ctx = { request, authn } as AuthenticatedAuthnContext;
    manager.getOidcSession.mockImplementationOnce(async (webId) => {
      expect(webId).toBe(aliceWebId);
      return {
        info: {
          webId: aliceWebId,
          isLoggedIn: true
        },
        login: loginMock
      } as unknown as Session;
    });
    loginHandler.handle(ctx).subscribe((response) => {
      expect(response.status).toBe(204);
      expect(response.body).toBeUndefined();
      expect(manager.getOidcSession).toBeCalledTimes(1);
      expect(loginMock).toHaveBeenCalledTimes(0);
      done();
    });
  });

  test('correctly initiate login on oidc session', (done) => {
    const request = {
      headers: {
        'content-type': 'application/json'
      },
      body: { idp }
    } as unknown as HttpHandlerRequest;
    const ctx = { request, authn } as AuthenticatedAuthnContext;
    const mockOidcSession = {
      info: {
        sessionId: aliceWebId,
        webId: aliceWebId
      },
      login: loginMock
    } as unknown as Session;

    manager.getOidcSession.mockImplementationOnce(async (webId) => {
      expect(webId).toBe(aliceWebId);
      return mockOidcSession;
    });
    loginHandler.handle(ctx).subscribe((response) => {
      expect(response.status).toBe(200);
      expect(response.body?.redirectUrl).toBe(opRedirectUrl);
      expect(manager.getOidcSession).toBeCalledTimes(1);
      expect(loginMock).toHaveBeenCalledWith(
        expect.objectContaining({
          oidcIssuer: idp,
          clientId: agentUrl,
          redirectUrl: agentRedirectUrl(agentUrl)
        })
      );
      done();
    });
  });
});
