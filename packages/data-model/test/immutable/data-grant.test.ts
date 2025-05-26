import { randomUUID } from 'node:crypto'
import { fetch } from '@janeirodigital/interop-test-utils'
import { ACL, INTEROP } from '@janeirodigital/interop-utils'
import { DataFactory } from 'n3'
import { describe, test } from 'vitest'
import { AuthorizationAgentFactory, ImmutableDataGrant } from '../../src'
import { expect } from '../expect'

const webId = 'https://alice.example/#id'
const agentId = 'https://jarvis.alice.example/#agent'
const factory = new AuthorizationAgentFactory(webId, agentId, { fetch, randomUUID })
const snippetIri = 'https://some.iri/'
const commonData = {
  dataOwner: 'https://alice.example/#id',
  registeredShapeTree: 'https://solidshapes.example/tree/Project',
  hasDataRegistration: 'https://pro.alice.example/123',
  accessMode: [ACL.Read.value],
}
const commonQuads = [
  DataFactory.quad(
    DataFactory.namedNode(snippetIri),
    INTEROP.dataOwner,
    DataFactory.namedNode(commonData.dataOwner)
  ),
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
  DataFactory.quad(
    DataFactory.namedNode(snippetIri),
    INTEROP.accessMode,
    DataFactory.namedNode(ACL.Read.value)
  ),
]

describe('constructor', () => {
  test('should set dataset for AllFromRegistry scope', async () => {
    const allFromRegistryData = {
      scopeOfGrant: INTEROP.AllFromRegistry.value,
      ...commonData,
    }
    const allFromRegistryQuads = [
      DataFactory.quad(
        DataFactory.namedNode(snippetIri),
        INTEROP.scopeOfGrant,
        INTEROP.AllFromRegistry
      ),
      ...commonQuads,
    ]

    const dataGrant = new ImmutableDataGrant(snippetIri, factory, allFromRegistryData)
    expect(dataGrant.dataset).toBeRdfDatasetContaining(...allFromRegistryQuads)
  })

  test('should set dataset for SelectedFromRegistry scope', async () => {
    const selectedFromRegistryData = {
      scopeOfGrant: INTEROP.SelectedFromRegistry.value,
      hasDataInstance: ['https://some.iri/a', 'https://some.iri/b'],
      ...commonData,
    }
    const selectedFromRegistryQuads = [
      DataFactory.quad(
        DataFactory.namedNode(snippetIri),
        INTEROP.scopeOfGrant,
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

    const dataGrant = new ImmutableDataGrant(snippetIri, factory, selectedFromRegistryData)
    expect(dataGrant.dataset).toBeRdfDatasetContaining(...selectedFromRegistryQuads)
  })

  test('should set dataset for Inherited scope', async () => {
    const inheritedData = {
      scopeOfGrant: INTEROP.Inherited.value,
      inheritsFromGrant: 'https://some.iri/gr',
      ...commonData,
    }
    const inheritedQuads = [
      DataFactory.quad(DataFactory.namedNode(snippetIri), INTEROP.scopeOfGrant, INTEROP.Inherited),
      DataFactory.quad(
        DataFactory.namedNode(snippetIri),
        INTEROP.inheritsFromGrant,
        DataFactory.namedNode(inheritedData.inheritsFromGrant)
      ),
      ...commonQuads,
    ]

    const dataGrant = new ImmutableDataGrant(snippetIri, factory, inheritedData)
    expect(dataGrant.dataset).toBeRdfDatasetContaining(...inheritedQuads)
  })

  test('should set dataset with creatorAccessMode', async () => {
    const allFromRegistryData = {
      scopeOfGrant: INTEROP.AllFromRegistry.value,
      creatorAccessMode: [ACL.Update.value],
      ...commonData,
    }
    const allFromRegistryQuads = [
      DataFactory.quad(
        DataFactory.namedNode(snippetIri),
        INTEROP.scopeOfGrant,
        INTEROP.AllFromRegistry
      ),
      DataFactory.quad(DataFactory.namedNode(snippetIri), INTEROP.creatorAccessMode, ACL.Update),
      ...commonQuads,
    ]

    const dataGrant = new ImmutableDataGrant(snippetIri, factory, allFromRegistryData)
    expect(dataGrant.dataset).toBeRdfDatasetContaining(...allFromRegistryQuads)
  })
})
