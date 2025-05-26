import { randomUUID } from 'node:crypto'
import { fetch } from '@janeirodigital/interop-test-utils'
import { INTEROP, RDF, SKOS } from '@janeirodigital/interop-utils'
import { DataFactory } from 'n3'
import { describe, test } from 'vitest'
import {
  AuthorizationAgentFactory,
  CRUDSocialAgentRegistration,
  type SocialAgentRegistrationData,
} from '../../src'
import { expect } from '../expect'

const webId = 'https://alice.example/#id'
const agentId = 'https://jarvis.alice.example/#agent'
const factory = new AuthorizationAgentFactory(webId, agentId, { fetch, randomUUID })
const snippetIri = 'https://auth.alice.example/bcf22534-0187-4ae4-b88f-fe0f9fa96659'
const newSnippetIri = 'https://auth.alice.example/afb6a337-40df-4fbe-9b00-5c9c1e56c812'
const accessGrantIri = 'https://auth.alice.example/dd442d1b-bcc7-40e2-bbb9-4abfa7309fbe'
const data = {
  registeredAgent: 'https://different.iri/',
  hasAccessGrant: 'https://auth.alice.example/dd442d1b-bcc7-40e2-bbb9-4abfa7309fbe',
  prefLabel: 'Someone',
}

describe('build', () => {
  test('should return instance of Agent Registration', async () => {
    const agentRegistration = await CRUDSocialAgentRegistration.build(snippetIri, factory, false)
    expect(agentRegistration).toBeInstanceOf(CRUDSocialAgentRegistration)
  })

  test('should fetch its data if none passed', async () => {
    const agentRegistration = await CRUDSocialAgentRegistration.build(snippetIri, factory, false)
    expect(agentRegistration.dataset.size).toBe(10)
  })

  test('should set dataset if data passed', async () => {
    const quads = [
      DataFactory.quad(
        DataFactory.namedNode(newSnippetIri),
        RDF.type,
        INTEROP.SocialAgentRegistration
      ),
      DataFactory.quad(
        DataFactory.namedNode(newSnippetIri),
        INTEROP.registeredAgent,
        DataFactory.namedNode(data.registeredAgent)
      ),
      DataFactory.quad(
        DataFactory.namedNode(newSnippetIri),
        INTEROP.hasAccessGrant,
        DataFactory.namedNode(data.hasAccessGrant)
      ),
      DataFactory.quad(
        DataFactory.namedNode(newSnippetIri),
        SKOS.prefLabel,
        DataFactory.literal(data.prefLabel)
      ),
    ]
    const agentRegistration = await CRUDSocialAgentRegistration.build(
      newSnippetIri,
      factory,
      false,
      data
    )
    expect(agentRegistration.dataset.size).toBe(4)
    expect(agentRegistration.dataset).toBeRdfDatasetContaining(...quads)
  })

  test('should have updatedAt and registeredAt uset for new before update', async () => {
    const agentRegistration = await CRUDSocialAgentRegistration.build(
      newSnippetIri,
      factory,
      false,
      data
    )
    expect(agentRegistration.registeredAt).toBeUndefined()
    expect(agentRegistration.updatedAt).toBeUndefined()
  })
})

describe('hasAccessGrant', () => {
  test('should have getter', async () => {
    const agentRegistration = await CRUDSocialAgentRegistration.build(snippetIri, factory, false)
    expect(agentRegistration.hasAccessGrant).toBe(accessGrantIri)
  })
})

describe('registeredAgent', () => {
  test('should have getter', async () => {
    const agentRegistration = await CRUDSocialAgentRegistration.build(snippetIri, factory, false)
    expect(agentRegistration.registeredAgent).toBe('https://projectron.example/#app')
  })
})

describe('setAccessGrant', () => {
  test('updates dataset when previous existed', async () => {
    const agentRegistration = await CRUDSocialAgentRegistration.build(snippetIri, factory, false)
    const newAccessGrantIri = 'https://auth.alice.example/812a837d-6774-448e-b4c0-f05763deda3d'
    expect(agentRegistration.hasAccessGrant).toBe(
      'https://auth.alice.example/dd442d1b-bcc7-40e2-bbb9-4abfa7309fbe'
    )
    await agentRegistration.setAccessGrant(newAccessGrantIri)
    expect(agentRegistration.hasAccessGrant).toBe(newAccessGrantIri)
  })

  test('updates dataset if existed', async () => {
    const noAgData = {
      ...data,
      hasAccessGrant: undefined as undefined,
      prefLabel: 'Jane',
    } as SocialAgentRegistrationData
    const agentRegistration = await CRUDSocialAgentRegistration.build(
      newSnippetIri,
      factory,
      false,
      noAgData
    )
    const newAccessGrantIri = 'https://auth.alice.example/812a837d-6774-448e-b4c0-f05763deda3d'
    expect(agentRegistration.hasAccessGrant).toBeUndefined()
    await agentRegistration.setAccessGrant(newAccessGrantIri)
    expect(agentRegistration.hasAccessGrant).toBe(newAccessGrantIri)
  })
})
