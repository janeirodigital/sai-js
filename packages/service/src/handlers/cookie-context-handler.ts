import { type HttpHandlerContext, UnauthorizedHttpError } from '@digita-ai/handlersjs-http'
import * as cookie from 'cookie'
import { type Observable, from } from 'rxjs'
import type { CookieContext } from '../models/http-solid-context'
import { decryptCookie } from '../utils/crypto'
import type { HttpContextHandler } from './middleware-http-handler'

export class CookieContextHandler implements HttpContextHandler {
  handle(context: HttpHandlerContext): Observable<CookieContext> {
    return from(this.handleAsync(context))
  }

  async handleAsync(context: HttpHandlerContext): Promise<CookieContext> {
    const headers = context.request.headers
    if (!headers.cookie) {
      throw new UnauthorizedHttpError('Authentication required')
    }

    const { webId: encryptedWebId } = cookie.parse(headers.cookie)

    return {
      ...context,
      authn: {
        webId: decryptCookie(encryptedWebId),
      },
    }
  }
}
