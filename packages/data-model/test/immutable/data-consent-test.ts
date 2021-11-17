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
  registeredAgent: 'https://projectron.example/#app',
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
  test.todo('should set dataset for All scope');
  test.todo('should set dataset for AllFromAgent scope');

  test('should set dataset for AllFromRegistry scope', async () => {
    const allInstancesData = {
      dataOwner: 'https://alice.example/#id',
      scopeOfConsent: INTEROP.AllFromRegistry.value,
      ...commonData
    };
    const allInstancesQuads = [
      DataFactory.quad(
        DataFactory.namedNode(snippetIri),
        INTEROP.dataOwner,
        DataFactory.namedNode(allInstancesData.dataOwner)
      ),
      DataFactory.quad(
        DataFactory.namedNode(snippetIri),
        INTEROP.scopeOfConsent,
        DataFactory.namedNode(INTEROP.AllFromRegistry)
      ),
      ...commonQuads
    ];

    const dataConsent = new ImmutableDataConsent(snippetIri, factory, allInstancesData);
    expect(dataConsent.dataset).toBeRdfDatasetContaining(...allInstancesQuads);
  });

  test('should set dataset for SelectedFromRegistry scope', async () => {
    const selectedInstancesData = {
      dataOwner: 'https://alice.example/#id',
      scopeOfConsent: INTEROP.SelectedFromRegistry.value,
      hasDataInstance: ['https://some.iri/a', 'https://some.iri/b'],
      ...commonData
    };
    const selectedInstancesQuads = [
      DataFactory.quad(
        DataFactory.namedNode(snippetIri),
        INTEROP.dataOwner,
        DataFactory.namedNode(selectedInstancesData.dataOwner)
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

    const dataConsent = new ImmutableDataConsent(snippetIri, factory, selectedInstancesData);
    expect(dataConsent.dataset).toBeRdfDatasetContaining(...selectedInstancesQuads);
  });

  test('should set dataset for InheritInstances scope', async () => {
    const inheritInstancesData = {
      dataOwner: 'https://alice.example/#id',
      scopeOfConsent: INTEROP.Inherited.value,
      inheritsFromConsent: 'https://some.iri/gr',
      ...commonData
    };
    const inheritInstancesQuads = [
      DataFactory.quad(
        DataFactory.namedNode(snippetIri),
        INTEROP.dataOwner,
        DataFactory.namedNode(inheritInstancesData.dataOwner)
      ),
      DataFactory.quad(
        DataFactory.namedNode(snippetIri),
        INTEROP.scopeOfConsent,
        DataFactory.namedNode(INTEROP.Inherited)
      ),
      DataFactory.quad(
        DataFactory.namedNode(snippetIri),
        INTEROP.inheritsFromConsent,
        DataFactory.namedNode(inheritInstancesData.inheritsFromConsent)
      ),
      ...commonQuads
    ];

    const dataConsent = new ImmutableDataConsent(snippetIri, factory, inheritInstancesData);
    expect(dataConsent.dataset).toBeRdfDatasetContaining(...inheritInstancesQuads);
  });

  test('should set dataset with creatorAccessMode', async () => {
    const allInstancesData = {
      dataOwner: 'https://alice.example/#id',
      scopeOfConsent: INTEROP.AllFromRegistry.value,
      creatorAccessMode: [ACL.Update.value],
      ...commonData
    };
    const allInstancesQuads = [
      DataFactory.quad(
        DataFactory.namedNode(snippetIri),
        INTEROP.dataOwner,
        DataFactory.namedNode(allInstancesData.dataOwner)
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

    const dataConsent = new ImmutableDataConsent(snippetIri, factory, allInstancesData);
    expect(dataConsent.dataset).toBeRdfDatasetContaining(...allInstancesQuads);
  });
});
