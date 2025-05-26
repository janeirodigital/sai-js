import type { CRUDSocialAgentRegistration } from '@janeirodigital/interop-data-model'
import 'dotenv/config'
import webpush, { type PushSubscription } from 'web-push'

export const sendWebPush = async (
  socialAgentRegistration: CRUDSocialAgentRegistration,
  subscriptions: PushSubscription[]
): Promise<void> => {
  webpush.setVapidDetails(
    process.env.PUSH_NOTIFICATION_EMAIL!,
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )

  // TODO: i18n
  const notificationPayload = {
    notification: {
      title: 'SAI authorization agent',
      body: `${socialAgentRegistration.label} shared data with you`,
      data: {
        webId: socialAgentRegistration.registeredAgent,
      },
    },
  }
  await Promise.all(
    subscriptions.map((sub) => webpush.sendNotification(sub, JSON.stringify(notificationPayload)))
  )
}
