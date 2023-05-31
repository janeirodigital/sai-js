import { from, Observable } from 'rxjs';
import { BadRequestHttpError, HttpHandler, HttpHandlerResponse } from '@digita-ai/handlersjs-http';
import { getLogger } from '@digita-ai/handlersjs-logging';
import type { ISessionManager } from '@janeirodigital/sai-server-interfaces';
import type { PushSubscription } from 'web-push';
import type { AuthenticatedAuthnContext } from '../models/http-solid-context';
import { validateContentType } from '../utils/http-validators';

export class PushSubscriptionHandler extends HttpHandler {
  private logger = getLogger();

  constructor(private sessionManager: ISessionManager) {
    super();
    this.logger.info('PushSubscriptionHandler::constructor');
  }
  handle(context: AuthenticatedAuthnContext): Observable<HttpHandlerResponse> {
    this.logger.info('PushSubscriptionHandler::handle');
    return from(this.handleAsync(context));
  }

  private async handleAsync(context: AuthenticatedAuthnContext): Promise<HttpHandlerResponse> {
    validateContentType(context, 'application/json');
    // TODO: validate subscription
    if (!context.request.body) {
      throw new BadRequestHttpError();
    }
    const subscription = context.request.body as PushSubscription;
    await this.sessionManager.addPushSubscription(context.authn.webId, subscription);

    return { body: {}, status: 204, headers: {} };
  }
}
