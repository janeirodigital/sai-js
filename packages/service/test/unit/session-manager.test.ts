import {
  type IStorage,
  InMemoryStorage,
  type Session,
  getSessionFromStorage,
} from '@inrupt/solid-client-authn-node'
import type { NotificationChannel } from '@solid-notifications/types'
import {
  type MockedClass,
  type MockedFunction,
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest'
import type { PushSubscription } from 'web-push'

import { AuthorizationAgent } from '@janeirodigital/interop-authorization-agent'
import { NOTIFY } from '@janeirodigital/interop-utils'

vi.mock('@janeirodigital/interop-authorization-agent')
const MockedAuthorizationAgent = AuthorizationAgent as MockedClass<any>

vi.mock('@inrupt/solid-client-authn-node', async (importOriginal) => {
  const original = (await importOriginal()) as object
  return {
    ...original,
    getSessionFromStorage: vi.fn(),
  }
})
const mockedGetSessionFromStorage = getSessionFromStorage as MockedFunction<any>

import { SessionManager } from '../../src/session-manager'
import { webId2agentUrl } from '../../src/url-templates'

let manager: SessionManager
let storage: IStorage

const webId = 'https://alice.example'

beforeEach(() => {
  vi
  storage = new InMemoryStorage()
  manager = new SessionManager(storage)
  mockedGetSessionFromStorage.mockReset()
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('getSaiSession', () => {
  test('creates sai session', async () => {
    const oidcSession = {
      info: { webId, sessionId: webId, isLoggedIn: true },
      fetch: () => {},
    } as unknown as Session

    mockedGetSessionFromStorage.mockImplementationOnce(() => oidcSession)
    const authAgent = {} as unknown as AuthorizationAgent
    MockedAuthorizationAgent.build.mockImplementationOnce(
      (webid: string, agentid: string, dependencies: { fetch: typeof oidcSession.fetch }) => {
        expect(webid).toBe(webId)
        expect(agentid).toBe(webId2agentUrl(webId))
        expect(dependencies.fetch).toBe(oidcSession.fetch)

        return authAgent
      }
    )

    const saiSession = await manager.getSaiSession(webId)
    expect(saiSession).toBe(authAgent)

    const cachedSession = await manager.getSaiSession(webId)
    expect(cachedSession).toBe(authAgent)
  })
})

describe('getOidcSession', () => {
  test('should return existing oidc session', async () => {
    const oidcSession = {
      info: { webId },
      fetch: () => {},
    } as unknown as Session

    mockedGetSessionFromStorage.mockImplementationOnce(() => oidcSession)
    expect(await manager.getOidcSession(webId)).toBe(oidcSession)
  })

  test('should return a new oidc session if none exist', async () => {
    mockedGetSessionFromStorage.mockImplementationOnce((): any => undefined)

    const session = await manager.getOidcSession(webId)
    expect(session).toBeTruthy()
    expect(session.info.isLoggedIn).toEqual(false)
    expect(session.info.sessionId).toEqual(webId)
  })
})

describe('PushSubscriptions', () => {
  const subscription: PushSubscription = {
    endpoint: 'https://pushservice.example/123',
    keys: {
      p256dh: 'BL7ELU24fJTAlH5Ky',
      auth: 'juarIAPHg',
    },
  }

  test('adds first subscription', async () => {
    await manager.addPushSubscription(webId, subscription)
    const subs = await manager.getPushSubscriptions(webId)
    expect(subs.length).toBe(1)
    expect(subs[0]).toStrictEqual(subscription)
  })

  test('adds another subscription', async () => {
    const another: PushSubscription = {
      endpoint: 'https://pushservice.example/345',
      keys: {
        p256dh: '8N6BDCac8u8li_U5PI',
        auth: 'sOgfeAPHg',
      },
    }
    await manager.addPushSubscription(webId, subscription)
    await manager.addPushSubscription(webId, another)
    const subs = await manager.getPushSubscriptions(webId)
    expect(subs.length).toBe(2)
    expect(subs).toEqual(expect.arrayContaining([subscription, another]))
  })

  test('does not add dupplicates', async () => {
    await manager.addPushSubscription(webId, subscription)
    const subs = await manager.getPushSubscriptions(webId)
    expect(subs.length).toBe(1)
    expect(subs[0]).toStrictEqual(subscription)
    await manager.addPushSubscription(webId, subscription)
    expect(subs.length).toBe(1)
  })
})

describe('WebhookSubscriptions', () => {
  const peerWebId = 'https://bob.example'

  test('sets and gets the subscription', async () => {
    const channel: NotificationChannel = {
      id: 'urn:uuid:6a16912b-236d-426a-bca7-a765e0f2dae9',
      type: NOTIFY.WebhookChannel2023.value,
      topic: 'https://some.example/something',
    }

    await manager.setWebhookSubscription(webId, peerWebId, channel)
    expect(await manager.getWebhookSubscription(webId, peerWebId)).toStrictEqual(channel)
  })

  test('returns undefined if does not exist', async () => {
    expect(await manager.getWebhookSubscription(webId, peerWebId)).toBeUndefined()
  })
})
