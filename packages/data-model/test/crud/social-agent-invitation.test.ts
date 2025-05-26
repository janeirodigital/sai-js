import { randomUUID } from 'node:crypto'
import { fetch } from '@janeirodigital/interop-test-utils'
import { describe, test } from 'vitest'
import { AuthorizationAgentFactory } from '../../src'
import { expect } from '../expect'

const webId = 'https://alice.example/#id'
const agentId = 'https://jarvis.alice.example/#agent'

describe('build', () => {
  const snippetIri = 'https://auth.alice.example/some-inviation'
  const factory = new AuthorizationAgentFactory(webId, agentId, { fetch, randomUUID })

  const data = {
    capabilityUrl: 'https://auth.alice.example/some-secret-url',
    prefLabel: 'Yori',
    note: 'A cage fighter',
  }

  test('getters', async () => {
    const socialAgentInvitation = await factory.crud.socialAgentInvitation(snippetIri, data)
    expect(socialAgentInvitation.capabilityUrl).toBe(data.capabilityUrl)
    expect(socialAgentInvitation.label).toBe(data.prefLabel)
    expect(socialAgentInvitation.note).toBe(data.note)
  })

  test('setting registerAgent', async () => {
    const bobId = 'https://bob.example'
    const socialAgentInvitation = await factory.crud.socialAgentInvitation(snippetIri, data)
    socialAgentInvitation.registeredAgent = bobId
    expect(socialAgentInvitation.registeredAgent).toBe(bobId)
  })
})
