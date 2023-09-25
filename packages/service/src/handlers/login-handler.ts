import 'dotenv/config';
import { from, Observable } from 'rxjs';
import { HttpHandler, HttpHandlerResponse, BadRequestHttpError } from '@digita-ai/handlersjs-http';
import { getLogger } from '@digita-ai/handlersjs-logging';
import type { ISessionManager } from '@janeirodigital/sai-server-interfaces';
import { agentRedirectUrl, webId2agentUrl } from '../url-templates';
import type { AuthenticatedAuthnContext } from '../models/http-solid-context';

export class LoginHandler extends HttpHandler {
  private logger = getLogger();

  constructor(private sessionManager: ISessionManager) {
    super();
    this.logger.info('LoginHandler::constructor');
  }

  async handleAsync(context: AuthenticatedAuthnContext): Promise<HttpHandlerResponse> {
    const { webId } = context.authn;

    const oidcSession = await this.sessionManager.getOidcSession(webId);

    if (oidcSession.info.isLoggedIn) {
      return { status: 204, headers: {} };
    }

    const agentUrl = webId2agentUrl(webId);

    const completeRedirectUrl: string = await new Promise((resolve) => {
      oidcSession.login({
        redirectUrl: agentRedirectUrl(agentUrl),
        oidcIssuer: context.authn.issuer,
        clientName: process.env.APP_NAME,
        clientId: agentUrl,
        handleRedirect: (url: string) => {
          resolve(url);
        }
      });
    });

    return { body: { redirectUrl: completeRedirectUrl }, status: 200, headers: {} };
  }

  handle(context: AuthenticatedAuthnContext): Observable<HttpHandlerResponse> {
    this.logger.info('LoginHandler::handle');
    return from(this.handleAsync(context));
  }
}
