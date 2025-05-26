import type { HttpHandlerContext } from '@digita-ai/handlersjs-http'

export interface UnauthenticatedAuthnContext extends HttpHandlerContext {
  authn: {
    authenticated: false
  }
}
export interface AuthenticatedAuthnContext extends HttpHandlerContext {
  authn: {
    authenticated: true
    issuer: string
    webId: string
    clientId: string
  }
}

export interface CookieContext extends HttpHandlerContext {
  authn: {
    webId: string
  }
}

export type AuthnContext = UnauthenticatedAuthnContext | AuthenticatedAuthnContext
