import { randomUUID } from 'node:crypto'
import type { RdfFetch } from '@janeirodigital/interop-utils'
import { describe, test } from 'vitest'
import { AuthorizationAgentFactory } from '../../src'
import { expect } from '../expect'

const webId = 'https://alice.example/#id'
const agentId = 'https://jarvis.alice.example/#agent'
const snippetIri = 'https://acme.pod.docker/projectron/id'
const snippetText = `
{
  "@context": [
    "https://www.w3.org/ns/solid/oidc-context.jsonld",
    {
      "interop": "http://www.w3.org/ns/solid/interop#"
    }
  ]  ,
  "client_id": "https://acme.pod.docker/projectron/id",
  "client_name": "Projectron",
  "logo_uri": "https://robohash.org/https://projectron.example/?set=set3",
  "redirect_uris": ["https://app.example/redirect"],
  "grant_types" : ["refresh_token","authorization_code"],
  "interop:hasAccessNeedGroup": "https://acme.pod.docker/projectron/access-needs#need-group-pm",
  "interop:hasAuthorizationCallbackEndpoint": "https://app.example"
}
`
const fetch = {
  raw: async () => ({ text: async () => snippetText }),
} as unknown as RdfFetch

const factory = new AuthorizationAgentFactory(webId, agentId, { fetch, randomUUID })

describe('getters', () => {
  test('hasAccessNeedGroup', async () => {
    const clientIdDocument = await factory.readable.clientIdDocument(snippetIri)
    expect(clientIdDocument.hasAccessNeedGroup).toBe(
      'https://acme.pod.docker/projectron/access-needs#need-group-pm'
    )
  })
  test('callbackEndpoint', async () => {
    const clientIdDocument = await factory.readable.clientIdDocument(snippetIri)
    expect(clientIdDocument.callbackEndpoint).toBe('https://app.example')
  })

  test('clientName', async () => {
    const clientIdDocument = await factory.readable.clientIdDocument(snippetIri)
    expect(clientIdDocument.clientName).toEqual('Projectron')
  })

  test('logoUri', async () => {
    const clientIdDocument = await factory.readable.clientIdDocument(snippetIri)
    expect(clientIdDocument.logoUri).toEqual(
      'https://robohash.org/https://projectron.example/?set=set3'
    )
  })
})
