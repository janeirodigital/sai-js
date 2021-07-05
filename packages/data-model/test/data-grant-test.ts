// eslint-disable-next-line import/no-extraneous-dependencies
import 'jest-rdf';
import { INTEROP } from 'interop-namespaces';
// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from 'interop-test-utils';
import { AccessReceipt, DataGrant, DataInstance, InteropFactory } from '../src';

const factory = new InteropFactory(fetch);
const dataGrantIri = 'https://auth.alice.example/3fcef0f6-5807-4f1b-b77a-63d64df25a69#data-grant-project-pro';
const allInstancesDataGrantIri =
  'https://auth.alice.example/3fcef0f6-5807-4f1b-b77a-63d64df25a69#data-grant-project-home';
const allRemoteFromAgentGrantIri =
  'https://auth.alice.example/3fcef0f6-5807-4f1b-b77a-63d64df25a69#data-grant-acme-projects';
const selectedRemoteDataGrantIri =
  'https://auth.alice.example/3fcef0f6-5807-4f1b-b77a-63d64df25a69#data-grant-omni-projects';
const inheritingGrantIri = 'https://auth.alice.example/3fcef0f6-5807-4f1b-b77a-63d64df25a69#data-grant-task-pro';
const inheritingGrantOfAllInstancesIri =
  'https://auth.alice.example/3fcef0f6-5807-4f1b-b77a-63d64df25a69#data-grant-task-home';
const accessReceiptIri = 'https://auth.alice.example/dd442d1b-bcc7-40e2-bbb9-4abfa7309fbe';
const allRemoteDataGrantIri = 'https://auth.alice.example/6b1b6e39-75e4-44f8-84f3-104b1a8210ad#data-grant-projects';
const allRemoteAccessReceiptIri = 'https://auth.alice.example/7b513402-d2a2-455f-a6d1-4a54ef90cb78';
let accessReceipt: AccessReceipt;
let allRemoteAccessReceipt: AccessReceipt;

beforeAll(async () => {
  accessReceipt = await factory.accessReceipt(accessReceiptIri);
  allRemoteAccessReceipt = await factory.accessReceipt(allRemoteAccessReceiptIri);
});

describe('constructor', () => {
  test('should set the iri', async () => {
    const dataGrant = await factory.dataGrant(dataGrantIri, accessReceipt);
    // const dataGrant = new DataGrant(dataGrantIri, factory, accessReceipt);
    expect(dataGrant.iri).toBe(dataGrantIri);
  });

  test('should set the factory', async () => {
    const dataGrant = await factory.dataGrant(dataGrantIri, accessReceipt);
    expect(dataGrant.factory).toBe(factory);
  });

  test('should set hasDataRegistrationIri', async () => {
    const dataGrant = await factory.dataGrant(dataGrantIri, accessReceipt);
    const dataRegistrationIri = 'https://pro.alice.example/773605f0-b5bf-4d46-878d-5c167eac8b5d';
    expect(dataGrant.hasDataRegistrationIri).toBe(dataRegistrationIri);
  });

  // scope: SelectedInstances
  test('should set hasDataInstance', async () => {
    const dataGrant = await factory.dataGrant(dataGrantIri, accessReceipt);
    expect(dataGrant.hasDataInstance.length).toBe(1);
  });

  // scope: SelectedRemote
  test('should set hasDataGrant', async () => {
    const dataGrant = await factory.dataGrant(selectedRemoteDataGrantIri, accessReceipt);
    expect(dataGrant.hasDataGrant.length).toBe(1);
  });

  // scope: AllRemoteFromAgent
  test('should set hasRemoteDataFromAgentIri', async () => {
    const dataGrant = await factory.dataGrant(allRemoteFromAgentGrantIri, accessReceipt);
    const hasRemoteDataFromAgentIri = 'https://auth.alice.example/3a019d90-c7fb-4e65-865d-4254ef064667';
    expect(dataGrant.hasRemoteDataFromAgentIri).toBe(hasRemoteDataFromAgentIri);
  });

  // scope: AllRemote
  test('should set hasRemoteDataRegistrationIri', async () => {
    const dataGrant = await factory.dataGrant(allRemoteDataGrantIri, allRemoteAccessReceipt);
    const remoteDataRegistrationIri = 'https://auth.alice.example/33caf7be-f804-4155-a57a-92216c577bd4';
    expect(dataGrant.hasRemoteDataRegistrationIri).toBe(remoteDataRegistrationIri);
  });

  test('should extract subset of dataset', async () => {
    const dataGrant = await factory.dataGrant(dataGrantIri, accessReceipt);
    expect(dataGrant.dataset.size).toBeGreaterThan(0);
    expect(dataGrant.dataset.size).toBeLessThan(accessReceipt.dataset.size);
  });

  test('should set scopeOfGrant', async () => {
    const dataGrant = await factory.dataGrant(dataGrantIri, accessReceipt);
    expect(dataGrant.scopeOfGrant).toEqualRdfTerm(INTEROP.SelectedInstances);
  });

  test('should set registeredShapeTree', async () => {
    const dataGrant = await factory.dataGrant(dataGrantIri, accessReceipt);
    const projectShapeTree = 'https://solidshapes.example/trees/Project';
    expect(dataGrant.registeredShapeTree).toBe(projectShapeTree);
  });

  test('should set inheritsFromGrantIri', async () => {
    const dataGrant = await factory.dataGrant(inheritingGrantIri, accessReceipt);
    expect(dataGrant.inheritsFromGrantIri).toBe(dataGrantIri);
  });

  test('should set inheritsFromGrantIri undefined if not inheriting', async () => {
    const dataGrant = await factory.dataGrant(dataGrantIri, accessReceipt);
    expect(dataGrant.inheritsFromGrantIri).toBeUndefined();
  });

  test('should provide data instance iterator for AllInstances', async () => {
    const dataGrant = await factory.dataGrant(allInstancesDataGrantIri, accessReceipt);
    for await (const instance of dataGrant.getDataInstanceIterator()) {
      expect(instance).toBeInstanceOf(DataInstance);
    }
  });

  test('should provide data instance iterator for SelectedInstances', async () => {
    const dataGrant = await factory.dataGrant(dataGrantIri, accessReceipt);
    for await (const instance of dataGrant.getDataInstanceIterator()) {
      expect(instance).toBeInstanceOf(DataInstance);
    }
  });

  test('should provide data instance iterator for InheritInstances of AllInstances', async () => {
    const inheritingGrant = accessReceipt.hasDataGrant.find((grant) => grant.iri === inheritingGrantOfAllInstancesIri);
    let count = 0;
    for await (const instance of inheritingGrant.getDataInstanceIterator()) {
      expect(instance).toBeInstanceOf(DataInstance);
      count += 1;
    }
    expect(count).toBe(2);
  });

  test('should provide data instance iterator for InheritInstances of SelectedInstances', async () => {
    const inheritingGrant = accessReceipt.hasDataGrant.find((grant) => grant.iri === inheritingGrantIri);
    let count = 0;
    for await (const instance of inheritingGrant.getDataInstanceIterator()) {
      expect(instance).toBeInstanceOf(DataInstance);
      count += 1;
    }
    expect(count).toBe(1);
  });

  test('should provide data instance iterator for AllRemoteFromAgent', async () => {
    const dataGrant = await factory.dataGrant(allRemoteFromAgentGrantIri, accessReceipt);
    let count = 0;
    for await (const instance of dataGrant.getDataInstanceIterator()) {
      expect(instance).toBeInstanceOf(DataInstance);
      count += 1;
    }
    expect(count).toBe(4);
  });

  test('should provide data instance iterator for SelectedRemote', async () => {
    const dataGrant = await factory.dataGrant(selectedRemoteDataGrantIri, accessReceipt);
    let count = 0;
    for await (const instance of dataGrant.getDataInstanceIterator()) {
      expect(instance).toBeInstanceOf(DataInstance);
      count += 1;
    }
    expect(count).toBe(1);
  });

  test('should provide data instance iterator for AllRemote', async () => {
    const dataGrant = await factory.dataGrant(allRemoteDataGrantIri, allRemoteAccessReceipt);
    let count = 0;
    for await (const instance of dataGrant.getDataInstanceIterator()) {
      expect(instance).toBeInstanceOf(DataInstance);
      count += 1;
    }
    expect(count).toBe(5);
  });
});
