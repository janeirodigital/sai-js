/* eslint-disable @typescript-eslint/no-empty-function */

import { jest } from '@jest/globals';
import type { PushSubscription } from 'web-push';
import { IStorage, Session } from '@inrupt/solid-client-authn-node';
import type { NotificationChannel } from '@solid-notifications/types';
import { AuthorizationAgent } from '@janeirodigital/interop-authorization-agent';
import { ISessionManager } from '@janeirodigital/sai-server-interfaces';

export class MockedSessionManager implements ISessionManager {
  constructor(public storage: IStorage) {}

  getSaiSession = jest.fn(
    async (webId: string): Promise<AuthorizationAgent> => undefined as unknown as AuthorizationAgent
  );

  getOidcSession = jest.fn(async (webId: string): Promise<Session> => undefined as unknown as Session);

  getPushSubscriptions = jest.fn(async (webId: string) => [] as PushSubscription[]);

  addPushSubscription = jest.fn(async (webId: string, subscription: PushSubscription) => {});

  getWebhookSubscription = jest.fn(
    async (webId: string, peerWebId: string) => undefined as unknown as NotificationChannel
  );

  setWebhookSubscription = jest.fn(async (webId: string, peerWebId: string, subscription: NotificationChannel) => {});
}
