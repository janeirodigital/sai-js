import { beforeEach, test, expect } from '@jest/globals';
import { BadRequestHttpError, HttpError, HttpHandlerRequest, UnauthorizedHttpError } from '@digita-ai/handlersjs-http';

import { MockedQueue } from '../mocked-queue';
import {
  WebHooksHandler,
  AuthenticatedAuthnContext,
  encodeWebId,
  IDelegatedGrantsJobData,
  IPushNotificationsJobData
} from '../../../src';

let webHooksHandler: WebHooksHandler;
let grantsQueue: MockedQueue;
let pushQueue: MockedQueue;

const aliceWebId = 'https://alice.example';
const bobWebId = 'https://bob.example';

const authn = {
  webId: bobWebId,
  clientId: 'https://pub.example'
};

beforeEach(() => {
  grantsQueue = new MockedQueue('grants');
  pushQueue = new MockedQueue('push');
  webHooksHandler = new WebHooksHandler(grantsQueue, pushQueue);
});

test('should respond with 400 if not application/ld+json', (done) => {
  const request = {
    headers: { 'content-type': 'text/turtle' }
  } as unknown as HttpHandlerRequest;
  const ctx = { request, authn } as AuthenticatedAuthnContext;

  webHooksHandler.handle(ctx).subscribe({
    error: (e: HttpError) => {
      expect(e).toBeInstanceOf(BadRequestHttpError);
      done();
    }
  });
});

test.skip('should respond with 403 if not authorized', (done) => {
  const request = {
    headers: { 'content-type': 'application/ld+json' },
    parameters: {
      encodedWebId: encodeWebId(aliceWebId),
      encodedPeerWebId: encodeWebId('https://jane.example')
    }
  } as unknown as HttpHandlerRequest;
  const ctx = { request, authn } as AuthenticatedAuthnContext;

  webHooksHandler.handle(ctx).subscribe({
    error: (e: HttpError) => {
      expect(e).toBeInstanceOf(UnauthorizedHttpError);
      done();
    }
  });
});

test.skip('should respond with Bad Request if invalid notification', (done) => {
  const request = {
    headers: { 'content-type': 'application/ld+json' },
    parameters: {
      encodedWebId: encodeWebId(aliceWebId),
      encodedPeerWebId: encodeWebId(bobWebId)
    },
    body: { beep: 'boop' }
  } as unknown as HttpHandlerRequest;
  const ctx = { request, authn } as AuthenticatedAuthnContext;

  webHooksHandler.handle(ctx).subscribe({
    error: (e: HttpError) => {
      expect(e).toBeInstanceOf(BadRequestHttpError);
      done();
    }
  });
});

test('should add both jobs on Update', (done) => {
  const request = {
    headers: { 'content-type': 'application/ld+json' },
    parameters: {
      encodedWebId: encodeWebId(aliceWebId),
      encodedPeerWebId: encodeWebId(bobWebId)
    },
    // TODO: body should be parsed in middleware
    body: JSON.stringify({ type: 'Update' })
  } as unknown as HttpHandlerRequest;
  const ctx = { request, authn } as AuthenticatedAuthnContext;

  webHooksHandler.handle(ctx).subscribe({
    next: (response) => {
      expect(response.status).toBe(200);
      expect(pushQueue.add).toBeCalledWith({
        webId: aliceWebId,
        registeredAgent: bobWebId
      } as IPushNotificationsJobData);
      expect(grantsQueue.add).toBeCalledWith({
        webId: aliceWebId,
        registeredAgent: bobWebId
      } as IDelegatedGrantsJobData);
      done();
    }
  });
});
