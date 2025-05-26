import { InMemoryStorage } from '@inrupt/solid-client-authn-node'
import type { AuthorizationAgent } from '@janeirodigital/interop-authorization-agent'
import { beforeEach, expect, test, vi } from 'vitest'
import { DelegatedGrantsProcessor, type IDelegatedGrantsJob } from '../../../src'

import { SessionManager } from '../../../src/session-manager'

vi.mock('../../../src/session-manager', () => ({
  SessionManager: vi.fn(() => ({
    getSaiSession: vi.fn(),
  })),
}))

const sessionManager = vi.mocked(new SessionManager(new InMemoryStorage()))
const webId = 'https://alice.example'
const registeredAgent = 'https://bob.example'
const job: IDelegatedGrantsJob = { data: { webId, registeredAgent } }
const processor = new DelegatedGrantsProcessor(sessionManager)

const mockedUpdateDG = vi.fn()
const saiSessionMock = {
  updateDelegatedGrants: mockedUpdateDG,
} as unknown as AuthorizationAgent
sessionManager.getSaiSession.mockImplementation(async () => saiSessionMock)

beforeEach(() => {
  sessionManager.getSaiSession.mockClear()
  mockedUpdateDG.mockClear()
})

test('gets sai session of the correct user', async () => {
  await processor.processorFunction(job)
  expect(sessionManager.getSaiSession).toBeCalledWith(webId)
})

test('calls updateDelegatedGrants', async () => {
  await processor.processorFunction(job)
  expect(mockedUpdateDG).toBeCalledWith(registeredAgent)
})
