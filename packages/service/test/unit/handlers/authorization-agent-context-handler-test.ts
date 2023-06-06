import { AuthenticatedAuthnContext, AuthorizationAgentContextHandler, SessionManager } from '../../../src';
import { InMemoryStorage } from '@inrupt/solid-client-authn-node';
import { InternalServerError, UnauthorizedHttpError } from '@digita-ai/handlersjs-http';

jest.mock('../../../src/session-manager');
jest.mock('@inrupt/solid-client-authn-node');

describe('AuthorizationAgentContextHandler', () => {
  let authorizationAgentContextHandler: AuthorizationAgentContextHandler;
  const manager = new SessionManager(new InMemoryStorage());

  beforeEach(() => {
    authorizationAgentContextHandler = new AuthorizationAgentContextHandler(manager);
  });

  test('retrieves the right session from manager', (done) => {
    manager.getSaiSession = jest.fn().mockReturnValueOnce(Promise.resolve(Object()));

    const webId = 'http://me.id';
    const ctx = { authn: { webId, authenticated: true } } as AuthenticatedAuthnContext;
    authorizationAgentContextHandler.handle(ctx).subscribe(() => {
      expect(manager.getSaiSession).toBeCalledWith(webId);
      done();
    });
  });

  test('adds the session to the new context', (done) => {
    manager.getSaiSession = jest.fn().mockReturnValueOnce(Promise.resolve(Object()));
    const webId = 'http://me.id';

    const ctx = { authn: { webId, authenticated: true } } as AuthenticatedAuthnContext;
    authorizationAgentContextHandler.handle(ctx).subscribe((nextCtx) => {
      expect(nextCtx.saiSession).toEqual(Object());
      done();
    });
  });

  test('throws with InternalServerError if the session is not found', (done) => {
    manager.getSaiSession = jest.fn().mockReturnValueOnce(Promise.resolve(undefined));
    const webId = 'http://me.id';

    const ctx = { authn: { webId, authenticated: true } } as AuthenticatedAuthnContext;

    authorizationAgentContextHandler.handle(ctx).subscribe({
      error(e: Error) {
        expect(e).toBeInstanceOf(InternalServerError);
        done();
      }
    });
  });
});
