// eslint-disable-next-line import/no-extraneous-dependencies
import 'jest-rdf';
// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from 'interop-test-utils';
import { AccessReceipt, DataInstance, InteropFactory, InheritInstancesDataGrant, DataGrant } from '../src';
import { INTEROP } from 'interop-namespaces';

const factory = new InteropFactory(fetch);
const selectedInstancesDataGrantIri =
  'https://auth.alice.example/3fcef0f6-5807-4f1b-b77a-63d64df25a69#data-grant-project-pro';
const allInstancesDataGrantIri =
  'https://auth.alice.example/3fcef0f6-5807-4f1b-b77a-63d64df25a69#data-grant-project-home';
const allRemoteFromAgentGrantIri =
  'https://auth.alice.example/3fcef0f6-5807-4f1b-b77a-63d64df25a69#data-grant-acme-projects';
const selectedRemoteDataGrantIri =
  'https://auth.alice.example/3fcef0f6-5807-4f1b-b77a-63d64df25a69#data-grant-omni-projects';
const accessReceiptIri = 'https://auth.alice.example/dd442d1b-bcc7-40e2-bbb9-4abfa7309fbe';

const allRemoteDataGrantIri = 'https://auth.alice.example/6b1b6e39-75e4-44f8-84f3-104b1a8210ad#data-grant-projects';
const allRemoteAccessReceiptIri = 'https://auth.alice.example/7b513402-d2a2-455f-a6d1-4a54ef90cb78';

const inheritsFromSelectedInstancesIri =
  'https://auth.alice.example/3fcef0f6-5807-4f1b-b77a-63d64df25a69#data-grant-task-pro';
const inheritsFromAllInstancesIri =
  'https://auth.alice.example/3fcef0f6-5807-4f1b-b77a-63d64df25a69#data-grant-task-home';
const inheritsFromSelectedRemoteIri =
  'https://auth.alice.example/3fcef0f6-5807-4f1b-b77a-63d64df25a69#data-grant-omni-tasks';
const inheritsFromAllRemoteFromAgentIri =
  'https://auth.alice.example/3fcef0f6-5807-4f1b-b77a-63d64df25a69#data-grant-acme-projects';
const inheritsFromAllRemoteIri = 'https://auth.alice.example/6b1b6e39-75e4-44f8-84f3-104b1a8210ad#data-grant-tasks';

let accessReceipt: AccessReceipt;
let allRemoteAccessReceipt: AccessReceipt;

beforeAll(async () => {
  accessReceipt = await factory.accessReceipt(accessReceiptIri);
  allRemoteAccessReceipt = await factory.accessReceipt(allRemoteAccessReceiptIri);
});

test('should use correct subclass', async () => {
  const dataGrant = await factory.dataGrant(inheritsFromSelectedInstancesIri, accessReceipt);
  expect(dataGrant).toBeInstanceOf(InheritInstancesDataGrant);
});

test('should set correct scopeOfGrant', async () => {
  const dataGrant = await factory.dataGrant(inheritsFromSelectedInstancesIri, accessReceipt);
  expect(dataGrant.scopeOfGrant).toEqualRdfTerm(INTEROP.InheritInstances);
});

test('should set inheritsFromGrantIri', async () => {
  const dataGrant = (await factory.dataGrant(
    inheritsFromSelectedInstancesIri,
    accessReceipt
  )) as InheritInstancesDataGrant;
  expect(dataGrant.inheritsFromGrantIri).toBe(selectedInstancesDataGrantIri);
});

test('should set inheritsFromGrant', async () => {
  const dataGrant = (await factory.dataGrant(
    inheritsFromSelectedInstancesIri,
    accessReceipt
  )) as InheritInstancesDataGrant;
  expect(dataGrant.inheritsFromGrant).toBeInstanceOf(DataGrant);
});

test('should provide data instance iterator for InheritInstances of AllInstances', async () => {
  const inheritingGrant = accessReceipt.hasDataGrant.find((grant) => grant.iri === inheritsFromAllInstancesIri);
  let count = 0;
  for await (const instance of inheritingGrant.getDataInstanceIterator()) {
    expect(instance).toBeInstanceOf(DataInstance);
    count += 1;
  }
  expect(count).toBe(2);
});

test('should provide data instance iterator for InheritInstances of SelectedInstances', async () => {
  const inheritingGrant = accessReceipt.hasDataGrant.find((grant) => grant.iri === inheritsFromSelectedInstancesIri);
  let count = 0;
  for await (const instance of inheritingGrant.getDataInstanceIterator()) {
    expect(instance).toBeInstanceOf(DataInstance);
    count += 1;
  }
  expect(count).toBe(1);
});

test('should provide data instance iterator for InheritInstances of SelectedRemote', async () => {
  const inheritingGrant = accessReceipt.hasDataGrant.find((grant) => grant.iri === inheritsFromSelectedRemoteIri);
  let count = 0;
  for await (const instance of inheritingGrant.getDataInstanceIterator()) {
    expect(instance).toBeInstanceOf(DataInstance);
    count += 1;
  }
  expect(count).toBe(2);
});

test('should provide data instance iterator for InheritInstances of AllRemoteFromAgent', async () => {
  const inheritingGrant = accessReceipt.hasDataGrant.find((grant) => grant.iri === inheritsFromAllRemoteFromAgentIri);
  let count = 0;
  for await (const instance of inheritingGrant.getDataInstanceIterator()) {
    expect(instance).toBeInstanceOf(DataInstance);
    count += 1;
  }
  expect(count).toBe(4);
});

test('should provide data instance iterator for InheritInstances of AllRemote', async () => {
  const inheritingGrant = allRemoteAccessReceipt.hasDataGrant.find((grant) => grant.iri === inheritsFromAllRemoteIri);
  let count = 0;
  for await (const instance of inheritingGrant.getDataInstanceIterator()) {
    expect(instance).toBeInstanceOf(DataInstance);
    count += 1;
  }
  expect(count).toBe(9);
});
