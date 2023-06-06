import type { AuthorizationAgent } from '@janeirodigital/interop-authorization-agent';
import { InMemoryStorage } from '@inrupt/solid-client-authn-node';
import { WebhookSubscription } from '@janeirodigital/sai-server-interfaces';
import { AccessInboxProcessor, IAccessInboxJob, webhookTargetUrl } from '../../../src';

import { subscribe } from 'solid-webhook-client';
jest.mock('solid-webhook-client');

import { SessionManager } from '../../../src/session-manager';
jest.mock('../../../src/session-manager', () => {
  return {
    SessionManager: jest.fn(() => {
      return {
        getWebhookSubscription: jest.fn(),
        setWebhookSubscription: jest.fn(),
        getSaiSession: jest.fn()
      };
    })
  };
});

const mockedSubscribe = jest.mocked(subscribe);

const sessionManager = jest.mocked(new SessionManager(new InMemoryStorage()));
const webId = 'https://alice.example';
const accessInbox = 'https://alice.spamshield.example/access-inbox';
const job: IAccessInboxJob = { data: { webId } };
const processor = new AccessInboxProcessor(sessionManager);

const saiSessionMock = {
  rawFetch: jest.fn(),
  webIdProfile: {
    hasAccessInbox: accessInbox
  }
} as unknown as AuthorizationAgent;
sessionManager.getSaiSession.mockImplementation(async (webid: string) => saiSessionMock);

beforeEach(() => {
  sessionManager.getWebhookSubscription.mockReset();
  sessionManager.setWebhookSubscription.mockReset();
  sessionManager.getSaiSession.mockClear();
  mockedSubscribe.mockClear();
});

test('gets sai session of the correct user', async () => {
  await processor.processorFunction(job);
  expect(sessionManager.getSaiSession).toBeCalledWith(webId);
});

test('does not try to subscribe if already subscribed', async () => {
  sessionManager.getWebhookSubscription.mockImplementationOnce(async (webId, peerWebId) => {
    return {} as unknown as WebhookSubscription;
  });
  await processor.processorFunction(job);
  expect(sessionManager.getWebhookSubscription).toBeCalledWith(webId, webId);
  expect(mockedSubscribe).not.toBeCalled();
});

test('does not try to subscribe if no inbox', async () => {
  sessionManager.getSaiSession.mockImplementationOnce(async (webid: string) => {
    return {} as unknown as AuthorizationAgent;
  });
  await processor.processorFunction(job);
  expect(mockedSubscribe).not.toBeCalled();
});

test('subscribes and stores the subscription', async () => {
  const subsciption: WebhookSubscription = {
    unsubscribeEndpoint: 'https://publisher.example/unsubscribe/123'
  };
  mockedSubscribe.mockImplementationOnce(async () => subsciption);
  await processor.processorFunction(job);
  expect(mockedSubscribe).toBeCalledWith(accessInbox, webhookTargetUrl(webId, webId), {
    fetch: saiSessionMock.rawFetch
  });
  expect(sessionManager.setWebhookSubscription).toBeCalledWith(webId, webId, subsciption);
});
