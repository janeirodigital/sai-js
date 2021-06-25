// eslint-disable-next-line import/no-extraneous-dependencies
import 'jest-rdf';
import { INTEROP } from 'interop-namespaces';
// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from 'interop-test-utils';
import { AccessReceipt, DataGrant, DataInstance, InteropFactory } from '../src';

const factory = new InteropFactory(fetch);
const dataGrantIri = 'https://auth.alice.example/3fcef0f6-5807-4f1b-b77a-63d64df25a69#data-grant-project-pro';
const inheritingGrantIri = 'https://auth.alice.example/3fcef0f6-5807-4f1b-b77a-63d64df25a69#data-grant-task-pro';
const accessReceiptIri = 'https://auth.alice.example/dd442d1b-bcc7-40e2-bbb9-4abfa7309fbe';
let accessReceipt: AccessReceipt;

beforeAll(async () => {
  accessReceipt = await factory.accessReceipt(accessReceiptIri);
});

describe('constructor', () => {
  test('should set the iri', () => {
    const dataGrant = new DataGrant(dataGrantIri, factory, accessReceipt);
    expect(dataGrant.iri).toBe(dataGrantIri);
  });

  test('should set the factory', () => {
    const dataGrant = new DataGrant(dataGrantIri, factory, accessReceipt);
    expect(dataGrant.factory).toBe(factory);
  });

  test('should set hasDataRegistrationIri', () => {
    const dataGrant = new DataGrant(dataGrantIri, factory, accessReceipt);
    const dataRegistrationIri = 'https://pro.alice.example/773605f0-b5bf-4d46-878d-5c167eac8b5d';
    expect(dataGrant.hasDataRegistrationIri).toBe(dataRegistrationIri);
  });

  test('should set hasRemoteDataFromAgentIri', () => {
    const allRemoteFromAgentGrantIri =
      'https://auth.alice.example/3fcef0f6-5807-4f1b-b77a-63d64df25a69#data-grant-acme-projects';
    const dataGrant = new DataGrant(allRemoteFromAgentGrantIri, factory, accessReceipt);
    const hasRemoteDataFromAgentIri = 'https://auth.alice.example/3a019d90-c7fb-4e65-865d-4254ef064667';
    expect(dataGrant.hasRemoteDataFromAgentIri).toBe(hasRemoteDataFromAgentIri);
  });

  test('should extract subset of dataset', () => {
    const dataGrant = new DataGrant(dataGrantIri, factory, accessReceipt);
    expect(dataGrant.dataset.size).toBeGreaterThan(0);
    expect(dataGrant.dataset.size).toBeLessThan(accessReceipt.dataset.size);
  });

  test('should set scopeOfGrant', () => {
    const dataGrant = new DataGrant(dataGrantIri, factory, accessReceipt);
    expect(dataGrant.scopeOfGrant).toEqualRdfTerm(INTEROP.AllInstances);
  });

  test('should set registeredShapeTree', () => {
    const dataGrant = new DataGrant(dataGrantIri, factory, accessReceipt);
    const projectShapeTree = 'https://solidshapes.example/trees/Project';
    expect(dataGrant.registeredShapeTree).toBe(projectShapeTree);
  });

  test('should set inheritsFromGrantIri', () => {
    const dataGrant = new DataGrant(inheritingGrantIri, factory, accessReceipt);
    expect(dataGrant.inheritsFromGrantIri).toBe(dataGrantIri);
  });

  test('should set inheritsFromGrantIri undefined if not inheriting', () => {
    const dataGrant = new DataGrant(dataGrantIri, factory, accessReceipt);
    expect(dataGrant.inheritsFromGrantIri).toBeUndefined();
  });

  test('should provide data instance iterator for AllInstances', async () => {
    const dataGrant = new DataGrant(dataGrantIri, factory, accessReceipt);
    for await (const instance of dataGrant.getDataInstanceIterator()) {
      expect(instance).toBeInstanceOf(DataInstance);
    }
  });

  test('should provide data instance iterator for InheritInstances', async () => {
    const inheritingGrant = accessReceipt.hasDataGrant.find((grant) => grant.iri === inheritingGrantIri);
    // console.log(accessReceipt.dataset.size)
    // console.log(accessReceipt.iri)
    let count = 0;
    for await (const instance of inheritingGrant.getDataInstanceIterator()) {
      expect(instance).toBeInstanceOf(DataInstance);
      count += 1;
    }
    expect(count).toBe(3);
  });

  test('should provide data instance iterator for AllRemoteFromAgent', async () => {
    const allRemoteFromAgentGrantIri =
      'https://auth.alice.example/3fcef0f6-5807-4f1b-b77a-63d64df25a69#data-grant-acme-projects';
    const dataGrant = new DataGrant(allRemoteFromAgentGrantIri, factory, accessReceipt);
    let count = 0;
    for await (const instance of dataGrant.getDataInstanceIterator()) {
      expect(instance).toBeInstanceOf(DataInstance);
      count += 1;
    }
    expect(count).toBe(2);
  });
});
