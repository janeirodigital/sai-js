import { DataFactory } from 'n3';
// eslint-disable-next-line import/no-extraneous-dependencies
import 'jest-rdf';
// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { INTEROP, ACL } from '@janeirodigital/interop-namespaces';
import { randomUUID } from 'crypto';
import { ImmutableDataConsent, AuthorizationAgentFactory } from '../../src';

const webId = 'https://alice.example/#id';
const agentId = 'https://jarvis.alice.example/#agent';
const factory = new AuthorizationAgentFactory(webId, agentId, { fetch, randomUUID });
const snippetIri = 'https://some.iri/';
const commonData = {
  grantee: 'https://projectron.example/#app',
  registeredShapeTree: 'https://solidshapes.example/tree/Project',
  hasDataRegistration: 'https://pro.alice.example/123',
  accessMode: [ACL.Read.value]
};
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
  DataFactory.quad(DataFactory.namedNode(snippetIri), INTEROP.accessMode, DataFactory.namedNode(ACL.Read.value))
];

describe('constructor', () => {
  test('should set dataset for AllFromRegistry scope', async () => {
    const allFromRegistryData = {
      dataOwner: 'https://alice.example/#id',
      scopeOfConsent: INTEROP.AllFromRegistry.value,
      ...commonData
    };
    const allFromRegistryQuads = [
      DataFactory.quad(
        DataFactory.namedNode(snippetIri),
        INTEROP.dataOwner,
        DataFactory.namedNode(allFromRegistryData.dataOwner)
      ),
      DataFactory.quad(
        DataFactory.namedNode(snippetIri),
        INTEROP.scopeOfConsent,
        DataFactory.namedNode(INTEROP.AllFromRegistry)
      ),
      ...commonQuads
    ];

    const dataConsent = new ImmutableDataConsent(snippetIri, factory, allFromRegistryData);
    expect(dataConsent.dataset).toBeRdfDatasetContaining(...allFromRegistryQuads);
  });

  test('should set dataset for SelectedFromRegistry scope', async () => {
    const selectedFromRegistryData = {
      dataOwner: 'https://alice.example/#id',
      scopeOfConsent: INTEROP.SelectedFromRegistry.value,
      hasDataInstance: ['https://some.iri/a', 'https://some.iri/b'],
      ...commonData
    };
    const selectedFromRegistryQuads = [
      DataFactory.quad(
        DataFactory.namedNode(snippetIri),
        INTEROP.dataOwner,
        DataFactory.namedNode(selectedFromRegistryData.dataOwner)
      ),
      DataFactory.quad(
        DataFactory.namedNode(snippetIri),
        INTEROP.scopeOfConsent,
        DataFactory.namedNode(INTEROP.SelectedFromRegistry)
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
      ...commonQuads
    ];

    const dataConsent = new ImmutableDataConsent(snippetIri, factory, selectedFromRegistryData);
    expect(dataConsent.dataset).toBeRdfDatasetContaining(...selectedFromRegistryQuads);
  });

  test('should set dataset for Inherited scope', async () => {
    const inheritedData = {
      dataOwner: 'https://alice.example/#id',
      scopeOfConsent: INTEROP.Inherited.value,
      inheritsFromConsent: 'https://some.iri/gr',
      ...commonData
    };
    const inheritedQuads = [
      DataFactory.quad(
        DataFactory.namedNode(snippetIri),
        INTEROP.dataOwner,
        DataFactory.namedNode(inheritedData.dataOwner)
      ),
      DataFactory.quad(
        DataFactory.namedNode(snippetIri),
        INTEROP.scopeOfConsent,
        DataFactory.namedNode(INTEROP.Inherited)
      ),
      DataFactory.quad(
        DataFactory.namedNode(snippetIri),
        INTEROP.inheritsFromConsent,
        DataFactory.namedNode(inheritedData.inheritsFromConsent)
      ),
      ...commonQuads
    ];

    const dataConsent = new ImmutableDataConsent(snippetIri, factory, inheritedData);
    expect(dataConsent.dataset).toBeRdfDatasetContaining(...inheritedQuads);
  });

  test('should set dataset with creatorAccessMode', async () => {
    const allFromRegistryData = {
      dataOwner: 'https://alice.example/#id',
      scopeOfConsent: INTEROP.AllFromRegistry.value,
      creatorAccessMode: [ACL.Update.value],
      ...commonData
    };
    const allFromRegistryQuads = [
      DataFactory.quad(
        DataFactory.namedNode(snippetIri),
        INTEROP.dataOwner,
        DataFactory.namedNode(allFromRegistryData.dataOwner)
      ),
      DataFactory.quad(
        DataFactory.namedNode(snippetIri),
        INTEROP.scopeOfConsent,
        DataFactory.namedNode(INTEROP.AllFromRegistry)
      ),
      DataFactory.quad(
        DataFactory.namedNode(snippetIri),
        INTEROP.creatorAccessMode,
        DataFactory.namedNode(ACL.Update.value)
      ),
      ...commonQuads
    ];

    const dataConsent = new ImmutableDataConsent(snippetIri, factory, allFromRegistryData);
    expect(dataConsent.dataset).toBeRdfDatasetContaining(...allFromRegistryQuads);
  });
});
