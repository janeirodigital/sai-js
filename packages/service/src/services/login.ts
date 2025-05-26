import 'dotenv/config'
import type { Session } from '@inrupt/solid-client-authn-node'
import { agentRedirectUrl, webId2agentUrl } from '../url-templates'

export async function initLogin(
  oidcSession: Session,
  webId: string,
  oidcIssuer: string
): Promise<string> {
  const agentUrl = webId2agentUrl(webId)

  const completeRedirectUrl: string = await new Promise((resolve) => {
    oidcSession.login({
      redirectUrl: agentRedirectUrl(agentUrl),
      oidcIssuer,
      clientName: process.env.APP_NAME,
      clientId: agentUrl,
      handleRedirect: (url: string) => {
        resolve(url)
      },
    })
  })

  return completeRedirectUrl
}
