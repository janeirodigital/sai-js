import type { AuthorizationAgent } from '@janeirodigital/interop-authorization-agent'

export async function requestAccessUsingApplicationNeeds(
  saiSession: AuthorizationAgent,
  applicationIri: string,
  webId: string
): Promise<void> {
  const socialAgentRegistration = await saiSession.findSocialAgentRegistration(webId)
  const clientIdDocument = await saiSession.factory.readable.clientIdDocument(applicationIri)
  await socialAgentRegistration.setAccessNeedGroup(clientIdDocument.hasAccessNeedGroup)
}
