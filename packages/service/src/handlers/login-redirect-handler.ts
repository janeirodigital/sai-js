import {
  HttpHandler,
  type HttpHandlerContext,
  type HttpHandlerResponse,
  InternalServerError,
} from '@digita-ai/handlersjs-http'
import { getLogger } from '@digita-ai/handlersjs-logging'
import type { IQueue, ISessionManager } from '@janeirodigital/sai-server-interfaces'
import * as cookie from 'cookie'
import { type Observable, from } from 'rxjs'
import type { IReciprocalRegistrationsJobData } from '../models/jobs'
import { decodeWebId, frontendUrl } from '../url-templates'
import { decryptCookie, encryptCookie } from '../utils/crypto'

export class LoginRedirectHandler extends HttpHandler {
  private logger = getLogger()

  constructor(
    private sessionManager: ISessionManager,
    private queue: IQueue
  ) {
    super()
    this.logger.info('LoginRedirectHandler::constructor')
  }

  handle(context: HttpHandlerContext): Observable<HttpHandlerResponse> {
    this.logger.info('LoginRedirectHandler::handle')
    return from(this.handleAsync(context))
  }

  private async handleAsync(context: HttpHandlerContext): Promise<HttpHandlerResponse> {
    let loginId: string
    if (context.request.headers.cookie) {
      const cookies = cookie.parse(context.request.headers.cookie)
      if (cookies.loginId) {
        loginId = decryptCookie(cookies.loginId)
      }
    }

    const webId = decodeWebId(context.request.parameters!.encodedWebId)

    const oidcSession = await this.sessionManager.getOidcSession(loginId ?? webId)
    // TODO clarify scenario if new a session was just created

    try {
      await oidcSession.handleIncomingRedirect(context.request.url.toString())
    } catch (error) {
      console.error(error)
    }

    if (!oidcSession.info.isLoggedIn || !oidcSession.info.webId) {
      // TODO clarify this scenario
      throw new InternalServerError()
    }
    if (!loginId) {
      // ensure subscribed to reciprocal registrations
      // TODO: change into a single job that will create one job per registration
      const saiSession = await this.sessionManager.getSaiSession(webId)
      for await (const socialAgentRegistration of saiSession.socialAgentRegistrations) {
        if (socialAgentRegistration.reciprocalRegistration) {
          await this.queue.add({
            webId,
            registeredAgent: socialAgentRegistration.registeredAgent,
          } as IReciprocalRegistrationsJobData)
        }
      }

      const setCookie = cookie.serialize('webId', encryptCookie(webId), {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7, // 1 week
        sameSite: 'none',
        path: '/',
        secure: true,
      })

      return {
        body: {},
        status: 302,
        headers: {
          location: frontendUrl,
          'Set-Cookie': setCookie,
        },
      }
    }
  }
}
