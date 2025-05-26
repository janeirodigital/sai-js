import 'dotenv/config'

export function encodeBase64(str: string): string {
  return Buffer.from(str).toString('base64')
}

export function decodeBase64(encoded: string): string {
  return Buffer.from(encoded, 'base64').toString('ascii')
}

export const baseUrl: string = process.env.BASE_URL!

export const frontendUrl: string = process.env.FRONTEND_URL!

export function encodeWebId(webId: string): string {
  return encodeBase64(webId)
}

export function decodeWebId(encoded: string): string {
  return decodeBase64(encoded)
}

export function webId2agentUrl(webId: string): string {
  const encoded = encodeWebId(webId)
  return `${baseUrl}/agents/${encoded}`
}

export function agentUrl2encodedWebId(agentUrl: string): string {
  return agentUrl.split('/').at(-1)!
}

export function agentUrl2webId(agentUrl: string): string {
  return decodeWebId(agentUrl2encodedWebId(agentUrl))
}

export function agentRedirectUrl(agentUrl: string): string {
  return `${agentUrl}/redirect`
}

export function webhookTargetUrl(webId: string, peerWebId: string): string {
  return `${baseUrl}/agents/${encodeWebId(webId)}/webhook/${encodeWebId(peerWebId)}`
}

export function webhookPushUrl(webId: string, applicationId: string): string {
  return `${baseUrl}/agents/${encodeWebId(webId)}/webhook-push/${encodeBase64(applicationId)}`
}

export function webPushUnsubscribeUrl(webId: string, topic: string): string {
  return `${baseUrl}/agents/${encodeWebId(webId)}/webpush/${encodeBase64(topic)}`
}

export function invitationCapabilityUrl(webId: string, uuid: string): string {
  return `${baseUrl}/agents/${encodeWebId(webId)}/invitation/${uuid}`
}
