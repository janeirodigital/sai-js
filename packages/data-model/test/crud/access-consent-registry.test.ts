import { randomUUID } from 'node:crypto'
import { fetch } from '@janeirodigital/interop-test-utils'
import { INTEROP } from '@janeirodigital/interop-utils'
import { DataFactory } from 'n3'
import { beforeEach, describe, test, vi } from 'vitest'
import {
  AuthorizationAgentFactory,
  type CRUDAuthorizationRegistry,
  ReadableAccessAuthorization,
} from '../../src'
import { expect } from '../expect'

const webId = 'https://alice.example/#id'
const agentId = 'https://jarvis.alice.example/#agent'
const factory = new AuthorizationAgentFactory(webId, agentId, { fetch, randomUUID })
const snippetIri = 'https://auth.alice.example/96feb105-063e-4996-ab74-5e504c6ceae5'

test('should provide accessAuthorizations', async () => {
  const registry = await factory.crud.authorizationRegistry(snippetIri)
  let count = 0
  for await (const authorization of registry.accessAuthorizations) {
    count += 1
    expect(authorization).toBeInstanceOf(ReadableAccessAuthorization)
  }
  expect(count).toBe(2)
})

test('should provide iriForContained method', async () => {
  const registry = await factory.crud.authorizationRegistry(snippetIri)
  expect(registry.iriForContained()).toMatch(registry.iri)
})

describe('add', () => {
  let registry: CRUDAuthorizationRegistry
  let authorization: ReadableAccessAuthorization

  beforeEach(async () => {
    registry = await factory.crud.authorizationRegistry(snippetIri)
    authorization = {
      iri: registry.iriForContained(),
      grantee: 'https://someone.example/#id',
    } as unknown as ReadableAccessAuthorization
  })

  test('should add new quad linking to added authorization', async () => {
    const quads = [
      DataFactory.quad(
        DataFactory.namedNode(registry.iri),
        INTEROP.hasAccessAuthorization,
        DataFactory.namedNode(authorization.iri)
      ),
    ]
    expect(registry.dataset).not.toBeRdfDatasetContaining(...quads)
    await registry.add(authorization)
    expect(registry.dataset).toBeRdfDatasetContaining(...quads)
  })

  test('should update statement if prior existed', async () => {
    authorization = {
      iri: registry.iriForContained(),
      grantee: 'https://projectron.example/#app',
    } as unknown as ReadableAccessAuthorization
    const accessRegistrySpy = vi.spyOn(registry, 'replaceStatement')
    await registry.add(authorization)
    expect(accessRegistrySpy).toBeCalled()
  })

  // TODO: move to container test
  test('should remove link to prior authorization for that agent if exists', async () => {
    authorization = {
      iri: registry.iriForContained(),
      grantee: 'https://projectron.example/#app',
    } as unknown as ReadableAccessAuthorization
    const projectronAuthorizationIri =
      'https://auth.alice.example/eac2c39c-c8b3-4880-8b9f-a3e12f7f6372'
    const priorQuads = [
      registry.getQuad(
        DataFactory.namedNode(registry.iri),
        INTEROP.hasAccessAuthorization,
        DataFactory.namedNode(projectronAuthorizationIri)
      ),
    ]
    expect(registry.dataset).toBeRdfDatasetContaining(...priorQuads)
    await registry.add(authorization)
    expect(registry.dataset).not.toBeRdfDatasetContaining(...priorQuads)
  })

  test('should add statement if no prior existed', async () => {
    const accessRegistrySpy = vi.spyOn(registry, 'addStatement')
    await registry.add(authorization)
    expect(accessRegistrySpy).toBeCalled()
  })

  test('should not remove authorizations for other agents', async () => {
    const numberOfAuthorizationsBefore = registry.getQuadArray(
      null,
      INTEROP.hasAccessAuthorization
    ).length
    await registry.add(authorization)
    const numberOfAuthorizationsAfter = registry.getQuadArray(
      null,
      INTEROP.hasAccessAuthorization
    ).length
    expect(numberOfAuthorizationsAfter).toBe(numberOfAuthorizationsBefore + 1)
  })
})

describe('findAuthorization', () => {
  test('should return access authorization if exists', async () => {
    const registry = await factory.crud.authorizationRegistry(snippetIri)
    const agentIri = 'https://projectron.example/#app'
    const authorization = await registry.findAuthorization(agentIri)
    expect(authorization).toBeInstanceOf(ReadableAccessAuthorization)
  })

  test('should return undefined if access authorization does not exist', async () => {
    const registry = await factory.crud.authorizationRegistry(snippetIri)
    const agentIri = 'https://non-existing.example/#oops'
    const authorization = await registry.findAuthorization(agentIri)
    expect(authorization).toBeUndefined()
  })
})

describe('findAuthorizationsDelegatingFromOwner', () => {
  test('should find all authorizations delegating from given data owner', async () => {
    const registry = await factory.crud.authorizationRegistry(snippetIri)
    const ownerIri = 'https://acme.example/#corp'
    const authorizations = await registry.findAuthorizationsDelegatingFromOwner(ownerIri)
    expect(authorizations).toHaveLength(1)
  })
})
