import type { HttpHandlerContext } from '@digita-ai/handlersjs-http';
import type { AuthorizationAgent } from '@janeirodigital/interop-authorization-agent';

export interface SaiContext extends HttpHandlerContext {
  saiSession: AuthorizationAgent;
}

export interface UnauthenticatedAuthnContext extends HttpHandlerContext {
  authn: {
    authenticated: false;
  };
}
export interface AuthenticatedAuthnContext extends HttpHandlerContext {
  authn: {
    authenticated: true;
    issuer: string;
    webId: string;
    clientId: string;
  };
}

export type AuthnContext = UnauthenticatedAuthnContext | AuthenticatedAuthnContext;

export type HttpSolidContext = SaiContext & AuthnContext;
