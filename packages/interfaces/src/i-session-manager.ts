import type { IStorage, Session } from '@inrupt/solid-client-authn-node'
import type { AuthorizationAgent } from '@janeirodigital/interop-authorization-agent'
import type { NotificationChannel } from '@solid-notifications/types'
import type { PushSubscription } from 'web-push'

export interface ISessionManager {
  storage: IStorage // TODO can be removed after checking if component builder still works
  getSaiSession(webId: string): Promise<AuthorizationAgent>
  getOidcSession(webId: string): Promise<Session>
  // TODO: move to separate service or rename this interface to something more generic
  getPushSubscriptions(webId: string): Promise<PushSubscription[]>
  addPushSubscription(webId: string, subscription: PushSubscription): Promise<void>
  getWebhookSubscription(webId: string, peerWebId: string): Promise<NotificationChannel | undefined>
  setWebhookSubscription(
    webId: string,
    peerWebId: string,
    subscription: NotificationChannel
  ): Promise<void>
}
