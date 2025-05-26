import {
  BadRequestHttpError,
  type HttpHandlerContext,
  UnauthorizedHttpError,
} from '@digita-ai/handlersjs-http'
import {
  type RequestMethod,
  type SolidAccessTokenPayload,
  createSolidTokenVerifier,
} from '@solid/access-token-verifier'
import { type Observable, from } from 'rxjs'
import type { AuthnContext } from '../models/http-solid-context'
import type { HttpContextHandler } from './middleware-http-handler'

/**
 * Uses  access-token-verifier and sets authn on the context if token was provided,
 * if strict throws a 400 response if the token is not provided or fails verification.
 *
 * returns AuthenticatedAuthnContext
 * context.authn {
 *   authenticated: true
 *   webId: string
 *   clientId: string
 * }
 *
 * if not strict can return UnauthenticatedAuthnContext
 *
 * context.authn {
 * authenticated: false
 * }
 */
export class AuthnContextHandler implements HttpContextHandler {
  constructor(private strict = true) {}

  handle(context: HttpHandlerContext): Observable<AuthnContext> {
    return from(this.handleAsync(context))
  }

  async handleAsync(context: HttpHandlerContext): Promise<AuthnContext> {
    // TODO check for alternative casing on the header names
    const {
      headers: { authorization, dpop },
      method,
    } = context.request

    // when no authn headers present
    if (!authorization && !dpop) {
      if (this.strict) {
        throw new UnauthorizedHttpError('Authentication required')
      }
      return {
        ...context,
        authn: {
          authenticated: false,
        },
      }
    }

    // when one of the authn headers is missing
    if (!authorization || !dpop) {
      throw new BadRequestHttpError('Authorization or DPoP header missing')
    }

    const verifier = createSolidTokenVerifier()
    let token: SolidAccessTokenPayload
    try {
      token = await verifier(authorization, {
        header: dpop as string,
        method: method as RequestMethod,
        url: context.request.url.toString(),
      })
      if (!token.client_id) {
        throw new UnauthorizedHttpError('client_id required')
      }
      return {
        ...context,
        authn: {
          authenticated: true,
          issuer: token.iss,
          webId: token.webid,
          clientId: token.client_id,
        },
      }
    } catch (error: unknown) {
      throw new UnauthorizedHttpError(
        `Error verifying WebID via DPoP-bound access token: ${(error as Error).message}`
      )
    }
  }
}
