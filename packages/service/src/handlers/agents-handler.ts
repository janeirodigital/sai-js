import 'dotenv/config'
import { HttpHandler, type HttpHandlerResponse } from '@digita-ai/handlersjs-http'
import { INTEROP } from '@janeirodigital/interop-utils'
import type { ISessionManager } from '@janeirodigital/sai-server-interfaces'
import { type Observable, from } from 'rxjs'
import type { AuthnContext } from '../models/http-solid-context'
import { agentRedirectUrl, agentUrl2encodedWebId, agentUrl2webId } from '../url-templates'

function clientIdDocument(agentUrl: string) {
  return {
    '@context': [
      'https://www.w3.org/ns/solid/oidc-context.jsonld',
      'https://www.w3.org/ns/solid/notifications-context/v1',
      {
        interop: 'http://www.w3.org/ns/solid/interop#',
      },
    ],
    client_id: agentUrl,
    client_name: 'Solid Authorization Agent',
    redirect_uris: [agentRedirectUrl(agentUrl)],
    grant_types: ['refresh_token', 'authorization_code'],
    'interop:hasAuthorizationRedirectEndpoint': process.env.FRONTEND_AUTHORIZATION_URL!,
    'interop:pushService': {
      id: `${process.env.BASE_URL}/agents/${agentUrl2encodedWebId(agentUrl)}/webpush`,
      channelType: 'notify:WebPushChannel2023',
      'notify:vapidPublicKey': process.env.VAPID_PUBLIC_KEY!,
    },
  }
}

export class AgentsHandler extends HttpHandler {
  constructor(private sessionManager: ISessionManager) {
    super()
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
    const sai = await this.sessionManager.getSaiSession(agentUrl2webId(agentUrl))

    if (sai.webId === webIdFromRequest) {
      return {
        agent: applicationId,
        registration: (await sai.findApplicationRegistration(applicationId))?.iri,
      }
    }
    return {
      agent: webIdFromRequest,
      registration: (await sai.findSocialAgentRegistration(webIdFromRequest))?.iri,
    }
  }

  async handleAsync(context: AuthnContext): Promise<HttpHandlerResponse> {
    const agentUrl = context.request.url.toString()
    if (!context.authn.authenticated) {
      return {
        body: clientIdDocument(agentUrl),
        status: 200,
        headers: { 'Content-Type': 'application/ld+json' },
      }
    }
    const { agent, registration } = await this.findAgentRegistration(
      context.authn.webId,
      context.authn.clientId,
      agentUrl
    )
    const headers: { [key: string]: string } = {}
    if (registration) {
      headers['Content-Type'] = 'application/ld+json'
      headers.Link = `<${agent}>; anchor="${registration}"; rel="${INTEROP.registeredAgent.value}"`
    }
    return {
      body: clientIdDocument(agentUrl),
      status: 200,
      headers,
    }
  }

  handle(context: AuthnContext): Observable<HttpHandlerResponse> {
    return from(this.handleAsync(context))
  }
}
