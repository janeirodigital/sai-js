import { jest } from '@jest/globals';
import type { PushSubscription } from 'web-push';
import { IStorage, Session } from '@inrupt/solid-client-authn-node';
import { AuthorizationAgent } from '@janeirodigital/interop-authorization-agent';
import { ISessionManager, WebhookSubscription } from '@janeirodigital/sai-server-interfaces';

export class MockedSessionManager implements ISessionManager {
  constructor(public storage: IStorage) {}
  getSaiSession = jest.fn(async (webId: string): Promise<AuthorizationAgent> => {
    return undefined as unknown as AuthorizationAgent;
  });
  getOidcSession = jest.fn(async (webId: string): Promise<Session> => {
    return undefined as unknown as Session;
  });
  getPushSubscriptions = jest.fn(async (webId: string) => {
    return [] as PushSubscription[];
  });
  addPushSubscription = jest.fn(async (webId: string, subscription: PushSubscription) => {});
  getWebhookSubscription = jest.fn(async (webId: string, peerWebId: string) => {
    return undefined as unknown as WebhookSubscription;
  });
  setWebhookSubscription = jest.fn(async (webId: string, peerWebId: string, subscription: WebhookSubscription) => {});
}
