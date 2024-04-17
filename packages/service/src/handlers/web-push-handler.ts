/* eslint-disable class-methods-use-this */

import { from, Observable } from 'rxjs';
import { HttpHandler, HttpHandlerResponse, ForbiddenHttpError } from '@digita-ai/handlersjs-http';
import { getLogger } from '@digita-ai/handlersjs-logging';
import { validateContentType } from '../utils/http-validators';
import { decodeWebId, webhookPushUrl } from '../url-templates';
import { getOneMatchingQuad, NOTIFY, parseJsonld } from '@janeirodigital/interop-utils';
import { SessionManager } from '../session-manager';
import { SubscriptionClient } from '@solid-notifications/subscription';
import { AuthenticatedAuthnContext } from '../models/http-solid-context';

export class WebPushHandler extends HttpHandler {
  private logger = getLogger();

  constructor(private sessionManager: SessionManager) {
    super();
    this.logger.info('WebPushHandler::constructor');
  }
  // TODO: validate channel info
  async handleAsync(context: AuthenticatedAuthnContext): Promise<HttpHandlerResponse> {
    validateContentType(context, 'application/ld+json');
    const applicationId = context.authn.clientId;
    const webId = decodeWebId(context.request.parameters!.encodedWebId);
    if (webId !== context.authn.webId) {
      throw new ForbiddenHttpError('wrong authorization agent');
    }
    const requestedChannel = await parseJsonld(context.request.body);

    const pushChannelInfo = {
      sendTo: getOneMatchingQuad(requestedChannel, null, NOTIFY.sendTo)!.object.value,
      keys: {
        auth: getOneMatchingQuad(requestedChannel, null, NOTIFY.auth)!.object.value,
        p256dh: getOneMatchingQuad(requestedChannel, null, NOTIFY.p256dh)!.object.value
      }
    };

    await this.sessionManager.addWebhookPushSubscription(webId, applicationId, pushChannelInfo);
    const topic = getOneMatchingQuad(requestedChannel, null, NOTIFY.topic)!.object.value;

    if (await this.sessionManager.addWebhookPushTopic(webId, applicationId, topic)) {
      const saiSession = await this.sessionManager.getSaiSession(webId);
      const subscriptionClient = new SubscriptionClient(saiSession.rawFetch as typeof fetch); // TODO: remove as
      await subscriptionClient.subscribe(topic, NOTIFY.WebhookChannel2023.value, webhookPushUrl(webId, applicationId));
    }

    return { body: {}, status: 200, headers: {} };
  }

  handle(context: AuthenticatedAuthnContext): Observable<HttpHandlerResponse> {
    this.logger.info('WebPushHandler::handle');
    return from(this.handleAsync(context));
  }
}
