import {
  HttpHandler,
  type HttpHandlerContext,
  type HttpHandlerResponse,
} from '@digita-ai/handlersjs-http'
import { getLogger } from '@digita-ai/handlersjs-logging'
import { type Observable, from } from 'rxjs'
import webpush from 'web-push'
import type { SessionManager } from '../session-manager'
import { decodeWebId } from '../url-templates'
import { validateContentType } from '../utils/http-validators'
import 'dotenv/config'
import { getOneMatchingQuad } from '@janeirodigital/interop-utils'

export class WebPushWebhooksHandler extends HttpHandler {
  private logger = getLogger()

  constructor(private sessionManager: SessionManager) {
    super()

    this.logger.info('WebPushWebhooksHandler::constructor')
  }

  async handleAsync(context: HttpHandlerContext): Promise<HttpHandlerResponse> {
    validateContentType(context, 'application/ld+json')

    const webId = decodeWebId(context.request.parameters!.encodedWebId)
    const applicationId = decodeWebId(context.request.parameters!.encodedApplicationId)

    webpush.setVapidDetails(
      process.env.PUSH_NOTIFICATION_EMAIL!,
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    )
    const notification = JSON.parse(context.request.body)

    // TODO: fallback if unable to find label
    const saiSession = await this.sessionManager.getSaiSession(webId)

    const shapeTree = await saiSession.findShapeTreeForResource(notification.object)

    const response = await saiSession.fetch(notification.object)
    const label = getOneMatchingQuad(
      await response.dataset(),
      notification.object,
      shapeTree.describesInstance
    ).object.value

    // TODO: i18n
    const notificationPayload = {
      ...notification,
      label,
    }
    const subscriptions = await this.sessionManager.getWebhookPushSubscription(webId, applicationId)

    try {
      await Promise.all(
        subscriptions.map((info) => {
          const sub = {
            endpoint: info.sendTo,
            keys: {
              auth: info.keys.auth,
              p256dh: info.keys.p256dh,
            },
          }
          return webpush.sendNotification(sub, JSON.stringify(notificationPayload))
        })
      )
    } catch (error) {
      this.logger.error('WebPushWebhooksHandler::handleAsync', error)
    }

    return { body: {}, status: 200, headers: {} }
  }

  handle(context: HttpHandlerContext): Observable<HttpHandlerResponse> {
    this.logger.info('WebPushWebhooksHandler::handle')
    return from(this.handleAsync(context))
  }
}
