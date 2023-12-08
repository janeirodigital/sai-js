import 'dotenv/config';

export const baseUrl: string = process.env.BASE_URL!;

export const frontendUrl: string = process.env.FRONTEND_URL!;

export function encodeWebId(webId: string): string {
  return Buffer.from(webId).toString('base64');
}

export function decodeWebId(encoded: string): string {
  return Buffer.from(encoded, 'base64').toString('ascii');
}

export function webId2agentUrl(webId: string): string {
  const encoded = encodeWebId(webId);
  return `${baseUrl}/agents/${encoded}`;
}

export function agentUrl2webId(agentUrl: string): string {
  const encoded = agentUrl.split('/').at(-1)!;
  return decodeWebId(encoded);
}

export function agentRedirectUrl(agentUrl: string): string {
  return `${agentUrl}/redirect`;
}

export function webhookTargetUrl(webId: string, peerWebId: string): string {
  return `${baseUrl}/agents/${encodeWebId(webId)}/webhook/${encodeWebId(peerWebId)}`;
}

export function invitationCapabilityUrl(webId: string, uuid: string): string {
  return `${baseUrl}/agents/${encodeWebId(webId)}/invitation/${uuid}`;
}
