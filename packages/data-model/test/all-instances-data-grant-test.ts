// eslint-disable-next-line import/no-extraneous-dependencies
import 'jest-rdf';
// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from 'interop-test-utils';
import { AccessReceipt, AllInstancesDataGrant, DataInstance, InteropFactory } from '../src';
import { INTEROP } from 'interop-namespaces';

const factory = new InteropFactory(fetch);
const snippetIri = 'https://auth.alice.example/3fcef0f6-5807-4f1b-b77a-63d64df25a69#data-grant-project-home';

const accessReceiptIri = 'https://auth.alice.example/dd442d1b-bcc7-40e2-bbb9-4abfa7309fbe';

let accessReceipt: AccessReceipt;

beforeAll(async () => {
  accessReceipt = await factory.accessReceipt(accessReceiptIri);
});

test('should use correct subclass', async () => {
  const dataGrant = await factory.dataGrant(snippetIri, accessReceipt);
  expect(dataGrant).toBeInstanceOf(AllInstancesDataGrant);
});

test('should set correct scopeOfGrant', async () => {
  const dataGrant = await factory.dataGrant(snippetIri, accessReceipt);
  expect(dataGrant.scopeOfGrant).toEqualRdfTerm(INTEROP.AllInstances);
});

test('should set hasDataRegistrationIri', async () => {
  const dataGrant = await factory.dataGrant(snippetIri, accessReceipt);
  const dataRegistrationIri = 'https://home.alice.example/f6ccd3a4-45ea-4f98-8a36-98eac92a6720';
  expect(dataGrant.hasDataRegistrationIri).toBe(dataRegistrationIri);
});

test('should provide data instance iterator', async () => {
  const dataGrant = await factory.dataGrant(snippetIri, accessReceipt);
  let count = 0;
  for await (const instance of dataGrant.getDataInstanceIterator()) {
    expect(instance).toBeInstanceOf(DataInstance);
    count += 1;
  }
  expect(count).toBe(1);
});
