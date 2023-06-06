import type { PushSubscription } from 'web-push';
import { IStorage, Session } from '@inrupt/solid-client-authn-node';
import { AuthorizationAgent } from '@janeirodigital/interop-authorization-agent';

export type WebhookSubscription = {
  // webId: string, // TODO enable once PR lands in the webhook sub type spec and client updates
  unsubscribeEndpoint: string;
};

export interface ISessionManager {
  storage: IStorage; // TODO can be removed after checking if component builder still works
  getSaiSession(webId: string): Promise<AuthorizationAgent>;
  getOidcSession(webId: string): Promise<Session>;
  // TODO: move to separate service or rename this interface to something more generic
  getPushSubscriptions(webId: string): Promise<PushSubscription[]>;
  addPushSubscription(webId: string, subscription: PushSubscription): Promise<void>;
  getWebhookSubscription(webId: string, peerWebId: string): Promise<WebhookSubscription | undefined>;
  setWebhookSubscription(webId: string, peerWebId: string, subscription: WebhookSubscription): Promise<void>;
}
