import { NOTIFY } from '@janeirodigital/interop-utils'
import type { IProcessor, ISessionManager } from '@janeirodigital/sai-server-interfaces'
import { SubscriptionClient } from '@solid-notifications/subscription'
import type { IReciprocalRegistrationsJob } from '../models/jobs'
import { webhookTargetUrl } from '../url-templates'

// Indepotent processor, if reciprocal registration already known if will not try to rediscover it
// Webhook subscription can be retried

export class ReciprocalRegistrationsProcessor implements IProcessor {
  constructor(public sessionManager: ISessionManager) {}

  async processorFunction(job: IReciprocalRegistrationsJob): Promise<void> {
    const { webId, registeredAgent } = job.data
    const saiSession = await this.sessionManager.getSaiSession(webId)

    const registration = await saiSession.findSocialAgentRegistration(registeredAgent)
    if (!registration) throw new Error(`registration for ${registeredAgent} was not found`)

    if (!registration.reciprocalRegistration) {
      await registration.discoverAndUpdateReciprocal(saiSession.rawFetch)
    }
    if (!registration.reciprocalRegistration)
      throw new Error(`reciprocal registration from ${registeredAgent} was not found`)

    // manage webook subscription
    if (await this.sessionManager.getWebhookSubscription(webId, registeredAgent)) return
    const subscriptionClient = new SubscriptionClient(saiSession.rawFetch as typeof fetch) // TODO: remove as
    const channel = await subscriptionClient.subscribe(
      registration.reciprocalRegistration.iri,
      NOTIFY.WebhookChannel2023.value,
      webhookTargetUrl(webId, registeredAgent)
    )
    await this.sessionManager.setWebhookSubscription(webId, registeredAgent, channel)
  }
}
