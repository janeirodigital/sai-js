import { discoverWebPushService, type WhatwgFetch } from '@janeirodigital/interop-utils';
import type { NotificationChannel } from '@solid-notifications/types';

export class NotificationManager {
  webPushService?: { id: string; vapidPublicKey: string };

  constructor(
    private authnFetch: WhatwgFetch,
    private authorizationAgentIri: string
  ) {}

  public async subscribeViaPush(subscription: PushSubscription, topic: string): Promise<NotificationChannel> {
    if (!this.webPushService) throw new Error('Web Push Service not found');
    const channel = {
      '@context': [
        'https://www.w3.org/ns/solid/notifications-context/v1',
        {
          notify: 'http://www.w3.org/ns/solid/notifications#'
        }
      ],
      type: 'notify:WebPushChannel2023',
      topic,
      sendTo: subscription.endpoint,
      'notify:keys': {
        'notify:auth': subscription.toJSON()['keys']['auth'],
        'notify:p256dh': subscription.toJSON()['keys']['p256dh']
      }
    };
    const response = await this.authnFetch(this.webPushService.id, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/ld+json'
      },
      body: JSON.stringify(channel)
    });
    if (!response.ok) {
      throw new Error('Failed to subscribe via push');
    }
    return response.json();
  }

  public async unsubscribeFromPush(topic: string, channelId: string): Promise<boolean> {
    const response = await this.authnFetch(channelId, { method: 'DELETE' });
    return response.ok;
  }

  private async bootstrap(): Promise<void> {
    this.webPushService = await discoverWebPushService(this.authorizationAgentIri, this.authnFetch);
  }

  public static async build(authnFetch: WhatwgFetch, authorizationAgentIri: string): Promise<NotificationManager> {
    const manager = new NotificationManager(authnFetch, authorizationAgentIri);
    await manager.bootstrap();
    return manager;
  }
}
