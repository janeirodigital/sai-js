import { from, Observable } from 'rxjs';
import { HttpHandler, HttpHandlerResponse, HttpHandlerContext, InternalServerError } from '@digita-ai/handlersjs-http';
import { getLogger } from '@digita-ai/handlersjs-logging';
import type { IQueue, ISessionManager } from '@janeirodigital/sai-server-interfaces';
import { frontendUrl, decodeWebId } from '../url-templates';
import { IAccessInboxJobData } from '../models/jobs';

export class LoginRedirectHandler extends HttpHandler {
  private logger = getLogger();

  constructor(private sessionManager: ISessionManager, private queue: IQueue) {
    super();
    this.logger.info('LoginRedirectHandler::constructor');
  }

  handle(context: HttpHandlerContext): Observable<HttpHandlerResponse> {
    this.logger.info('LoginRedirectHandler::handle');
    return from(this.handleAsync(context));
  }

  private async handleAsync(context: HttpHandlerContext): Promise<HttpHandlerResponse> {
    const webId = decodeWebId(context.request.parameters!.encodedWebId);

    const oidcSession = await this.sessionManager.getOidcSession(webId);
    // TODO clarify scenario if new a session was just created

    try {
      await oidcSession.handleIncomingRedirect(context.request.url.toString());
    } catch (error) {
      console.error(error);
    }

    if (!oidcSession.info.isLoggedIn || !oidcSession.info.webId) {
      // TODO clarify this scenario
      throw new InternalServerError();
    } else {
      // ensure subscribed to access inbox
      await this.queue.add({ webId } as IAccessInboxJobData);

      return { body: {}, status: 302, headers: { location: frontendUrl } };
    }
  }
}
