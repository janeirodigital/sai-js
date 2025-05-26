import { randomUUID } from 'node:crypto'
import { fetch } from '@janeirodigital/interop-test-utils'
import { ACL, INTEROP } from '@janeirodigital/interop-utils'
import { DataFactory } from 'n3'
import { describe, test } from 'vitest'
import { AuthorizationAgentFactory, ImmutableDataAuthorization } from '../../src'
import { expect } from '../expect'

const webId = 'https://alice.example/#id'
const agentId = 'https://jarvis.alice.example/#agent'
const factory = new AuthorizationAgentFactory(webId, agentId, { fetch, randomUUID })
const snippetIri = 'https://some.iri/'
const commonData = {
  grantee: 'https://projectron.example/#app',
  grantedBy: webId,
  registeredShapeTree: 'https://solidshapes.example/tree/Project',
  hasDataRegistration: 'https://pro.alice.example/123',
  accessMode: [ACL.Read.value],
}
const commonQuads = [
  DataFactory.quad(
    DataFactory.namedNode(snippetIri),
    INTEROP.registeredShapeTree,
    DataFactory.namedNode(commonData.registeredShapeTree)
  ),
  DataFactory.quad(
    DataFactory.namedNode(snippetIri),
    INTEROP.hasDataRegistration,
    DataFactory.namedNode(commonData.hasDataRegistration)
  ),
  DataFactory.quad(DataFactory.namedNode(snippetIri), INTEROP.accessMode, ACL.Read),
]

describe('constructor', () => {
  test('should set dataset for AllFromRegistry scope', async () => {
    const allFromRegistryData = {
      dataOwner: 'https://alice.example/#id',
      scopeOfAuthorization: INTEROP.AllFromRegistry.value,
      ...commonData,
    }
    const allFromRegistryQuads = [
      DataFactory.quad(
        DataFactory.namedNode(snippetIri),
        INTEROP.dataOwner,
        DataFactory.namedNode(allFromRegistryData.dataOwner)
      ),
      DataFactory.quad(
        DataFactory.namedNode(snippetIri),
        INTEROP.scopeOfAuthorization,
        INTEROP.AllFromRegistry
      ),
      ...commonQuads,
    ]

    const dataAuthorization = new ImmutableDataAuthorization(
      snippetIri,
      factory,
      allFromRegistryData
    )
    expect(dataAuthorization.dataset).toBeRdfDatasetContaining(...allFromRegistryQuads)
  })

  test('should set dataset for SelectedFromRegistry scope', async () => {
    const selectedFromRegistryData = {
      dataOwner: 'https://alice.example/#id',
      scopeOfAuthorization: INTEROP.SelectedFromRegistry.value,
      hasDataInstance: ['https://some.iri/a', 'https://some.iri/b'],
      ...commonData,
    }
    const selectedFromRegistryQuads = [
      DataFactory.quad(
        DataFactory.namedNode(snippetIri),
        INTEROP.dataOwner,
        DataFactory.namedNode(selectedFromRegistryData.dataOwner)
      ),
      DataFactory.quad(
        DataFactory.namedNode(snippetIri),
        INTEROP.scopeOfAuthorization,
        INTEROP.SelectedFromRegistry
      ),
      DataFactory.quad(
        DataFactory.namedNode(snippetIri),
        INTEROP.hasDataInstance,
        DataFactory.namedNode('https://some.iri/a')
      ),
      DataFactory.quad(
        DataFactory.namedNode(snippetIri),
        INTEROP.hasDataInstance,
        DataFactory.namedNode('https://some.iri/b')
      ),
      ...commonQuads,
    ]

    const dataAuthorization = new ImmutableDataAuthorization(
      snippetIri,
      factory,
      selectedFromRegistryData
    )
    expect(dataAuthorization.dataset).toBeRdfDatasetContaining(...selectedFromRegistryQuads)
  })

  test('should set dataset for Inherited scope', async () => {
    const inheritedData = {
      dataOwner: 'https://alice.example/#id',
      scopeOfAuthorization: INTEROP.Inherited.value,
      inheritsFromAuthorization: 'https://some.iri/gr',
      ...commonData,
    }
    const inheritedQuads = [
      DataFactory.quad(
        DataFactory.namedNode(snippetIri),
        INTEROP.dataOwner,
        DataFactory.namedNode(inheritedData.dataOwner)
      ),
      DataFactory.quad(
        DataFactory.namedNode(snippetIri),
        INTEROP.scopeOfAuthorization,
        INTEROP.Inherited
      ),
      DataFactory.quad(
        DataFactory.namedNode(snippetIri),
        INTEROP.inheritsFromAuthorization,
        DataFactory.namedNode(inheritedData.inheritsFromAuthorization)
      ),
      ...commonQuads,
    ]

    const dataAuthorization = new ImmutableDataAuthorization(snippetIri, factory, inheritedData)
    expect(dataAuthorization.dataset).toBeRdfDatasetContaining(...inheritedQuads)
  })

  test('should set dataset with creatorAccessMode', async () => {
    const allFromRegistryData = {
      dataOwner: 'https://alice.example/#id',
      scopeOfAuthorization: INTEROP.AllFromRegistry.value,
      creatorAccessMode: [ACL.Update.value],
      ...commonData,
    }
    const allFromRegistryQuads = [
      DataFactory.quad(
        DataFactory.namedNode(snippetIri),
        INTEROP.dataOwner,
        DataFactory.namedNode(allFromRegistryData.dataOwner)
      ),
      DataFactory.quad(
        DataFactory.namedNode(snippetIri),
        INTEROP.scopeOfAuthorization,
        INTEROP.AllFromRegistry
      ),
      DataFactory.quad(
        DataFactory.namedNode(snippetIri),
        INTEROP.creatorAccessMode,
        ACL.Update.value
      ),
      ...commonQuads,
    ]

    const dataAuthorization = new ImmutableDataAuthorization(
      snippetIri,
      factory,
      allFromRegistryData
    )
    expect(dataAuthorization.dataset).toBeRdfDatasetContaining(...allFromRegistryQuads)
  })

  test('links back to children', async () => {
    const childIri = 'https://some.iri/child'

    const inheritedData = {
      dataOwner: 'https://alice.example/#id',
      scopeOfAuthorization: INTEROP.Inherited.value,
      inheritsFromAuthorization: snippetIri,
      ...commonData,
    }

    const childDataAuthorization = new ImmutableDataAuthorization(childIri, factory, inheritedData)

    const allFromRegistryData = {
      dataOwner: 'https://alice.example/#id',
      scopeOfAuthorization: INTEROP.AllFromRegistry.value,
      hasInheritingAuthorization: [childDataAuthorization.iri],
      ...commonData,
    }

    const dataAuthorization = new ImmutableDataAuthorization(
      snippetIri,
      factory,
      allFromRegistryData
    )

    const linkBackQuad = DataFactory.quad(
      DataFactory.namedNode(childIri),
      INTEROP.inheritsFromAuthorization,
      DataFactory.namedNode(snippetIri)
    )
    expect(dataAuthorization.dataset).toBeRdfDatasetContaining(linkBackQuad)
  })
})
