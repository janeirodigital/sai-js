/* eslint-disable class-methods-use-this */

import { from, Observable } from 'rxjs';
import { HttpHandler, HttpHandlerResponse, HttpHandlerContext } from '@digita-ai/handlersjs-http';
import { getLogger } from '@digita-ai/handlersjs-logging';
import { validateContentType } from '../utils/http-validators';
import { decodeWebId } from '../url-templates';
import { SessionManager } from '../session-manager';
import 'dotenv/config';
import webpush from 'web-push';

export class WebPushWebhooksHandler extends HttpHandler {
  private logger = getLogger();

  constructor(private sessionManager: SessionManager) {
    super();

    this.logger.info('WebPushWebhooksHandler::constructor');
  }

  async handleAsync(context: HttpHandlerContext): Promise<HttpHandlerResponse> {
    validateContentType(context, 'application/ld+json');

    const webId = decodeWebId(context.request.parameters!.encodedWebId);
    const applicationId = decodeWebId(context.request.parameters!.encodedApplicationId);
    const body = JSON.parse(context.request.body);

    webpush.setVapidDetails(
      process.env.PUSH_NOTIFICATION_EMAIL!,
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );

    // TODO: i18n
    const notificationPayload = {
      notification: {
        title: 'SAI update',
        body: `data changed`,
        data: body
      }
    };
    const subscriptions = await this.sessionManager.getWebhookPushSubscription(webId, applicationId);
    console.log('subscriptions', subscriptions);

    try {
      await Promise.all(
        subscriptions.map((info) => {
          const sub = {
            endpoint: info.sendTo,
            keys: {
              auth: info.keys.auth,
              p256dh: info.keys.p256dh
            }
          };
          return webpush.sendNotification(sub, JSON.stringify(notificationPayload));
        })
      );
    } catch (error) {
      this.logger.error('WebPushWebhooksHandler::handleAsync', error);
    }

    return { body: {}, status: 200, headers: {} };
  }

  handle(context: HttpHandlerContext): Observable<HttpHandlerResponse> {
    this.logger.info('WebPushWebhooksHandler::handle');
    return from(this.handleAsync(context));
  }
}
