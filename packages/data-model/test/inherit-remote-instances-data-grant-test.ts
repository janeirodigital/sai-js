// eslint-disable-next-line import/no-extraneous-dependencies
import 'jest-rdf';
// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from 'interop-test-utils';
import { randomUUID } from 'crypto';
import { INTEROP } from 'interop-namespaces';
import {
  AccessReceipt,
  DataInstance,
  InteropFactory,
  InheritRemoteInstancesDataGrant,
  AbstractDataGrant
} from '../src';

const factory = new InteropFactory({ fetch, randomUUID });
const accessReceiptIri = 'https://auth.alice.example/dd442d1b-bcc7-40e2-bbb9-4abfa7309fbe';
const allRemoteAccessReceiptIri = 'https://auth.alice.example/7b513402-d2a2-455f-a6d1-4a54ef90cb78';

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
  const dataGrant = await factory.dataGrant(inheritsFromSelectedRemoteIri);
  expect(dataGrant).toBeInstanceOf(InheritRemoteInstancesDataGrant);
});

test('should set correct scopeOfGrant', async () => {
  const dataGrant = await factory.dataGrant(inheritsFromSelectedRemoteIri);
  expect(dataGrant.scopeOfGrant).toEqualRdfTerm(INTEROP.InheritRemoteInstances);
});

test('should set inheritsFromGrantIri', async () => {
  const selectedRemoteDataGrantIri = 'https://auth.alice.example/329eb90a-feb9-4c95-a427-2ef23989abe9';
  const dataGrant = (await factory.dataGrant(
    inheritsFromSelectedRemoteIri
  )) as unknown as InheritRemoteInstancesDataGrant;
  expect(dataGrant.inheritsFromGrantIri).toBe(selectedRemoteDataGrantIri);
});

test('should set inheritsFromGrant', async () => {
  const dataGrant = (await factory.dataGrant(inheritsFromSelectedRemoteIri)) as InheritRemoteInstancesDataGrant;
  expect(dataGrant.inheritsFromGrant).toBeInstanceOf(AbstractDataGrant);
});

test('should build hasSourceGrant', async () => {
  const dataGrant = (await factory.dataGrant(inheritsFromSelectedRemoteIri)) as InheritRemoteInstancesDataGrant;
  const sourceGrantIris = [...dataGrant.hasSourceGrant].map((sourceGrant) => sourceGrant.iri);
  expect(sourceGrantIris).toContain('https://auth.omni.example/73c5f23c-099e-452e-ab29-cbfc8c8a19f8');
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
