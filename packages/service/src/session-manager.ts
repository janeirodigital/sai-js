import { randomUUID } from 'crypto';
import type { PushSubscription } from 'web-push';
import { getSessionFromStorage, IStorage, Session } from '@inrupt/solid-client-authn-node';
import type { NotificationChannel } from '@solid-notifications/types';
import { AuthorizationAgent } from '@janeirodigital/interop-authorization-agent';
import { ISessionManager } from '@janeirodigital/sai-server-interfaces';
import { webId2agentUrl } from './url-templates';

type WebId = string;

type PushChannelInfo = {
  sendTo: string;
  keys: {
    auth: string;
    p256dh: string;
  };
};

const cache = new Map<WebId, AuthorizationAgent>();

const prefixes = {
  push: 'push:sub:',
  webhook: 'webhook:sub:'
};

async function buildSaiSession(oidcSession: Session, clientId: string): Promise<AuthorizationAgent> {
  // TODO handle if (!oidcSession.info.isLoggedIn)
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const webId = oidcSession.info.webId!;
  return AuthorizationAgent.build(webId, clientId, {
    fetch: oidcSession.fetch,
    randomUUID
  });
}

export class SessionManager implements ISessionManager {
  constructor(public storage: IStorage) {}

  async getSaiSession(webId: string): Promise<AuthorizationAgent> {
    const cached = cache.get(webId);
    if (cached) return cached;

    const oidcSession = await this.getOidcSession(webId);
    if (!oidcSession.info.isLoggedIn) throw new Error('OIDC session not logged in');

    const agentUrl = webId2agentUrl(webId);
    const saiSession = await buildSaiSession(oidcSession, agentUrl);
    cache.set(webId, saiSession);

    return saiSession;
  }

  async getOidcSession(webId: string): Promise<Session> {
    let session = await getSessionFromStorage(webId, this.storage);

    if (!session) {
      session = new Session({ storage: this.storage }, webId);
    }

    return session;
  }

  async getPushSubscriptions(webId: string): Promise<PushSubscription[]> {
    const key = `${prefixes.push}${webId}`;
    const value = await this.storage.get(key);

    return value ? (JSON.parse(value) as PushSubscription[]) : [];
  }

  async addPushSubscription(webId: string, subscription: PushSubscription): Promise<void> {
    const key = `${prefixes.push}${webId}`;
    const existing = await this.getPushSubscriptions(webId);
    const duplicate = existing.find((existingSubscription) => existingSubscription.endpoint === subscription.endpoint);
    if (duplicate) return;

    return this.storage.set(key, JSON.stringify([subscription, ...existing]));
  }

  async getWebhookSubscription(webId: string, peerWebId: string): Promise<NotificationChannel | undefined> {
    const key = `${prefixes.webhook}${webId}:${peerWebId}`;
    const value = await this.storage.get(key);
    return value ? (JSON.parse(value) as NotificationChannel) : undefined;
  }

  setWebhookSubscription(webId: string, peerWebId: string, subscription: NotificationChannel): Promise<void> {
    const key = `${prefixes.webhook}${webId}:${peerWebId}`;
    return this.storage.set(key, JSON.stringify(subscription));
  }

  async getWebhookPushSubscription(webId: string, applicationId: string): Promise<PushChannelInfo[]> {
    const key = `${prefixes.push}${webId}:${applicationId}`;
    const value = await this.storage.get(key);

    return value ? (JSON.parse(value) as PushChannelInfo[]) : [];
  }

  async addWebhookPushSubscription(webId: string, applicationId: string, pushChannel: PushChannelInfo): Promise<void> {
    const key = `${prefixes.push}${webId}:${applicationId}`;
    const existing = await this.getWebhookPushSubscription(webId, applicationId);
    const duplicate = existing.find((existingSubscription) => existingSubscription.sendTo === pushChannel.sendTo);
    if (duplicate) return;

    return this.storage.set(key, JSON.stringify([pushChannel, ...existing]));
  }

  async addWebhookPushTopic(webId: string, applicationId: string, topic: string): Promise<boolean> {
    const key = `${prefixes.push}${webId}:${applicationId}:${topic}`;
    const existing = await this.storage.get(key);

    if (existing) return false;

    await this.storage.set(key, 'true');
    return true;
  }
}
