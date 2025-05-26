import type { CRUDSocialAgentRegistration } from '@janeirodigital/interop-data-model'
import { expect, test, vi } from 'vitest'
import webpush, { type PushSubscription } from 'web-push'
import { sendWebPush } from '../../../src/services/web-push'

vi.mock('web-push')

const webId = 'https://alice.example'

const notificationPayload = {
  notification: {
    title: 'SAI authorization agent',
    body: 'Bob shared data with you',
    data: {
      webId,
    },
  },
}

const subscriptions = [
  { endpoint: 'a' } as unknown as PushSubscription,
  { endpoint: 'b' } as unknown as PushSubscription,
  { endpoint: 'c' } as unknown as PushSubscription,
  { endpoint: 'd' } as unknown as PushSubscription,
]

test('sends notifications', async () => {
  const socialAgentRegistration = {
    registeredAgent: webId,
    label: 'Bob',
  } as CRUDSocialAgentRegistration
  await sendWebPush(socialAgentRegistration, subscriptions)
  for (const subscription of subscriptions) {
    expect(webpush.sendNotification).toBeCalledWith(
      subscription,
      JSON.stringify(notificationPayload)
    )
  }
})
