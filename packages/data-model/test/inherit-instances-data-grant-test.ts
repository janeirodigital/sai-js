// eslint-disable-next-line import/no-extraneous-dependencies
import 'jest-rdf';
// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from 'interop-test-utils';
import { INTEROP } from 'interop-namespaces';
import { AccessReceipt, DataInstance, InteropFactory, InheritInstancesDataGrant, AbstractDataGrant } from '../src';

const factory = new InteropFactory(fetch);
const selectedInstancesDataGrantIri = 'https://auth.alice.example/cd247a67-0879-4301-abd0-828f63abb252';
const accessReceiptIri = 'https://auth.alice.example/dd442d1b-bcc7-40e2-bbb9-4abfa7309fbe';

const allRemoteAccessReceiptIri = 'https://auth.alice.example/7b513402-d2a2-455f-a6d1-4a54ef90cb78';

const inheritsFromSelectedInstancesIri = 'https://auth.alice.example/9827ae00-2778-4655-9f22-08bb9daaee26';
const inheritsFromAllInstancesIri = 'https://auth.alice.example/54b1a123-23ca-4733-9371-700b52b9c567';
const inheritsFromSelectedRemoteIri = 'https://auth.alice.example/fe442ef3-5200-4b06-b4bc-fc0b495603a9';
const inheritsFromAllRemoteFromAgentIri = 'https://auth.alice.example/e2765d6c-848a-4fc0-9092-556903730263';
const inheritsFromAllRemoteIri = 'https://auth.alice.example/ecdf7b5e-5123-4a93-87bc-86ef6de389ff';

let accessReceipt: AccessReceipt;
let allRemoteAccessReceipt: AccessReceipt;

beforeAll(async () => {
  accessReceipt = await factory.accessReceipt(accessReceiptIri);
  allRemoteAccessReceipt = await factory.accessReceipt(allRemoteAccessReceiptIri);
});

test('should use correct subclass', async () => {
  const dataGrant = await factory.dataGrant(inheritsFromSelectedInstancesIri);
  expect(dataGrant).toBeInstanceOf(InheritInstancesDataGrant);
});

test('should set correct scopeOfGrant', async () => {
  const dataGrant = await factory.dataGrant(inheritsFromSelectedInstancesIri);
  expect(dataGrant.scopeOfGrant).toEqualRdfTerm(INTEROP.InheritInstances);
});

test('should set inheritsFromGrantIri', async () => {
  const dataGrant = (await factory.dataGrant(inheritsFromSelectedInstancesIri)) as unknown as InheritInstancesDataGrant;
  expect(dataGrant.inheritsFromGrantIri).toBe(selectedInstancesDataGrantIri);
});

test('should set inheritsFromGrant', async () => {
  const dataGrant = (await factory.dataGrant(inheritsFromSelectedInstancesIri)) as unknown as InheritInstancesDataGrant;
  expect(dataGrant.inheritsFromGrant).toBeInstanceOf(AbstractDataGrant);
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
