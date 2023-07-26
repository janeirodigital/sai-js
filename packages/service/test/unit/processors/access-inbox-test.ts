import { NOTIFY } from '@janeirodigital/interop-utils';
import type { AuthorizationAgent } from '@janeirodigital/interop-authorization-agent';
import { InMemoryStorage } from '@inrupt/solid-client-authn-node';
import type { NotificationChannel } from '@solid-notifications/types';
import { AccessInboxProcessor, IAccessInboxJob, webhookTargetUrl } from '../../../src';

import { SubscriptionClient } from '@solid-notifications/subscription';
const mockedSubscribe = jest.fn();
jest.mock('@solid-notifications/subscription', () => {
  return {
    SubscriptionClient: jest.fn(() => {
      return {
        subscribe: mockedSubscribe
      };
    })
  };
});

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
    return {} as unknown as NotificationChannel;
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
  const subsciption: NotificationChannel = {
    id: 'urn:uuid:259288ca-a4e9-4772-8410-c6fe16a21752',
    type: NOTIFY.WebhookChannel2023.value,
    topic: 'https://some.example/inbox'
  };
  mockedSubscribe.mockImplementationOnce(async () => subsciption);
  await processor.processorFunction(job);
  expect(mockedSubscribe).toBeCalledWith(accessInbox, NOTIFY.WebhookChannel2023.value, webhookTargetUrl(webId, webId));
  expect(sessionManager.setWebhookSubscription).toBeCalledWith(webId, webId, subsciption);
});
