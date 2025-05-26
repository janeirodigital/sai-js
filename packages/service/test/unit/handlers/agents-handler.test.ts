import type { HttpHandlerRequest } from '@digita-ai/handlersjs-http'
import { InMemoryStorage } from '@inrupt/solid-client-authn-node'
import type { AuthorizationAgent } from '@janeirodigital/interop-authorization-agent'
import { INTEROP } from '@janeirodigital/interop-utils'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import {
  AgentsHandler,
  type AuthenticatedAuthnContext,
  SessionManager,
  type UnauthenticatedAuthnContext,
  agentRedirectUrl,
  encodeWebId,
  webId2agentUrl,
} from '../../../src'

vi.mock('../../../src/session-manager', async (originalModule) => {
  const mod = (await originalModule()) as object

  return {
    ...mod,
    SessionManager: vi.fn(() => ({
      getSaiSession: vi.fn(),
    })),
  }
})

const aliceWebId = 'https://alice.example'
const aliceAgentUrl = webId2agentUrl(aliceWebId)

const manager = vi.mocked(new SessionManager(new InMemoryStorage()))
let agentsHandler: AgentsHandler

beforeEach(() => {
  manager.getSaiSession.mockReset()
  agentsHandler = new AgentsHandler(manager)
})

describe('unauthenticated request', () => {
  test('should contain valid Client ID Document', async () => {
    const request = {
      headers: {},
      url: aliceAgentUrl,
    } as unknown as HttpHandlerRequest
    const authn = {
      authenticated: false,
    }
    const ctx = { request, authn } as UnauthenticatedAuthnContext

    await new Promise<void>((done) => {
      agentsHandler.handle(ctx).subscribe((response) => {
        expect(response.body.client_id).toContain(encodeWebId(aliceWebId))
        expect(response.body.redirect_uris).toContain(agentRedirectUrl(aliceAgentUrl))
        expect(response.body.grant_types).toEqual(
          expect.arrayContaining(['authorization_code', 'refresh_token'])
        )
        done()
      })
    })
  })
})

describe('authenticated request', () => {
  const clientId = 'https://client.example/'

  const authn = {
    authenticated: true,
    webId: aliceWebId,
    clientId,
  }

  test('application registration discovery', async () => {
    const applicationRegistrationIri = 'https://some.example/application-registration'

    manager.getSaiSession.mockImplementation(
      async (webId) =>
        ({
          webId,
          findApplicationRegistration: async (applicationId) => {
            expect(applicationId).toBe(clientId)
            return { iri: applicationRegistrationIri }
          },
        }) as AuthorizationAgent
    )

    const request = {
      url: aliceAgentUrl,
    } as unknown as HttpHandlerRequest

    const ctx = { request, authn } as AuthenticatedAuthnContext

    await new Promise<void>((done) => {
      agentsHandler.handle(ctx).subscribe((response) => {
        expect(manager.getSaiSession).toBeCalledWith(aliceWebId)
        expect(response.headers.Link).toBe(
          `<${clientId}>; anchor="${applicationRegistrationIri}"; rel="${INTEROP.registeredAgent.value}"`
        )
        done()
      })
    })
  })

  test('social agent registration discovery', async () => {
    const bobWebId = 'https://bob.example/'
    const socialAgentRegistrationIri = 'https://some.example/application-registration'

    manager.getSaiSession.mockImplementation(
      async (webId) =>
        ({
          webId,
          findSocialAgentRegistration: async (webid) => {
            expect(webid).toBe(bobWebId)
            return { iri: socialAgentRegistrationIri }
          },
        }) as AuthorizationAgent
    )

    const request = {
      url: aliceAgentUrl,
    } as unknown as HttpHandlerRequest

    const ctx = {
      request,
      authn: {
        authenticated: true,
        webId: bobWebId,
        clientId,
      },
    } as AuthenticatedAuthnContext

    await new Promise<void>((done) => {
      agentsHandler.handle(ctx).subscribe((response) => {
        expect(manager.getSaiSession).toBeCalledWith(aliceWebId)
        expect(response.headers.Link).toBe(
          `<${bobWebId}>; anchor="${socialAgentRegistrationIri}"; rel="${INTEROP.registeredAgent.value}"`
        )
        done()
      })
    })
  })
})
