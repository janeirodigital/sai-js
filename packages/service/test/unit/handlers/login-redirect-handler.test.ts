import type { HttpHandlerContext, HttpHandlerRequest } from '@digita-ai/handlersjs-http'
import { InMemoryStorage, type Session } from '@inrupt/solid-client-authn-node'
import { beforeEach, expect, test, vi } from 'vitest'

import type { AuthorizationAgent } from '@janeirodigital/interop-authorization-agent'
import { LoginRedirectHandler, baseUrl, encodeWebId, frontendUrl } from '../../../src'
import { MockedQueue } from '../mocked-queue'

import { SessionManager } from '../../../src/session-manager'

vi.mock('../../../src/session-manager', () => ({
  SessionManager: vi.fn(() => ({
    getOidcSession: vi.fn(),
    getSaiSession: vi.fn(),
  })),
}))

let loginRedirectHandler: LoginRedirectHandler
const manager = vi.mocked(new SessionManager(new InMemoryStorage()))
const queue = new MockedQueue('reciprocal-registrations')

const aliceWebId = 'https://alice.example'
const encodedWebId = encodeWebId(aliceWebId)

beforeEach(() => {
  loginRedirectHandler = new LoginRedirectHandler(manager, queue)
  manager.getOidcSession.mockReset()
})

test('redirects to frontend after handing a valid redirect', async () => {
  const pathname = '/agents/123/redirect'
  const search = 'code=some-code&state=some-state'
  const request = {
    headers: {},
    parameters: { encodedWebId },
    url: new URL(pathname + search, baseUrl),
  } as unknown as HttpHandlerRequest
  const ctx = { request } as HttpHandlerContext

  const handleIncomingRedirectMock = vi.fn(async (completeUrl) => {
    expect(completeUrl).toContain(request.url.pathname + request.url.search)
  })

  manager.getOidcSession.mockImplementationOnce(async (id: string) => {
    expect(id).toBe(aliceWebId)
    return {
      handleIncomingRedirect: handleIncomingRedirectMock,
      info: {
        isLoggedIn: true,
        webId: aliceWebId,
      },
    } as unknown as Session
  })

  manager.getSaiSession.mockImplementationOnce(async (id: string) => {
    expect(id).toBe(aliceWebId)
    return {
      socialAgentRegistrations: [],
    } as unknown as AuthorizationAgent
  })

  await new Promise<void>((done) => {
    loginRedirectHandler.handle(ctx).subscribe((response) => {
      expect(manager.getOidcSession).toBeCalledTimes(1)
      expect(handleIncomingRedirectMock).toBeCalledTimes(1)
      expect(response.status).toBe(302)
      expect(response.headers.location).toBe(frontendUrl)
      done()
    })
  })
})
