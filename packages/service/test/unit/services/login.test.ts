import type { Session } from '@inrupt/solid-client-authn-node'
import { expect, test, vi } from 'vitest'
import { agentRedirectUrl, webId2agentUrl } from '../../../src'

import { initLogin } from '../../../src/services'

const aliceWebId = 'https://alice.example'
const oidcIssuer = 'https://op.example'
const agentUrl = webId2agentUrl(aliceWebId)
const opRedirectUrl = 'https:/op.example/auth/?something'

const oidcSession = {
  login: vi.fn(async (loginOptions: any) => {
    loginOptions.handleRedirect(opRedirectUrl)
  }),
} as unknown as Session

test('calls login on oidcSession', async () => {
  const completeRedirectUrl = await initLogin(oidcSession, aliceWebId, oidcIssuer)
  expect(completeRedirectUrl).toBe(opRedirectUrl)
  expect(oidcSession.login).toHaveBeenCalledWith(
    expect.objectContaining({
      redirectUrl: agentRedirectUrl(agentUrl),
      oidcIssuer,
      clientId: agentUrl,
    })
  )
})
