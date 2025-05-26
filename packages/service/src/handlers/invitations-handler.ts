import 'dotenv/config'
import { HttpHandler, type HttpHandlerResponse } from '@digita-ai/handlersjs-http'
import { getLogger } from '@digita-ai/handlersjs-logging'
import type { IQueue, ISessionManager } from '@janeirodigital/sai-server-interfaces'
import { type Observable, from } from 'rxjs'
import type { AuthenticatedAuthnContext } from '../models/http-solid-context'
import type { IReciprocalRegistrationsJobData } from '../models/jobs'
import { decodeWebId } from '../url-templates'

export class InvitationsHandler extends HttpHandler {
  private logger = getLogger()

  constructor(
    private sessionManager: ISessionManager,
    private queue: IQueue
  ) {
    super()
  }

  async handleAsync(context: AuthenticatedAuthnContext): Promise<HttpHandlerResponse> {
    const userId = decodeWebId(context.request.parameters!.encodedWebId)
    const sai = await this.sessionManager.getSaiSession(userId)

    const capabilityUrl = context.request.url.toString()
    const socialAgentInvitation = await sai.findSocialAgentInvitation(capabilityUrl)
    if (!socialAgentInvitation)
      throw new Error(`Social Agent Invitation not found! (capabilityUrl: ${capabilityUrl})`)

    let socialAgentRegistration = await sai.findSocialAgentRegistration(context.authn.webId)
    if (!socialAgentRegistration) {
      socialAgentRegistration = await sai.registrySet.hasAgentRegistry.addSocialAgentRegistration(
        context.authn.webId,
        socialAgentInvitation.label,
        socialAgentInvitation.note
      )
      // create job to discover, add and subscribe to reciprocal registration
      await this.queue.add(
        {
          webId: userId,
          registeredAgent: socialAgentRegistration.registeredAgent,
        } as IReciprocalRegistrationsJobData,
        { delay: 10000 }
      )
    }

    // update invitation with agent who accepted it
    socialAgentInvitation.registeredAgent = socialAgentRegistration.registeredAgent
    await socialAgentInvitation.update()

    return {
      body: userId,
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    }
  }

  handle(context: AuthenticatedAuthnContext): Observable<HttpHandlerResponse> {
    this.logger.info('InvitationsHandler::handle')
    return from(this.handleAsync(context))
  }
}
