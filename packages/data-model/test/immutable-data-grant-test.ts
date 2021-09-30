// eslint-disable-next-line import/no-extraneous-dependencies
import 'jest-rdf';
// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { INTEROP, ACL } from '@janeirodigital/interop-namespaces';
import { randomUUID } from 'crypto';
import { ImmutableDataGrant, InteropFactory } from '../src';
import { DataFactory } from 'n3';

const factory = new InteropFactory({ fetch, randomUUID });
const snippetIri = 'https://some.iri/';
const commonData = {
  dataOwner: 'https://alice.example/#id',
  registeredShapeTree: 'https://solidshapes.example/tree/Project',
  hasDataRegistration: 'https://pro.alice.example/123',
  accessMode: [ACL.Read.value]
};
const commonQuads = [
  DataFactory.quad(DataFactory.namedNode(snippetIri), INTEROP.dataOwner, DataFactory.namedNode(commonData.dataOwner)),
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
  test('should set dataset for AllInstances scope', async () => {
    const allInstancesData = {
      scopeOfGrant: INTEROP.AllInstances.value,
      ...commonData
    };
    const allInstancesQuads = [
      DataFactory.quad(
        DataFactory.namedNode(snippetIri),
        INTEROP.scopeOfGrant,
        DataFactory.namedNode(INTEROP.AllInstances)
      ),
      ...commonQuads
    ];

    const dataGrant = new ImmutableDataGrant(snippetIri, factory, allInstancesData);
    expect(dataGrant.dataset).toBeRdfDatasetContaining(...allInstancesQuads);
  });

  test('should set dataset for SelectedInstances scope', async () => {
    const selectedInstancesData = {
      scopeOfGrant: INTEROP.SelectedInstances.value,
      hasDataInstance: ['https://some.iri/a', 'https://some.iri/b'],
      ...commonData
    };
    const selectedInstancesQuads = [
      DataFactory.quad(
        DataFactory.namedNode(snippetIri),
        INTEROP.scopeOfGrant,
        DataFactory.namedNode(INTEROP.SelectedInstances)
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

    const dataGrant = new ImmutableDataGrant(snippetIri, factory, selectedInstancesData);
    expect(dataGrant.dataset).toBeRdfDatasetContaining(...selectedInstancesQuads);
  });

  test('should set dataset for InheritInstances scope', async () => {
    const inheritInstancesData = {
      scopeOfGrant: INTEROP.InheritInstances.value,
      inheritsFromGrant: 'https://some.iri/gr',
      ...commonData
    };
    const inheritInstancesQuads = [
      DataFactory.quad(
        DataFactory.namedNode(snippetIri),
        INTEROP.scopeOfGrant,
        DataFactory.namedNode(INTEROP.InheritInstances)
      ),
      DataFactory.quad(
        DataFactory.namedNode(snippetIri),
        INTEROP.inheritsFromGrant,
        DataFactory.namedNode(inheritInstancesData.inheritsFromGrant)
      ),
      ...commonQuads
    ];

    const dataGrant = new ImmutableDataGrant(snippetIri, factory, inheritInstancesData);
    expect(dataGrant.dataset).toBeRdfDatasetContaining(...inheritInstancesQuads);
  });

  test('should set dataset with creatorAccessMode', async () => {
    const allInstancesData = {
      scopeOfGrant: INTEROP.AllInstances.value,
      creatorAccessMode: [ACL.Update.value],
      ...commonData
    };
    const allInstancesQuads = [
      DataFactory.quad(
        DataFactory.namedNode(snippetIri),
        INTEROP.scopeOfGrant,
        DataFactory.namedNode(INTEROP.AllInstances)
      ),
      DataFactory.quad(
        DataFactory.namedNode(snippetIri),
        INTEROP.creatorAccessMode,
        DataFactory.namedNode(ACL.Update.value)
      ),
      ...commonQuads
    ];

    const dataGrant = new ImmutableDataGrant(snippetIri, factory, allInstancesData);
    expect(dataGrant.dataset).toBeRdfDatasetContaining(...allInstancesQuads);
  });
});
