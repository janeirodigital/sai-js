import type { AuthorizationAgent } from '@janeirodigital/interop-authorization-agent';
import { InMemoryStorage } from '@inrupt/solid-client-authn-node';
import { PushNotificationsProcessor, IPushNotificationsJob } from '../../../src';

import { SessionManager } from '../../../src/session-manager';
jest.mock('../../../src/session-manager', () => {
  return {
    SessionManager: jest.fn(() => {
      return {
        getSaiSession: jest.fn(),
        getPushSubscriptions: jest.fn()
      };
    })
  };
});

const sessionManager = jest.mocked(new SessionManager(new InMemoryStorage()));
const webId = 'https://alice.example';
const job: IPushNotificationsJob = { data: { webId } };
const processor = new PushNotificationsProcessor(sessionManager);

const mockedUpdateDG = jest.fn();
const saiSessionMock = {
  updatePushNotifications: mockedUpdateDG
} as unknown as AuthorizationAgent;
sessionManager.getSaiSession.mockImplementation(async (webid: string) => saiSessionMock);

beforeEach(() => {
  sessionManager.getPushSubscriptions.mockReset();
  sessionManager.getSaiSession.mockClear();
  mockedUpdateDG.mockClear();
});

test('has session manager', () => {
  const instance = new PushNotificationsProcessor(sessionManager);
  expect(instance.sessionManager).toBe(sessionManager);
});
