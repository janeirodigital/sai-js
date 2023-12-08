import { randomUUID } from 'crypto';
import { CRUDSocialAgentInvitation } from '@janeirodigital/interop-data-model';
import { AuthorizationAgent } from '@janeirodigital/interop-authorization-agent';
import { Invitation, InvitationBase, SocialAgentInvitation, SocialAgent } from '@janeirodigital/sai-api-messages';
import { invitationCapabilityUrl } from '../url-templates';
import { buildSocialAgentProfile } from './social-agents';

function buildSocialAgentInvitation(socialAgentInvitation: CRUDSocialAgentInvitation): SocialAgentInvitation {
  return {
    id: socialAgentInvitation.iri,
    capabilityUrl: socialAgentInvitation.capabilityUrl,
    label: socialAgentInvitation.label,
    note: socialAgentInvitation.note
  };
}

export async function getSocialAgentInvitations(saiSession: AuthorizationAgent): Promise<SocialAgentInvitation[]> {
  const invitations: SocialAgentInvitation[] = [];
  for await (const invitation of saiSession.socialAgentInvitations) {
    invitations.push(buildSocialAgentInvitation(invitation));
  }
  return invitations;
}

export async function createInvitation(
  saiSession: AuthorizationAgent,
  base: InvitationBase
): Promise<SocialAgentInvitation> {
  const socialAgentInvitation = await saiSession.registrySet.hasAgentRegistry.addSocialAgentInvitation(
    invitationCapabilityUrl(saiSession.webId, randomUUID()),
    base.label,
    base.note
  );
  return buildSocialAgentInvitation(socialAgentInvitation);
}

export async function acceptInvitation(saiSession: AuthorizationAgent, invitation: Invitation): Promise<SocialAgent> {
  // discover who issued the invitation
  const response = await saiSession.fetch.raw(invitation.capabilityUrl, {
    method: 'POST'
  });
  const webId = (await response.text()).trim();
  // check if agent already has registration
  let socialAgentRegistration = await saiSession.findSocialAgentRegistration(webId);
  if (!socialAgentRegistration) {
    // create new social agent registration
    socialAgentRegistration = await saiSession.registrySet.hasAgentRegistry.addSocialAgentRegistration(
      webId,
      invitation.label,
      invitation.note
    );
  }
  // discover and add reciprocal
  if (!socialAgentRegistration.reciprocalRegistration) {
    socialAgentRegistration.discoverAndUpdateReciprocal(saiSession.fetch.raw);
  }

  // currently api-handler creates job for reciprocal registration

  return buildSocialAgentProfile(socialAgentRegistration);
}
