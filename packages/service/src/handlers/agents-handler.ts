import 'dotenv/config';
import { from, Observable } from 'rxjs';
import { HttpHandler, HttpHandlerResponse } from '@digita-ai/handlersjs-http';
import { INTEROP } from '@janeirodigital/interop-namespaces';
import type { ISessionManager } from '@janeirodigital/sai-server-interfaces';
import type { AuthnContext } from '../models/http-solid-context';
import { agentRedirectUrl, agentUrl2webId } from '../url-templates';

export class AgentsHandler extends HttpHandler {
  constructor(private sessionManager: ISessionManager) {
    super();
  }

  /*
   * If WebID from the request is the same as WebID associated with AuthZ Agent, finds Application Registration.
   * Otherwise finds Social Agent Registration for WebID from the request.
   * Returns an object with
   * agent - IRI denoting the registered agent for the registration
   * registration - IRI denoting the registration
   */
  async findAgentRegistration(
    webIdFromRequest: string,
    applicationId: string,
    agentUrl: string
  ): Promise<{ agent: string; registration?: string }> {
    const sai = await this.sessionManager.getSaiSession(agentUrl2webId(agentUrl));

    if (sai.webId === webIdFromRequest) {
      return {
        agent: applicationId,
        registration: (await sai.findApplicationRegistration(applicationId))?.iri
      };
    } else {
      return {
        agent: webIdFromRequest,
        registration: (await sai.findSocialAgentRegistration(webIdFromRequest))?.iri
      };
    }
  }

  async handleAsync(context: AuthnContext): Promise<HttpHandlerResponse> {
    const agentUrl = context.request.url.toString();
    if (!context.authn.authenticated) {
      return {
        body: this.clientIdDocument(agentUrl),
        status: 200,
        headers: { 'Content-Type': 'application/ld+json' }
      };
    }
    const { agent, registration } = await this.findAgentRegistration(
      context.authn.webId,
      context.authn.clientId,
      agentUrl
    );
    const headers: { [key: string]: string } = {};
    if (registration) {
      headers['Content-Type'] = 'application/ld+json';
      headers['Link'] = `<${agent}>; anchor="${registration}"; rel="${INTEROP.registeredAgent.value}"`;
    }
    return {
      body: this.clientIdDocument(agentUrl),
      status: 200,
      headers
    };
  }

  clientIdDocument(agentUrl: string) {
    return {
      '@context': [
        'https://www.w3.org/ns/solid/oidc-context.jsonld',
        {
          interop: 'http://www.w3.org/ns/solid/interop#'
        }
      ],
      client_id: agentUrl,
      client_name: 'Solid Authorization Agent',
      redirect_uris: [agentRedirectUrl(agentUrl)],
      grant_types: ['refresh_token', 'authorization_code'],
      'interop:hasAuthorizationRedirectEndpoint': process.env.FRONTEND_AUTHORIZATION_URL!
    };
  }

  handle(context: AuthnContext): Observable<HttpHandlerResponse> {
    return from(this.handleAsync(context));
  }
}
