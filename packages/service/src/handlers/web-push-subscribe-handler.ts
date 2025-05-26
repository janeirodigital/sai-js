import {
  ForbiddenHttpError,
  HttpHandler,
  type HttpHandlerResponse,
} from '@digita-ai/handlersjs-http'
import { getLogger } from '@digita-ai/handlersjs-logging'
import { NOTIFY, getOneMatchingQuad, parseJsonld } from '@janeirodigital/interop-utils'
import { SubscriptionClient } from '@solid-notifications/subscription'
import { type Observable, from } from 'rxjs'
import type { AuthenticatedAuthnContext } from '../models/http-solid-context'
import type { SessionManager } from '../session-manager'
import { decodeWebId, webPushUnsubscribeUrl, webhookPushUrl } from '../url-templates'
import { validateContentType } from '../utils/http-validators'

export class WebPushSubscribeHandler extends HttpHandler {
  private logger = getLogger()

  constructor(private sessionManager: SessionManager) {
    super()
    this.logger.info('WebPushSubscribeHandler::constructor')
  }

  // TODO: validate channel info
  async handleAsync(context: AuthenticatedAuthnContext): Promise<HttpHandlerResponse> {
    validateContentType(context, 'application/ld+json')
    const applicationId = context.authn.clientId
    const webId = decodeWebId(context.request.parameters!.encodedWebId)
    if (webId !== context.authn.webId) {
      throw new ForbiddenHttpError('wrong authorization agent')
    }
    const requestedChannel = await parseJsonld(context.request.body)

    const pushSubscriptionInfo = {
      sendTo: getOneMatchingQuad(requestedChannel, null, NOTIFY.sendTo)!.object.value,
      keys: {
        auth: getOneMatchingQuad(requestedChannel, null, NOTIFY.auth)!.object.value,
        p256dh: getOneMatchingQuad(requestedChannel, null, NOTIFY.p256dh)!.object.value,
      },
    }

    await this.sessionManager.addWebhookPushSubscription(webId, applicationId, pushSubscriptionInfo)
    const topic = getOneMatchingQuad(requestedChannel, null, NOTIFY.topic)!.object.value

    const webPushChannel = {
      '@context': [
        'https://www.w3.org/ns/solid/notifications-context/v1',
        {
          notify: 'http://www.w3.org/ns/solid/notifications#',
        },
      ],
      id: webPushUnsubscribeUrl(webId, topic),
      type: 'notify:WebPushChannel2023',
      topic,
      sendTo: pushSubscriptionInfo.sendTo,
    }

    if (!(await this.sessionManager.getWebhookPushTopic(webId, applicationId, topic))) {
      const saiSession = await this.sessionManager.getSaiSession(webId)
      const subscriptionClient = new SubscriptionClient(saiSession.rawFetch as typeof fetch) // TODO: remove as
      const webhookChannel = await subscriptionClient.subscribe(
        topic,
        NOTIFY.WebhookChannel2023.value,
        webhookPushUrl(webId, applicationId)
      )
      await this.sessionManager.addWebhookPushTopic(webId, applicationId, topic, webhookChannel)
      return {
        body: webPushChannel,
        status: 201,
        headers: {
          'content-type': 'application/ld+json',
        },
      }
    }

    return {
      body: webPushChannel,
      status: 200,
      headers: {
        'content-type': 'application/ld+json',
      },
    }
  }

  handle(context: AuthenticatedAuthnContext): Observable<HttpHandlerResponse> {
    this.logger.info('WebPushSubscribeHandler::handle')
    return from(this.handleAsync(context))
  }
}
