import {
  AS,
  RDF,
  discoverWebPushService,
  getNotificationChannel,
  getOneMatchingQuad,
  parseTurtle,
} from '@janeirodigital/interop-utils'
import type { NotificationChannel } from '@solid-notifications/types'

export class NotificationManager extends EventTarget {
  public webPushService?: { id: string; vapidPublicKey: string }

  private streamMap = new Map<string, Response>()

  constructor(
    private authnFetch: typeof fetch,
    private authorizationAgentIri: string
  ) {
    super()
  }

  public async subscribeViaPush(
    subscription: PushSubscription,
    topic: string
  ): Promise<NotificationChannel> {
    if (!this.webPushService) throw new Error('Web Push Service not found')
    const channel = {
      '@context': ['https://www.w3.org/ns/solid/notifications-context/v1'],
      type: 'notify:WebPushChannel2023',
      topic,
      sendTo: subscription.endpoint,
      'notify:keys': {
        'notify:auth': subscription.toJSON().keys.auth,
        'notify:p256dh': subscription.toJSON().keys.p256dh,
      },
    }
    const response = await this.authnFetch(this.webPushService.id, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/ld+json',
      },
      body: JSON.stringify(channel),
    })
    if (!response.ok) {
      throw new Error('Failed to subscribe via push')
    }
    return response.json()
  }

  public async unsubscribeFromPush(topic: string, channelId: string): Promise<boolean> {
    const response = await this.authnFetch(channelId, { method: 'DELETE' })
    return response.ok
  }

  private async bootstrap(): Promise<void> {
    this.webPushService = await discoverWebPushService(this.authorizationAgentIri, this.authnFetch)
  }

  public static async build(
    authnFetch: typeof fetch,
    authorizationAgentId: string
  ): Promise<NotificationManager> {
    const manager = new NotificationManager(authnFetch, authorizationAgentId)
    await manager.bootstrap()
    return manager
  }

  private async handleStream(resourceId: string, receiveFrom: string): Promise<void> {
    const response = await this.authnFetch(receiveFrom)
    if (!response.ok) {
      console.log('failed connecting to notification stream:', receiveFrom, response.status)
      return
    }
    if (!response.body) {
      console.log('missing body of notification stream:', receiveFrom)
      return
    }
    this.streamMap.set(resourceId, response)
    // TODO remove from map on error or close, and reconnect
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    // discard initial notification
    await reader.read()
    try {
      while (response.body.locked) {
        const notification = await reader.read().then(({ value }) => decoder.decode(value))
        if (!notification) continue
        const dataset = await parseTurtle(notification)
        this.dispatchEvent(
          new CustomEvent('notification', {
            detail: {
              type: getOneMatchingQuad(dataset, null, RDF.type)!.object.value,
              object: getOneMatchingQuad(dataset, null, AS.object)!.object.value,
            },
          })
        )
      }
    } finally {
      reader.releaseLock()
      await response.body.cancel()
    }
  }

  public async subscribeToResource(resourceId: string): Promise<void> {
    if (this.streamMap.has(resourceId)) return
    const headResponse = await this.authnFetch(resourceId)
    const receiveFrom = getNotificationChannel(headResponse.headers.get('link'))
    if (!receiveFrom) console.log('Failed to discover notification chanel for:', resourceId)
    this.handleStream(resourceId, receiveFrom)
  }
}
