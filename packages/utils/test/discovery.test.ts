import { SolidTestUtils, accounts, host } from '@janeirodigital/css-test-utils'
import { DataFactory, Store } from 'n3'
import { type Mock, afterAll, beforeAll, describe, expect, test, vi } from 'vitest'
import {
  AgentRegistrationDiscoveryError,
  DescriptionResourceDiscoveryError,
  INTEROP,
  type RdfResponse,
  discoverAgentRegistration,
  discoverAuthorizationAgent,
  discoverAuthorizationRedirectEndpoint,
  discoverDescriptionResource,
  discoverStorageDescription,
  discoverWebPushService,
} from '../src'

vi.setConfig({ testTimeout: 200_000, hookTimeout: 200_000 })

const stu = new SolidTestUtils(accounts.luka)
beforeAll(async () => await stu.beforeAll())
afterAll(async () => await stu.afterAll())

const webId = 'https://alice.example/#id'
const authorizationAgentIri = 'https://auth.alice.example/'
const rdfFetch: Mock<[], Promise<RdfResponse>> = vi.fn()
const statelessFetch: Mock<[], Promise<Response>> = vi.fn()

describe('discoverAuthorizationAgent', () => {
  test('should discover Authorization Agent from the WebID document', async () => {
    rdfFetch.mockResolvedValueOnce({
      dataset: async () =>
        new Store([
          DataFactory.quad(
            DataFactory.namedNode(webId),
            INTEROP.hasAuthorizationAgent,
            DataFactory.literal(authorizationAgentIri)
          ),
        ]),
    } as unknown as RdfResponse)
    // @ts-ignore
    const iri = await discoverAuthorizationAgent(webId, rdfFetch)
    expect(iri).toBe(authorizationAgentIri)
  })
})

describe('discoverAgentRegistration', () => {
  test('should discover Agent Registration from link header ', async () => {
    const agentRegistrationIri = 'https://auth.alice.example/bcf22534-0187-4ae4-b88f-fe0f9fa96659'
    const linkString = `
      <https://projectron.example/#app>;
      anchor="${agentRegistrationIri}";
      rel="http://www.w3.org/ns/solid/interop#registeredAgent"
    `
    statelessFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: (name: string): string | null => (name === 'Link' ? linkString : null) },
    } as unknown as Response)
    const iri = await discoverAgentRegistration(authorizationAgentIri, statelessFetch)
    expect(iri).toBe(agentRegistrationIri)
  })

  test('should return undefined if no link header ', async () => {
    statelessFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: (): undefined => undefined },
    } as unknown as RdfResponse)
    const iri = await discoverAgentRegistration(authorizationAgentIri, statelessFetch)
    expect(iri).toBeUndefined()
  })

  test('should throw error if the request fails', async () => {
    const iri = 'https://some.iri'
    statelessFetch.mockResolvedValueOnce({
      ok: false,
    } as unknown as RdfResponse)
    expect(discoverAgentRegistration(iri, statelessFetch)).rejects.toThrowError(
      AgentRegistrationDiscoveryError
    )
  })
})

describe('discoverDescriptionResource', () => {
  const resourceIri = 'https://some.iri/'

  test('should discover Description Resource from link header ', async () => {
    const descriptionResourceIri = `${resourceIri}.meta`

    const linkString = `
      <${descriptionResourceIri}>;
      rel="describedby"
    `
    statelessFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: (name: string): string | null => (name === 'Link' ? linkString : null) },
    } as unknown as RdfResponse)
    const iri = await discoverDescriptionResource(resourceIri, statelessFetch)
    expect(iri).toBe(descriptionResourceIri)
  })

  test('should return undefined if no link header ', async () => {
    statelessFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: (): undefined => undefined },
    } as unknown as RdfResponse)
    const iri = await discoverDescriptionResource(resourceIri, statelessFetch)
    expect(iri).toBeUndefined()
  })

  test('should throw error if the request fails', async () => {
    const iri = 'https://some.iri'
    statelessFetch.mockResolvedValueOnce({
      ok: false,
    } as unknown as RdfResponse)
    expect(discoverDescriptionResource(iri, statelessFetch)).rejects.toThrowError(
      DescriptionResourceDiscoveryError
    )
  })
})

describe('discoverDescriptionResource', () => {
  const resourceIri = `${host}/luka/profile/card`

  test('should discover Storage Description from link header ', async () => {
    const storageDescriptionIri = `${host}/luka/.well-known/solid`

    const iri = await discoverStorageDescription(resourceIri, stu.authFetch)
    expect(iri).toBe(storageDescriptionIri)
  })

  test('should return undefined if no link header ', async () => {
    statelessFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: (): undefined => undefined },
    } as unknown as RdfResponse)
    const iri = await discoverDescriptionResource(resourceIri, statelessFetch)
    expect(iri).toBeUndefined()
  })

  test('should throw error if the request fails', async () => {
    const iri = 'https://some.iri'
    statelessFetch.mockResolvedValueOnce({
      ok: false,
    } as unknown as RdfResponse)
    expect(discoverDescriptionResource(iri, statelessFetch)).rejects.toThrowError(
      DescriptionResourceDiscoveryError
    )
  })
})

describe('discoverAuthorizationRedirectEndpoint', () => {
  test('should discover authorization uri from Client ID document', async () => {
    const authorizationRedirectUri = 'https://auth.example/authorize'
    statelessFetch.mockResolvedValueOnce({
      text: async () => `
        {
          "@context": { "interop": "http://www.w3.org/ns/solid/interop#" },
          "interop:hasAuthorizationRedirectEndpoint": "${authorizationRedirectUri}"
        }
      `,
    } as unknown as Response)
    const iri = await discoverAuthorizationRedirectEndpoint(authorizationAgentIri, statelessFetch)
    expect(iri).toBe(authorizationRedirectUri)
  })
})

describe('discoverWebPushService', () => {
  test('should discover web push service from Client ID document', async () => {
    const pushServiceIri = 'https://some.iri/push'
    const publicKey = '79911832617685422231316786426001'
    statelessFetch.mockResolvedValueOnce({
      text: async () => `
        {
          "@context": {
            "interop": "http://www.w3.org/ns/solid/interop#",
            "notify": "http://www.w3.org/ns/solid/notifications#"
          },
          "interop:pushService": { "@id": "${pushServiceIri}" },
          "notify:vapidPublicKey": "${publicKey}"
        }
      `,
    } as unknown as Response)
    // @ts-ignore
    const { id, vapidPublicKey } = await discoverWebPushService(
      authorizationAgentIri,
      statelessFetch
    )
    expect(id).toBe(pushServiceIri)
    expect(vapidPublicKey).toBe(publicKey)
  })
  test('returns undefined if service not found', async () => {
    statelessFetch.mockResolvedValueOnce({
      text: async () => `
        {
          "@context": { "interop": "http://www.w3.org/ns/solid/interop#" },
          "interop:hasAuthorizationRedirectEndpoint": "https://auth.example/redirect"
        }
      `,
    } as unknown as Response)
    // @ts-ignore
    expect(await discoverWebPushService(authorizationAgentIri, statelessFetch)).toBeUndefined()
  })
})
