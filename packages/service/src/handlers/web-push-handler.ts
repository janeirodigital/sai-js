/* eslint-disable class-methods-use-this */

import { from, Observable } from 'rxjs';
import { HttpHandler, HttpHandlerResponse, HttpHandlerContext } from '@digita-ai/handlersjs-http';
import { getLogger } from '@digita-ai/handlersjs-logging';
import { IQueue } from '@janeirodigital/sai-server-interfaces';
import { validateContentType } from '../utils/http-validators';
import { decodeWebId } from '../url-templates';
import { IDelegatedGrantsJobData, IPushNotificationsJobData } from '../models/jobs';

export class WebPushHandler extends HttpHandler {
  private logger = getLogger();

  constructor(
    // private grantsQueue: IQueue,
    // private pushQueue: IQueue
  ) {
    super();
    this.logger.info('WebPushHandler::constructor');
  }

  async handleAsync(context: HttpHandlerContext): Promise<HttpHandlerResponse> {
    // validateContentType(context, 'application/ld+json');
    const webId = decodeWebId(context.request.parameters!.encodedWebId);
    console.log(context.request.body);

    return { body: {}, status: 200, headers: {} };
  }

  handle(context: HttpHandlerContext): Observable<HttpHandlerResponse> {
    this.logger.info('WebPushHandler::handle');
    return from(this.handleAsync(context));
  }
}
