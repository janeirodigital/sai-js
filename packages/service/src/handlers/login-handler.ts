import { randomUUID } from 'node:crypto'
import {
  HttpHandler,
  type HttpHandlerContext,
  type HttpHandlerResponse,
} from '@digita-ai/handlersjs-http'
import { getLogger } from '@digita-ai/handlersjs-logging'
import { type BaseFactory, ReadableWebIdProfile } from '@janeirodigital/interop-data-model'
import { fetchWrapper } from '@janeirodigital/interop-utils'
import type { ISessionManager } from '@janeirodigital/sai-server-interfaces'
import * as cookie from 'cookie'
import { type Observable, from } from 'rxjs'
import { initLogin } from '../services'
import { agentRedirectUrl, webId2agentUrl } from '../url-templates'
import { encryptCookie } from '../utils/crypto'

export class LoginHandler extends HttpHandler {
  private logger = getLogger()

  constructor(private sessionManager: ISessionManager) {
    super()
    this.logger.info('LoginHandler::constructor')
  }

  handle(context: HttpHandlerContext): Observable<HttpHandlerResponse> {
    this.logger.info('LoginHandler::handle')
    return from(this.handleAsync(context))
  }

  private async handleAsync(context: HttpHandlerContext): Promise<HttpHandlerResponse> {
    const webId = context.request.body
    const webIdProfile = await ReadableWebIdProfile.build(webId, {
      fetch: fetchWrapper(fetch),
    } as BaseFactory)
    // TODO: error handling
    const oidcSession = await this.sessionManager.getOidcSession(webId)
    let completeRedirectUrl: string
    let setCookie: string

    if (oidcSession.info.isLoggedIn) {
      const loginId = randomUUID()
      const loginSession = await this.sessionManager.getOidcSession(loginId)
      completeRedirectUrl = await initLogin(loginSession, webId, webIdProfile.oidcIssuer)

      setCookie = cookie.serialize('loginId', encryptCookie(loginId), {
        httpOnly: true,
        maxAge: 60 * 10, // 10 minutes
        sameSite: 'none',
        path: agentRedirectUrl(webId2agentUrl(webId)),
        secure: true,
      })
    } else {
      completeRedirectUrl = await initLogin(oidcSession, webId, webIdProfile.oidcIssuer)
    }

    return {
      headers: {
        'Content-Type': 'application/json',
        ...(setCookie ? { 'Set-Cookie': setCookie } : {}),
      },
      status: 200,
      body: JSON.stringify(completeRedirectUrl),
    }
  }
}
