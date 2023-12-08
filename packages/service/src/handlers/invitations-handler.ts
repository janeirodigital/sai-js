import 'dotenv/config';
import { from, Observable } from 'rxjs';
import { HttpHandler, HttpHandlerResponse } from '@digita-ai/handlersjs-http';
import type { ISessionManager } from '@janeirodigital/sai-server-interfaces';
import type { AuthenticatedAuthnContext } from '../models/http-solid-context';
import { decodeWebId } from '../url-templates';

export class InvitationsHandler extends HttpHandler {
  constructor(private sessionManager: ISessionManager) {
    super();
  }

  async handleAsync(context: AuthenticatedAuthnContext): Promise<HttpHandlerResponse> {
    const userId = decodeWebId(context.request.parameters!.encodedWebId);
    const sai = await this.sessionManager.getSaiSession(userId);

    const capabilityUrl = context.request.url.toString();
    const socialAgentInvitation = await sai.findSocialAgentInvitation(capabilityUrl);
    if (!socialAgentInvitation) throw new Error(`Social Agent Invitation not found! (capabilityUrl: ${capabilityUrl})`);

    let socialAgentRegistration = await sai.findSocialAgentRegistration(context.authn.webId);
    if (!socialAgentRegistration) {
      socialAgentRegistration = await sai.registrySet.hasAgentRegistry.addSocialAgentRegistration(
        context.authn.webId,
        socialAgentInvitation.label,
        socialAgentInvitation.note
      );
    }

    // TODO: create job to discover, add and subscribe to reciprocal registration

    return {
      body: userId,
      status: 200,
      headers: {
        'Content-Type': 'text/plain'
      }
    };
  }

  handle(context: AuthenticatedAuthnContext): Observable<HttpHandlerResponse> {
    return from(this.handleAsync(context));
  }
}
