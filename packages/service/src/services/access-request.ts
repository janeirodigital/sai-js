import { AuthorizationAgent } from '@janeirodigital/interop-authorization-agent';

export async function requestAccessUsingApplicationNeeds(
  applicationIri: string,
  webId: string,
  saiSession: AuthorizationAgent
): Promise<void> {
  const socialAgentRegistration = await saiSession.findSocialAgentRegistration(webId);
  const clientIdDocument = await saiSession.factory.readable.clientIdDocument(applicationIri);
  await socialAgentRegistration.setAccessNeedGroup(clientIdDocument.hasAccessNeedGroup);
}
