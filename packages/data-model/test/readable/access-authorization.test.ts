import { randomUUID } from 'node:crypto'
import { fetch } from '@janeirodigital/interop-test-utils'
import { describe, test } from 'vitest'
import {
  AuthorizationAgentFactory,
  type CRUDApplicationRegistration,
  type CRUDSocialAgentRegistration,
  ImmutableAccessGrant,
  ReadableDataAuthorization,
} from '../../src'
import { expect } from '../expect'

const webId = 'https://alice.example/#id'
const agentId = 'https://jarvis.alice.example/#agent'
const factory = new AuthorizationAgentFactory(webId, agentId, { fetch, randomUUID })
const snippetIri = 'https://auth.alice.example/eac2c39c-c8b3-4880-8b9f-a3e12f7f6372'

describe('getters', () => {
  test('should provide dataAuthorizations', async () => {
    const accessAuthorization = await factory.readable.accessAuthorization(snippetIri)
    let count = 0
    for await (const authorization of accessAuthorization.dataAuthorizations) {
      count += 1
      expect(authorization).toBeInstanceOf(ReadableDataAuthorization)
    }
    expect(count).toBe(4)
  })

  test('should provide grantedBy', async () => {
    const accessAuthorization = await factory.readable.accessAuthorization(snippetIri)
    expect(accessAuthorization.grantedBy).toBe('https://alice.example/#id')
  })

  test('should provide grantee', async () => {
    const accessAuthorization = await factory.readable.accessAuthorization(snippetIri)
    expect(accessAuthorization.grantee).toBe('https://projectron.example/#app')
  })
})

describe('generateAccessGrant', () => {
  test('generates access grant for application', async () => {
    const accessAuthorization = await factory.readable.accessAuthorization(snippetIri)
    const registrySetIri = 'https://auth.alice.example/13e60d32-77a6-4239-864d-cfe2c90807c8'
    const registrySet = await factory.crud.registrySet(registrySetIri)
    const agentRegistration = (await registrySet.hasAgentRegistry.findRegistration(
      accessAuthorization.grantee
    )) as CRUDApplicationRegistration
    const accessGrant = await accessAuthorization.generateAccessGrant(
      registrySet.hasDataRegistry,
      registrySet.hasAgentRegistry,
      agentRegistration
    )
    expect(accessGrant).toBeInstanceOf(ImmutableAccessGrant)
  })
  test('uses new data grants if equivalent does not exists', async () => {
    const accessAuthorization = await factory.readable.accessAuthorization(snippetIri)
    const registrySetIri = 'https://auth.alice.example/13e60d32-77a6-4239-864d-cfe2c90807c8'
    const registrySet = await factory.crud.registrySet(registrySetIri)
    const agentRegistration = (await registrySet.hasAgentRegistry.findRegistration(
      accessAuthorization.grantee
    )) as CRUDApplicationRegistration
    // remove all of existing data grants
    // TODO improve snippets for this test
    agentRegistration.accessGrant.hasDataGrant = []
    const accessGrant = await accessAuthorization.generateAccessGrant(
      registrySet.hasDataRegistry,
      registrySet.hasAgentRegistry,
      agentRegistration
    )
    expect(accessGrant).toBeInstanceOf(ImmutableAccessGrant)
    expect(accessGrant.dataGrants).toHaveLength(4)
  })
  test('generates access grant for social agent', async () => {
    const authorizationForSocialAgentIri =
      'https://auth.alice.example/75a2ef88-d4d4-4f05-af1e-c2a63af08cab'
    const accessAuthorization = await factory.readable.accessAuthorization(
      authorizationForSocialAgentIri
    )
    const registrySetIri = 'https://auth.alice.example/13e60d32-77a6-4239-864d-cfe2c90807c8'
    const registrySet = await factory.crud.registrySet(registrySetIri)
    const agentRegistration = (await registrySet.hasAgentRegistry.findRegistration(
      accessAuthorization.grantee
    )) as CRUDSocialAgentRegistration
    const accessGrant = await accessAuthorization.generateAccessGrant(
      registrySet.hasDataRegistry,
      registrySet.hasAgentRegistry,
      agentRegistration
    )
    expect(accessGrant).toBeInstanceOf(ImmutableAccessGrant)
  })
})
