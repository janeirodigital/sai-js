import { from, Observable } from 'rxjs';
import { InternalServerError } from '@digita-ai/handlersjs-http';
import type { ISessionManager } from '@janeirodigital/sai-server-interfaces';
import type { AuthenticatedAuthnContext, SaiContext } from '../models/http-solid-context';
import type { HttpContextHandler } from './middleware-http-handler';

/**
 * Attaches the corresponding AuthorizationAgent to the context
 */
export class AuthorizationAgentContextHandler implements HttpContextHandler {
  constructor(private sessionManager: ISessionManager) {}

  handle(ctx: AuthenticatedAuthnContext): Observable<SaiContext> {
    return from(this.handleAsync(ctx));
  }

  private async handleAsync(ctx: AuthenticatedAuthnContext): Promise<SaiContext> {
    const saiSession = await this.sessionManager.getSaiSession(ctx.authn.webId);

    if (!saiSession) {
      throw new InternalServerError();
    }

    return { ...ctx, saiSession };
  }
}
