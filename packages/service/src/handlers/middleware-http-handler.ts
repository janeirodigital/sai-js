import { Handler } from '@digita-ai/handlersjs-core'
import type { HttpHandlerContext } from '@digita-ai/handlersjs-http'
import type { Observable } from 'rxjs'

/**
 * Acts based on the given HttpHandlerContext.
 */
export abstract class HttpContextHandler<
  T extends HttpHandlerContext = HttpHandlerContext,
> extends Handler<T, T> {
  abstract handle(context: T): Observable<T>
}
