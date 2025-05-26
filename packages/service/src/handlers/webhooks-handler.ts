import {
  HttpHandler,
  type HttpHandlerContext,
  type HttpHandlerResponse,
} from '@digita-ai/handlersjs-http'
import { getLogger } from '@digita-ai/handlersjs-logging'
import type { IQueue } from '@janeirodigital/sai-server-interfaces'
import { type Observable, from } from 'rxjs'
import type { IDelegatedGrantsJobData, IPushNotificationsJobData } from '../models/jobs'
import { decodeWebId } from '../url-templates'
import { validateContentType } from '../utils/http-validators'

// interface Notification {
//   object: {
//     id: string;
//   };
// }

export class WebHooksHandler extends HttpHandler {
  private logger = getLogger()

  constructor(
    private grantsQueue: IQueue,
    private pushQueue: IQueue
  ) {
    super()
    this.logger.info('WebHooksHandler::constructor')
  }

  async handleAsync(context: HttpHandlerContext): Promise<HttpHandlerResponse> {
    validateContentType(context, 'application/ld+json')

    // verify if sender is Authorized
    // if (!this.senderAuthorized(context)) throw new UnauthorizedHttpError();

    // const notification = context.request.body as Notification;
    // this.validateNotification(notification);

    const webId = decodeWebId(context.request.parameters!.encodedWebId)
    const peerWebId = decodeWebId(context.request.parameters!.encodedPeerWebId)

    // notification from a reciprocal agent registration

    // ignore Add events
    // TODO: body should be parsed in middleware
    if (JSON.parse(context.request.body).type === 'Update') {
      // create job to update delegated data grants
      await this.grantsQueue.add({ webId, registeredAgent: peerWebId } as IDelegatedGrantsJobData)
      // send push notification
      await this.pushQueue.add({ webId, registeredAgent: peerWebId } as IPushNotificationsJobData)
    }

    return { body: {}, status: 200, headers: {} }
  }

  handle(context: HttpHandlerContext): Observable<HttpHandlerResponse> {
    this.logger.info('WebHooksHandler::handle')
    return from(this.handleAsync(context))
  }

  // validateNotification(notification: Notification): void {
  //   if (!notification.object?.id) throw new BadRequestHttpError();
  // }

  // TODO: as spec updates, use webId from subscription response
  // senderAuthorized(context: AuthenticatedAuthnContext): boolean {
  //   return context.authn.webId === decodeWebId(context.request.parameters!.encodedPeerWebId);
  // }
}
