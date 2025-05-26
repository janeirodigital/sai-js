import { randomUUID } from 'node:crypto'
import { fetch } from '@janeirodigital/interop-test-utils'
import { INTEROP } from '@janeirodigital/interop-utils'
import { DataFactory } from 'n3'
import { describe, test } from 'vitest'
import {
  AuthorizationAgentFactory,
  CRUDApplicationRegistration,
  CRUDSocialAgentInvitation,
  CRUDSocialAgentRegistration,
} from '../../src'
import { expect } from '../expect'

const webId = 'https://alice.example/#id'
const agentId = 'https://jarvis.alice.example/#agent'
const factory = new AuthorizationAgentFactory(webId, agentId, { fetch, randomUUID })
const snippetIri = 'https://auth.alice.example/1cf3e08b-ffe2-465a-ac5b-94ce165cb8f0'

test('should provide applicationRegistrations', async () => {
  const registry = await factory.crud.agentRegistry(snippetIri)
  let count = 0
  for await (const authorization of registry.applicationRegistrations) {
    count += 1
    expect(authorization).toBeInstanceOf(CRUDApplicationRegistration)
  }
  expect(count).toBe(2)
})

test('should provide socialAgentRegistrations', async () => {
  const registry = await factory.crud.agentRegistry(snippetIri)
  let count = 0
  for await (const authorization of registry.socialAgentRegistrations) {
    count += 1
    expect(authorization).toBeInstanceOf(CRUDSocialAgentRegistration)
  }
  expect(count).toBe(2)
})

// TODO: update snippets with some invitations
test('should provide socialAgentInvitations', async () => {
  const registry = await factory.crud.agentRegistry(snippetIri)
  let count = 0
  for await (const invitation of registry.socialAgentInvitations) {
    count += 1
    expect(invitation).toBeInstanceOf(CRUDSocialAgentRegistration)
  }
  expect(count).toBe(0)
})

describe('findApplicationRegistration', () => {
  test('finds application registration', async () => {
    const applicationIri = 'https://projectron.example/#app'
    const registry = await factory.crud.agentRegistry(snippetIri)
    expect(await registry.findApplicationRegistration(applicationIri)).toBeInstanceOf(
      CRUDApplicationRegistration
    )
  })
})

describe('findSocialAgentRegistration', () => {
  test('finds social agent registration', async () => {
    const socialAgentIri = 'https://acme.example/#corp'
    const registry = await factory.crud.agentRegistry(snippetIri)
    expect(await registry.findSocialAgentRegistration(socialAgentIri)).toBeInstanceOf(
      CRUDSocialAgentRegistration
    )
  })
})

// TODO: update snippets with some invitations
describe.skip('findSocialAgentInvitation', () => {
  test('finds social agent invitation', async () => {
    const socialAgentInvitationIri = 'TODO'
    const registry = await factory.crud.agentRegistry(snippetIri)
    expect(await registry.findSocialAgentInvitation(socialAgentInvitationIri)).toBeInstanceOf(
      CRUDSocialAgentInvitation
    )
  })
})

describe('findRegistration', () => {
  test('finds application registration', async () => {
    const applicationIri = 'https://projectron.example/#app'
    const registry = await factory.crud.agentRegistry(snippetIri)
    expect(await registry.findRegistration(applicationIri)).toBeInstanceOf(
      CRUDApplicationRegistration
    )
  })

  test('finds social agent registration', async () => {
    const socialAgentIri = 'https://acme.example/#corp'
    const registry = await factory.crud.agentRegistry(snippetIri)
    expect(await registry.findRegistration(socialAgentIri)).toBeInstanceOf(
      CRUDSocialAgentRegistration
    )
  })
})

describe('addSocialAgentRegistration', () => {
  const jane = 'https://jane.example'

  test('throws if registration already exists', async () => {
    const socialAgentIri = 'https://acme.example/#corp'
    const registry = await factory.crud.agentRegistry(snippetIri)
    expect(registry.addSocialAgentRegistration(socialAgentIri, 'Someone')).rejects.toThrow(
      'already exists'
    )
  })

  test('returns added registration', async () => {
    const registry = await factory.crud.agentRegistry(snippetIri)
    const registration = await registry.addSocialAgentRegistration(jane, 'Jane')
    expect(registration.registeredAgent).toBe(jane)
  })

  test('local datasets updates with hasSocialAgentRegistration statement', async () => {
    const registry = await factory.crud.agentRegistry(snippetIri)
    const registration = await registry.addSocialAgentRegistration(jane, 'Jane')
    expect(
      registry.dataset.match(
        DataFactory.namedNode(registry.iri),
        INTEROP.hasApplicationRegistration,
        DataFactory.namedNode(registration.iri)
      )
    ).toBeTruthy()
  })
})

describe('addSocialAgentInvitation', () => {
  const capabilityUrl = 'https://auth.jane.example/some-secret-url'

  test.skip('throws if invitation already exists', async () => {
    const registry = await factory.crud.agentRegistry(snippetIri)
    expect(registry.addSocialAgentInvitation(capabilityUrl, 'Someone')).rejects.toThrow(
      'already exists'
    )
  })

  test('returns added invitation', async () => {
    const registry = await factory.crud.agentRegistry(snippetIri)
    const invitation = await registry.addSocialAgentInvitation(capabilityUrl, 'Jane')
    expect(invitation.capabilityUrl).toBe(capabilityUrl)
  })

  test('local datasets updates with hasSocialAgentInvitation statement', async () => {
    const registry = await factory.crud.agentRegistry(snippetIri)
    const invitation = await registry.addSocialAgentInvitation(capabilityUrl, 'Jane')
    expect(
      registry.dataset.match(
        DataFactory.namedNode(registry.iri),
        INTEROP.hasApplicationInvitation,
        DataFactory.namedNode(invitation.iri)
      )
    ).toBeTruthy()
  })
})

describe('addApplicationRegistration', () => {
  const gigaApp = 'https://gigaApp.example'

  test('throws if registration already exists', async () => {
    const applicationIri = 'https://projectron.example/#app'
    const registry = await factory.crud.agentRegistry(snippetIri)
    expect(registry.addApplicationRegistration(applicationIri)).rejects.toThrow('already exists')
  })

  test('returns added registration', async () => {
    const registry = await factory.crud.agentRegistry(snippetIri)
    const registration = await registry.addApplicationRegistration(gigaApp)
    expect(registration.registeredAgent).toBe(gigaApp)
  })

  test('local datasets updates with hasApplicationRegistration statement', async () => {
    const registry = await factory.crud.agentRegistry(snippetIri)
    const registration = await registry.addApplicationRegistration(gigaApp)
    expect(
      registry.dataset.match(
        DataFactory.namedNode(registry.iri),
        INTEROP.hasApplicationRegistration,
        DataFactory.namedNode(registration.iri)
      )
    ).toBeTruthy()
  })
  test.todo('gets data from ClientID Document')
})
