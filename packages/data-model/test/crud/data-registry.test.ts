import { randomUUID } from 'node:crypto'
import { fetch } from '@janeirodigital/interop-test-utils'
import { INTEROP } from '@janeirodigital/interop-utils'
import { DataFactory } from 'n3'
import { describe, test, vi } from 'vitest'
import {
  AuthorizationAgentFactory,
  CRUDDataRegistration,
  ReadableDataRegistration,
} from '../../src'
import { expect } from '../expect'

const webId = 'https://alice.example/#id'
const agentId = 'https://jarvis.alice.example/#agent'
const factory = new AuthorizationAgentFactory(webId, agentId, { fetch, randomUUID })
const snippetIri = 'https://home.alice.example/2d3d97b4-a26d-434e-afa2-e3bc8e8e2b56/'

test('hasDataRegistration', async () => {
  const dataRegistry = await factory.crud.dataRegistry(snippetIri)
  expect(dataRegistry.hasDataRegistration).toHaveLength(2)
})

test('registrations', async () => {
  const dataRegistry = await factory.crud.dataRegistry(snippetIri)
  let count = 0
  for await (const registration of dataRegistry.registrations) {
    expect(registration).toBeInstanceOf(ReadableDataRegistration)
    count += 1
  }
  expect(count).toBe(2)
})

describe('createRegistration', () => {
  const projectShapeTree = 'https://solidshapes.example/trees/Project'

  test('should throw if registration for given shape tree exists', async () => {
    const dataRegistry = await factory.crud.dataRegistry(snippetIri)
    await expect(dataRegistry.createRegistration(projectShapeTree)).rejects.toThrow(
      'registration already exists'
    )
  })

  test('should return created data registration', async () => {
    const otherShapeTree = 'https://solidshapes.example/tree/Other'
    const dataRegistry = await factory.crud.dataRegistry(snippetIri)
    const registration = await dataRegistry.createRegistration(otherShapeTree)
    expect(registration).toBeInstanceOf(CRUDDataRegistration)
  })

  test('should create data registration', async () => {
    const localFactory = new AuthorizationAgentFactory(webId, agentId, { fetch, randomUUID })
    const createMock = vi.fn()
    localFactory.crud.dataRegistration = vi.fn(
      () => ({ create: createMock }) as unknown as Promise<CRUDDataRegistration>
    )

    const otherShapeTree = 'https://solidshapes.example/tree/Other'
    const dataRegistry = await localFactory.crud.dataRegistry(snippetIri)
    await dataRegistry.createRegistration(otherShapeTree)

    expect(createMock).toBeCalled()
  })

  test('should link to new data registration and update itself', async () => {
    const otherShapeTree = 'https://solidshapes.example/tree/Other'
    const dataRegistry = await factory.crud.dataRegistry(snippetIri)
    const dataRegistryUpdateSpy = vi.spyOn(dataRegistry, 'addStatement')
    const registration = await dataRegistry.createRegistration(otherShapeTree)
    const expectedQuads = [
      DataFactory.quad(
        DataFactory.namedNode(snippetIri),
        INTEROP.hasDataRegistration,
        DataFactory.namedNode(registration.iri)
      ),
    ]
    expect(dataRegistry.dataset).toBeRdfDatasetContaining(...expectedQuads)
    expect(dataRegistryUpdateSpy).toBeCalled()
  })
})
