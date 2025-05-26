import {
  ForbiddenHttpError,
  HttpHandler,
  type HttpHandlerResponse,
  NotFoundHttpError,
} from '@digita-ai/handlersjs-http'
import { getLogger } from '@digita-ai/handlersjs-logging'
import { type Observable, from } from 'rxjs'
import type { AuthenticatedAuthnContext } from '../models/http-solid-context'
import type { SessionManager } from '../session-manager'
import { decodeBase64, decodeWebId } from '../url-templates'

export class WebPushUnsubscribeHandler extends HttpHandler {
  private logger = getLogger()

  constructor(private sessionManager: SessionManager) {
    super()
    this.logger.info('WebPushUnsubscribeHandler::constructor')
  }

  // TODO: validate channel info
  async handleAsync(context: AuthenticatedAuthnContext): Promise<HttpHandlerResponse> {
    const applicationId = context.authn.clientId
    const webId = decodeWebId(context.request.parameters!.encodedWebId)
    if (webId !== context.authn.webId) {
      throw new ForbiddenHttpError('wrong authorization agent')
    }

    const topic = decodeBase64(context.request.parameters.encodedTopic)
    const webhookChannel = await this.sessionManager.getWebhookPushTopic(
      webId,
      applicationId,
      topic
    )
    if (!webhookChannel) throw new NotFoundHttpError()

    const saiSession = await this.sessionManager.getSaiSession(webId)
    const response = await saiSession.rawFetch(webhookChannel.id, { method: 'DELETE' })
    if (!response.ok) return { status: 502, headers: {} }
    await this.sessionManager.deleteWebhookPushTopic(webId, applicationId, topic)
    return { status: 204, headers: {} }
  }

  handle(context: AuthenticatedAuthnContext): Observable<HttpHandlerResponse> {
    this.logger.info('WebPushUnsubscribeHandler::handle')
    return from(this.handleAsync(context))
  }
}
