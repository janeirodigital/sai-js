import { randomUUID } from 'node:crypto'
import { SolidTestUtils, accounts } from '@janeirodigital/css-test-utils'
import { DataOwner, ReadableApplicationRegistration } from '@janeirodigital/interop-data-model'
import { statelessFetch } from '@janeirodigital/interop-test-utils'
import type { RdfResponse } from '@janeirodigital/interop-utils'
import * as utils from '@janeirodigital/interop-utils'
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'

import { Application } from '../src'

vi.setConfig({ testTimeout: 200_000, hookTimeout: 200_000 })

const stu = new SolidTestUtils(accounts.luka)
beforeAll(async () => await stu.beforeAll())
afterAll(async () => await stu.afterAll())

const webId = 'https://alice.example/#id'
const applicationId = 'https://projectron.example/'

const linkString = `
  <https://projectron.example/#app>;
  anchor="https://auth.alice.example/bcf22534-0187-4ae4-b88f-fe0f9fa96659";
  rel="http://www.w3.org/ns/solid/interop#registeredAgent"
`

describe('applicatrion registration exists', () => {
  const mocked = vi.fn(statelessFetch)
  const responseMock = {
    ok: true,
    headers: { get: (name: string): string | null => (name === 'Link' ? linkString : null) },
  } as unknown as RdfResponse
  responseMock.clone = () => ({ ...responseMock })

  test('should build application registration if discovered', async () => {
    mocked.mockResolvedValueOnce(await statelessFetch(webId)).mockResolvedValueOnce(responseMock)
    const app = await Application.build(webId, applicationId, { fetch: mocked, randomUUID })
    expect(app.hasApplicationRegistration).toBeInstanceOf(ReadableApplicationRegistration)
  })

  test('should have dataOwners getter', async () => {
    mocked.mockResolvedValueOnce(await statelessFetch(webId)).mockResolvedValueOnce(responseMock)
    const app = await Application.build(webId, applicationId, { fetch: mocked, randomUUID })
    expect(app.dataOwners).toHaveLength(3)
    for (const owner of app.dataOwners) {
      expect(owner).toBeInstanceOf(DataOwner)
    }
  })
})
describe('discovery helpers', () => {
  const expectedRedirectUriBase = 'https://auth.example/authorize'
  const mocked = vi.fn(statelessFetch)
  const responseMock = { ok: true, headers: { get: (): null => null } } as unknown as RdfResponse
  responseMock.clone = () => ({ ...responseMock })

  test('should not build appliction registration if not discovered', async () => {
    mocked.mockResolvedValueOnce(await statelessFetch(webId)).mockResolvedValueOnce(responseMock)
    const app = await Application.build(webId, applicationId, { fetch: mocked, randomUUID })
    expect(app.hasApplicationRegistration).toBeUndefined()
  })

  test('should have authorizationRedirectEndpoint discovered', async () => {
    mocked.mockResolvedValueOnce(await statelessFetch(webId)).mockResolvedValueOnce(responseMock)
    const app = await Application.build(webId, applicationId, { fetch: mocked, randomUUID })
    expect(app.authorizationRedirectEndpoint).toBe(expectedRedirectUriBase)
  })

  test('should have correct authorizationRedirectUri', async () => {
    mocked.mockResolvedValueOnce(await statelessFetch(webId)).mockResolvedValueOnce(responseMock)
    const app = await Application.build(webId, applicationId, { fetch: mocked, randomUUID })
    expect(app.authorizationRedirectUri).toBe(
      `${expectedRedirectUriBase}?client_id=${encodeURIComponent(applicationId)}`
    )
  })

  test('should have dataOwners getter returning an empty array', async () => {
    mocked.mockResolvedValueOnce(await statelessFetch(webId)).mockResolvedValueOnce(responseMock)
    const app = await Application.build(webId, applicationId, { fetch: mocked, randomUUID })
    expect(app.dataOwners).toHaveLength(0)
  })

  // TODO: refactor to be independent from order of query parameters
  test('should provide shareUri', async () => {
    mocked.mockResolvedValueOnce(await statelessFetch(webId)).mockResolvedValueOnce(responseMock)
    const app = await Application.build(webId, applicationId, { fetch: mocked, randomUUID })
    const resourceUri = 'some-resource-uri'
    const shareUri = app.getShareUri(resourceUri)
    expect(shareUri).toBe(
      `${expectedRedirectUriBase}?resource=${encodeURIComponent(resourceUri)}&client_id=${encodeURIComponent(
        applicationId
      )}`
    )
  })
})

describe('describe discovery', () => {
  const responseMock = {
    ok: true,
    headers: { get: (name: string): string | null => (name === 'Link' ? linkString : null) },
  } as unknown as RdfResponse
  responseMock.clone = () => ({ ...responseMock })

  const info = {
    id: 'http://localhost:3711/corvax/x7b09z/znmqto/ibc822',
    scope: accounts.shapeTree.Widget,
    resourceServer: accounts.luka.data.corvax,
    parent: 'http://localhost:3711/corvax/x7b09z/mt4xs0/lcea5v',
  }

  beforeEach(() => {
    vi.spyOn(utils, 'discoverAgentRegistration').mockResolvedValueOnce(
      'http://localhost:3711/luka/fypm7e/di5prv/'
    )
    vi.spyOn(utils, 'discoverAuthorizationRedirectEndpoint').mockResolvedValueOnce(
      'https://sai.example/luka/redirect'
    )
    vi.spyOn(utils, 'discoverWebPushService').mockResolvedValueOnce({
      id: 'https://sai.example/luka/webpush',
      vapidPublicKey: 'TODO',
    })
  })

  describe('resourceOwners', () => {
    test('should return set of owenrs', async () => {
      const resourceOwners = new Set([accounts.luka.webId, accounts.vaporcg.webId])
      const app = await Application.build(accounts.luka.webId, accounts.inspector.clientId, {
        fetch: stu.authFetch,
        randomUUID,
      })
      expect(app.resourceOwners()).toEqual(resourceOwners)
    })
  })

  describe('resourceServers', () => {
    test('should return set of resource servers', async () => {
      const resourceServers = new Set(Object.values(accounts.luka.data))
      const app = await Application.build(accounts.luka.webId, accounts.inspector.clientId, {
        fetch: stu.authFetch,
        randomUUID,
      })
      expect(app.resourceServers(accounts.luka.webId, accounts.shapeTree.Gadget)).toEqual(
        resourceServers
      )
    })
  })

  describe('resources', () => {
    test('should return set of resource ids', async () => {
      const resources = new Set([
        'http://localhost:3711/corvax/x7b09z/mt4xs0/lcea5v',
        'http://localhost:3711/corvax/x7b09z/mt4xs0/jey14x',
      ])
      const app = await Application.build(accounts.luka.webId, accounts.inspector.clientId, {
        fetch: stu.authFetch,
        randomUUID,
      })
      expect(await app.resources(accounts.luka.data.corvax, accounts.shapeTree.Gadget)).toEqual(
        resources
      )
    })
  })

  describe('childInfo', () => {
    test('should return info for a child resource', async () => {
      const app = await Application.build(accounts.luka.webId, accounts.inspector.clientId, {
        fetch: stu.authFetch,
        randomUUID,
      })

      // populate parentMap
      await app.resources(info.resourceServer, accounts.shapeTree.Gadget)

      expect(await app.childInfo(info.id, info.scope, info.parent)).toEqual(info)
    })
  })

  describe('setChildInfo', () => {
    test('should set child info in the childMap', async () => {
      const app = await Application.build(accounts.luka.webId, accounts.inspector.clientId, {
        fetch: stu.authFetch,
        randomUUID,
      })

      // populate parentMap
      await app.resources(info.resourceServer, accounts.shapeTree.Gadget)

      // set child info
      await app.setChildInfo(info.id, info.scope, info.parent)

      // @ts-expect-error
      expect(app.getInfo(info.id)).toEqual(info)
    })
  })

  describe('canCreate', () => {
    test('should check if can create new resources in the scope', async () => {
      const app = await Application.build(accounts.luka.webId, accounts.inspector.clientId, {
        fetch: stu.authFetch,
        randomUUID,
      })
      expect(await app.canCreate(info.resourceServer, accounts.shapeTree.Gadget)).toEqual(true)
    })
  })

  describe('canCreateChild', () => {
    test('should check if can create a new child for a resource', async () => {
      const app = await Application.build(accounts.luka.webId, accounts.inspector.clientId, {
        fetch: stu.authFetch,
        randomUUID,
      })

      // populate parentMap
      await app.resources(info.resourceServer, accounts.shapeTree.Gadget)

      expect(app.canCreateChild(info.parent, info.scope)).toBe(true)
    })
  })

  describe('canUpdate', () => {
    test('should check if can update the resource', async () => {
      const app = await Application.build(accounts.luka.webId, accounts.inspector.clientId, {
        fetch: stu.authFetch,
        randomUUID,
      })

      // populate parentMap
      await app.resources(info.resourceServer, accounts.shapeTree.Gadget)

      expect(await app.canUpdate(info.parent)).toEqual(true)
    })
  })

  describe('canDelete', () => {
    test('should check if can delete the resource', async () => {
      const app = await Application.build(accounts.luka.webId, accounts.inspector.clientId, {
        fetch: stu.authFetch,
        randomUUID,
      })

      // populate parentMap
      await app.resources(info.resourceServer, accounts.shapeTree.Gadget)

      expect(await app.canDelete(info.parent)).toEqual(true)
    })
  })

  describe('iriForNew', () => {
    test('should mint correct id for new resource', async () => {
      const app = await Application.build(accounts.luka.webId, accounts.inspector.clientId, {
        fetch: stu.authFetch,
        randomUUID,
      })
      expect(await app.iriForNew(info.resourceServer, accounts.shapeTree.Gadget)).toMatch(
        'http://localhost:3711/corvax/x7b09z/mt4xs0/'
      )
    })
  })

  describe('iriForChild', () => {
    test('should mint correct id for new child for a resource', async () => {
      const app = await Application.build(accounts.luka.webId, accounts.inspector.clientId, {
        fetch: stu.authFetch,
        randomUUID,
      })

      // populate parentMap
      await app.resources(info.resourceServer, accounts.shapeTree.Gadget)

      expect(await app.iriForChild(info.parent, info.scope)).toMatch(
        'http://localhost:3711/corvax/x7b09z/znmqto/'
      )
    })
  })

  describe('findParent', () => {
    test('should find parent resource given a child resource', async () => {
      const app = await Application.build(accounts.luka.webId, accounts.inspector.clientId, {
        fetch: stu.authFetch,
        randomUUID,
      })

      // populate parentMap
      await app.resources(info.resourceServer, accounts.shapeTree.Gadget)

      // set child info
      await app.setChildInfo(info.id, info.scope, info.parent)

      expect(app.findParent(info.id)).toEqual(info.parent)
    })
  })

  describe('discoverDescription', () => {
    test.skip('should find auxiliary description resource', async () => {
      const id = 'https://alice-work.pod.docker/dataRegistry/images/cat'
      const app = await Application.build(accounts.luka.webId, accounts.inspector.clientId, {
        fetch: stu.authFetch,
        randomUUID,
      })
      expect(await app.discoverDescription(id)).toEqual(
        'https://alice-work.pod.docker/dataRegistry/images/cat.meta'
      )
    })
  })
})
