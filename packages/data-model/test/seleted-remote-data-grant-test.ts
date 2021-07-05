// eslint-disable-next-line import/no-extraneous-dependencies
import 'jest-rdf';
// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from 'interop-test-utils';
import { AccessReceipt, DataInstance, InteropFactory, SelectedRemoteDataGrant } from '../src';
import { INTEROP } from 'interop-namespaces';

const factory = new InteropFactory(fetch);
const snippetIri = 'https://auth.alice.example/3fcef0f6-5807-4f1b-b77a-63d64df25a69#data-grant-omni-projects';

const accessReceiptIri = 'https://auth.alice.example/dd442d1b-bcc7-40e2-bbb9-4abfa7309fbe';

let accessReceipt: AccessReceipt;

beforeAll(async () => {
  accessReceipt = await factory.accessReceipt(accessReceiptIri);
});

test('should use correct subclass', async () => {
  const dataGrant = await factory.dataGrant(snippetIri, accessReceipt);
  expect(dataGrant).toBeInstanceOf(SelectedRemoteDataGrant);
});

test('should set correct scopeOfGrant', async () => {
  const dataGrant = await factory.dataGrant(snippetIri, accessReceipt);
  expect(dataGrant.scopeOfGrant).toEqualRdfTerm(INTEROP.SelectedRemote);
});

test('should set hasDataGrant', async () => {
  const dataGrant = (await factory.dataGrant(snippetIri, accessReceipt)) as SelectedRemoteDataGrant;
  expect(dataGrant.hasDataGrant.length).toBe(1);
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
