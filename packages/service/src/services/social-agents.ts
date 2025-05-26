import { getLogger } from '@digita-ai/handlersjs-logging'
import type { AuthorizationAgent } from '@janeirodigital/interop-authorization-agent'
import type { CRUDSocialAgentRegistration } from '@janeirodigital/interop-data-model'
import { IRI, SocialAgent } from '@janeirodigital/sai-api-messages'

const logger = getLogger()

export const buildSocialAgentProfile = (registration: CRUDSocialAgentRegistration) =>
  // TODO (angel) data validation and how to handle when the social agents profile is missing some components?
  SocialAgent.make({
    id: IRI.make(registration.registeredAgent),
    label: registration.label,
    note: registration.note,
    authorizationDate: registration.registeredAt!.toISOString(),
    lastUpdateDate: registration.updatedAt?.toISOString(),
    accessGrant: registration.accessGrant?.iri,
    accessRequested: !!registration.hasAccessNeedGroup,
    accessNeedGroup: registration.reciprocalRegistration?.hasAccessNeedGroup,
  })

export const getSocialAgents = async (saiSession: AuthorizationAgent) => {
  const profiles = []
  for await (const registration of saiSession.socialAgentRegistrations) {
    profiles.push(buildSocialAgentProfile(registration))
  }
  return profiles
}

export const addSocialAgent = async (
  saiSession: AuthorizationAgent,
  data: { webId: string; label: string; note?: string }
) => {
  const existing = await saiSession.findSocialAgentRegistration(data.webId)
  if (existing) {
    logger.error('SocialAgentRegistration already exists', { webId: data.webId })
    return buildSocialAgentProfile(existing)
  }
  const registration = await saiSession.registrySet.hasAgentRegistry.addSocialAgentRegistration(
    data.webId,
    data.label,
    data.note
  )

  return buildSocialAgentProfile(registration)
}
