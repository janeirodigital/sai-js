import { from, Observable } from 'rxjs';
import { HttpHandlerContext, UnauthorizedHttpError } from '@digita-ai/handlersjs-http';
import type { CookieContext } from '../models/http-solid-context';
import type { HttpContextHandler } from './middleware-http-handler';
import * as cookie from 'cookie';
import { decryptCookie } from '../utils/crypto';

export class CookieContextHandler implements HttpContextHandler {
  handle(context: HttpHandlerContext): Observable<CookieContext> {
    return from(this.handleAsync(context));
  }

  async handleAsync(context: HttpHandlerContext): Promise<CookieContext> {
    const headers = context.request.headers;
    if (!headers.cookie) {
      throw new UnauthorizedHttpError('Authentication required');
    }

    const { webId: encryptedWebId } = cookie.parse(headers.cookie);

    return {
      ...context,
      authn: {
        webId: decryptCookie(encryptedWebId)
      }
    };
  }
}
