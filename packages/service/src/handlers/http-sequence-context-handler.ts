import type { Handler } from '@digita-ai/handlersjs-core'
import type { HttpHandlerContext } from '@digita-ai/handlersjs-http'
import { type Observable, mergeMap, of } from 'rxjs'
import type { HttpContextHandler } from './middleware-http-handler'

/**
 * Process the context of a request with the given handlers in preparation for the final HttpHandler
 */
export class HttpSequenceContextHandler<T extends HttpHandlerContext = HttpHandlerContext>
  implements Handler<T, T>
{
  /**
   * @param contextHandlers List of preparing handlers to put the context through.
   */
  constructor(public contextHandlers: HttpContextHandler<T>[]) {}

  handle(ctx: T): Observable<T> {
    let observable = of(ctx)

    for (const handler of this.contextHandlers) {
      observable = observable.pipe(mergeMap((next) => handler.handle(next)))
    }

    return observable
  }
}
