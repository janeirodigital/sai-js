import { InMemoryStorage } from '@inrupt/solid-client-authn-node'
import type { AuthorizationAgent } from '@janeirodigital/interop-authorization-agent'
import { beforeEach, expect, test, vi } from 'vitest'
import { PushNotificationsProcessor } from '../../../src'

import { SessionManager } from '../../../src/session-manager'

vi.mock('../../../src/session-manager', () => ({
  SessionManager: vi.fn(() => ({
    getSaiSession: vi.fn(),
    getPushSubscriptions: vi.fn(),
  })),
}))

const sessionManager = vi.mocked(new SessionManager(new InMemoryStorage()))

const mockedUpdateDG = vi.fn()
const saiSessionMock = {
  updatePushNotifications: mockedUpdateDG,
} as unknown as AuthorizationAgent
sessionManager.getSaiSession.mockImplementation(async () => saiSessionMock)

beforeEach(() => {
  sessionManager.getPushSubscriptions.mockReset()
  sessionManager.getSaiSession.mockClear()
  mockedUpdateDG.mockClear()
})

test('has session manager', () => {
  const instance = new PushNotificationsProcessor(sessionManager)
  expect(instance.sessionManager).toBe(sessionManager)
})
