import { randomUUID } from 'node:crypto'
import type { AuthorizationAgent } from '@janeirodigital/interop-authorization-agent'
import type { CRUDSocialAgentInvitation } from '@janeirodigital/interop-data-model'
import { IRI, type SocialAgent, SocialAgentInvitation } from '@janeirodigital/sai-api-messages'
import type * as S from 'effect/Schema'
import { invitationCapabilityUrl } from '../url-templates'
import { buildSocialAgentProfile } from './social-agents'

function buildSocialAgentInvitation(socialAgentInvitation: CRUDSocialAgentInvitation) {
  return SocialAgentInvitation.make({
    id: IRI.make(socialAgentInvitation.iri),
    capabilityUrl: socialAgentInvitation.capabilityUrl,
    label: socialAgentInvitation.label,
    note: socialAgentInvitation.note,
  })
}

export async function getSocialAgentInvitations(saiSession: AuthorizationAgent) {
  const invitations = []
  for await (const invitation of saiSession.socialAgentInvitations) {
    if (!invitation.registeredAgent) {
      invitations.push(buildSocialAgentInvitation(invitation))
    }
  }
  return invitations
}

export async function createInvitation(
  saiSession: AuthorizationAgent,
  base: { label: string; note?: string }
): Promise<S.Schema.Type<typeof SocialAgentInvitation>> {
  const socialAgentInvitation =
    await saiSession.registrySet.hasAgentRegistry.addSocialAgentInvitation(
      invitationCapabilityUrl(saiSession.webId, randomUUID()),
      base.label,
      base.note
    )
  return buildSocialAgentInvitation(socialAgentInvitation)
}

export async function acceptInvitation(
  saiSession: AuthorizationAgent,
  invitation: { capabilityUrl: string; label: string; note?: string }
): Promise<S.Schema.Type<typeof SocialAgent>> {
  // discover who issued the invitation
  const response = await saiSession.fetch.raw(invitation.capabilityUrl, {
    method: 'POST',
  })
  if (!response.ok) throw new Error('fetching capability url failed')
  const webId = (await response.text()).trim()
  // TODO: validate with regex
  if (!webId) throw new Error('can not accept invitation without webid')
  // check if agent already has registration
  let socialAgentRegistration = await saiSession.findSocialAgentRegistration(webId)
  if (!socialAgentRegistration) {
    // create new social agent registration
    socialAgentRegistration =
      await saiSession.registrySet.hasAgentRegistry.addSocialAgentRegistration(
        webId,
        invitation.label,
        invitation.note
      )
  }
  // discover and add reciprocal
  if (!socialAgentRegistration.reciprocalRegistration) {
    socialAgentRegistration.discoverAndUpdateReciprocal(saiSession.fetch.raw)
  }

  // currently api-handler creates job for reciprocal registration

  return buildSocialAgentProfile(socialAgentRegistration)
}
