import { NOTIFY } from '@janeirodigital/interop-utils';
import type { AuthorizationAgent } from '@janeirodigital/interop-authorization-agent';
import { InMemoryStorage } from '@inrupt/solid-client-authn-node';
import type { NotificationChannel } from '@solid-notifications/types';
import { ReciprocalRegistrationsProcessor, IReciprocalRegistrationsJob, webhookTargetUrl } from '../../../src';

const mockedSubscribe = jest.fn();
jest.mock('@solid-notifications/subscription', () => ({
  SubscriptionClient: jest.fn(() => ({
    subscribe: mockedSubscribe
  }))
}));

import { SessionManager } from '../../../src/session-manager';

jest.mock('../../../src/session-manager', () => ({
  SessionManager: jest.fn(() => ({
    getWebhookSubscription: jest.fn(),
    setWebhookSubscription: jest.fn(),
    getSaiSession: jest.fn()
  }))
}));

const sessionManager = jest.mocked(new SessionManager(new InMemoryStorage()));
const webId = 'https://alice.example';
const peerWebId = 'https://bob.example';
const job: IReciprocalRegistrationsJob = { data: { webId, registeredAgent: peerWebId } };
const processor = new ReciprocalRegistrationsProcessor(sessionManager);

const saiSessionMock = {
  rawFetch: jest.fn(),
  findSocialAgentRegistration: jest.fn()
};
sessionManager.getSaiSession.mockImplementation(async () => saiSessionMock as unknown as AuthorizationAgent);

const mockedRegistrationWithReciprocial = {
  reciprocalRegistration: { iri: 'https://auth.bob/example/alice/' }
};

const mockedRegistrationWithoutReciprocal = {
  discoverAndUpdateReciprocal: jest.fn()
};

beforeEach(() => {
  sessionManager.getWebhookSubscription.mockReset();
  sessionManager.setWebhookSubscription.mockReset();
  sessionManager.getSaiSession.mockClear();
  mockedSubscribe.mockClear();
});

describe('basics', () => {
  test('gets sai session of the correct user', async () => {
    saiSessionMock.findSocialAgentRegistration.mockImplementationOnce(async () => mockedRegistrationWithReciprocial);
    await processor.processorFunction(job);
    expect(sessionManager.getSaiSession).toBeCalledWith(webId);
  });

  test('gets sai session of the correct user', async () => {
    saiSessionMock.findSocialAgentRegistration.mockImplementationOnce(async () => undefined);
    expect(processor.processorFunction(job)).rejects.toThrow(`registration for ${peerWebId} was not found`);
  });
});

// we do not need to test separatelly case when it gets discovered
test('tries to discover reciprocial registration if not known', async () => {
  saiSessionMock.findSocialAgentRegistration.mockImplementationOnce(async () => mockedRegistrationWithoutReciprocal);
  await expect(processor.processorFunction(job)).rejects.toThrow(
    `reciprocal registration from ${peerWebId} was not found`
  );
  expect(mockedRegistrationWithoutReciprocal.discoverAndUpdateReciprocal).toBeCalledTimes(1);
});

describe('webhook subscription', () => {
  beforeEach(() => {
    saiSessionMock.findSocialAgentRegistration.mockImplementationOnce(async () => mockedRegistrationWithReciprocial);
  });

  test('does not try to subscribe if already subscribed', async () => {
    sessionManager.getWebhookSubscription.mockImplementation(async () => ({}) as unknown as NotificationChannel);
    await processor.processorFunction(job);
    expect(sessionManager.getWebhookSubscription).toBeCalledWith(webId, peerWebId);
    expect(mockedSubscribe).not.toBeCalled();
  });

  test('subscribes and stores the subscription', async () => {
    const subsciption: NotificationChannel = {
      id: 'urn:uuid:6a16912b-236d-426a-bca7-a765e0f2dae9',
      type: NOTIFY.WebhookChannel2023.value,
      topic: 'https://some.example/something'
    };
    sessionManager.getWebhookSubscription.mockImplementationOnce(async () => undefined);
    mockedSubscribe.mockImplementationOnce(async () => subsciption);
    await processor.processorFunction(job);
    expect(mockedSubscribe).toBeCalledWith(
      mockedRegistrationWithReciprocial.reciprocalRegistration.iri,
      NOTIFY.WebhookChannel2023.value,
      webhookTargetUrl(webId, peerWebId)
    );
    expect(sessionManager.setWebhookSubscription).toBeCalledWith(webId, peerWebId, subsciption);
  });
});
