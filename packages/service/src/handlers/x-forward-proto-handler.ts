import type {
  HttpHandler,
  HttpHandlerContext,
  HttpHandlerResponse,
} from '@digita-ai/handlersjs-http'
import { getLogger } from '@digita-ai/handlersjs-logging'
import type { Observable } from 'rxjs'

export class XForwardedProtoHandler implements HttpHandler {
  public logger = getLogger()

  /**
   * Checks HTTP X-Forwarded-Proto header, if needed updates protocol of context.request.url
   */
  constructor(private nestedHandler: HttpHandler) {
    if (!nestedHandler) {
      throw new Error('A HttpHandler must be provided')
    }
  }

  handle(context: HttpHandlerContext): Observable<HttpHandlerResponse> {
    const headerValue = context.request.headers['x-forwarded-proto']
    const proto = headerValue.trim().replace(/\s*,.*/u, '')

    this.logger.debug('X-Forwarded-Proto: ', proto)

    if (proto === 'https') {
      context.request.url.protocol = 'https:'
    }

    return this.nestedHandler.handle(context)
  }
}
