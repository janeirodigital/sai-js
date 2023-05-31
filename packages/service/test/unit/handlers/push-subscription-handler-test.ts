import { jest } from '@jest/globals';
import type { PushSubscription } from 'web-push';
import { InMemoryStorage } from '@inrupt/solid-client-authn-node';
import { BadRequestHttpError, HttpError, HttpHandlerRequest } from '@digita-ai/handlersjs-http';

import { PushSubscriptionHandler, AuthenticatedAuthnContext } from '../../../src';

import { SessionManager } from '../../../src/session-manager';
jest.mock('../../../src/session-manager', () => {
  return {
    SessionManager: jest.fn(() => {
      return {
        addPushSubscription: jest.fn()
      };
    })
  };
});

let pushSubscriptionHandler: PushSubscriptionHandler;
const sessionManager = jest.mocked(new SessionManager(new InMemoryStorage()));

const aliceWebId = 'https://alice.example';

const authn = {
  webId: aliceWebId,
  clientId: 'https://projectron.example'
};

beforeEach(() => {
  pushSubscriptionHandler = new PushSubscriptionHandler(sessionManager);
  sessionManager.addPushSubscription.mockReset();
});

test('should respond with 400 if not application/json', (done) => {
  const request = {
    headers: {},
    body: { beep: 'boop' }
  } as unknown as HttpHandlerRequest;
  const ctx = { request, authn } as AuthenticatedAuthnContext;

  pushSubscriptionHandler.handle(ctx).subscribe({
    error: (e: HttpError) => {
      expect(e).toBeInstanceOf(BadRequestHttpError);
      done();
    }
  });
});

test('should respond with 400 if no body', (done) => {
  const request = {
    headers: { 'content-type': 'application/json' }
  } as unknown as HttpHandlerRequest;
  const ctx = { request, authn } as AuthenticatedAuthnContext;

  pushSubscriptionHandler.handle(ctx).subscribe({
    error: (e: HttpError) => {
      expect(e).toBeInstanceOf(BadRequestHttpError);
      done();
    }
  });
});

test('should add the subscription', (done) => {
  const request = {
    headers: { 'content-type': 'application/json' },
    body: { endpoint: 'https://endpoint.example' } as PushSubscription
  } as unknown as HttpHandlerRequest;
  const ctx = { request, authn } as AuthenticatedAuthnContext;

  pushSubscriptionHandler.handle(ctx).subscribe((response) => {
    expect(sessionManager.addPushSubscription).toBeCalledWith(aliceWebId, request.body);
    expect(response.status).toBe(204);
    done();
  });
});
