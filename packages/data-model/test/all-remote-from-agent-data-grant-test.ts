// eslint-disable-next-line import/no-extraneous-dependencies
import 'jest-rdf';
// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from 'interop-test-utils';
import { INTEROP } from 'interop-namespaces';
import { AccessReceipt, AllRemoteFromAgentDataGrant, DataInstance, InteropFactory } from '../src';

const factory = new InteropFactory(fetch);
const snippetIri = 'https://auth.alice.example/3fcef0f6-5807-4f1b-b77a-63d64df25a69#data-grant-acme-projects';

const accessReceiptIri = 'https://auth.alice.example/dd442d1b-bcc7-40e2-bbb9-4abfa7309fbe';

let accessReceipt: AccessReceipt;

beforeAll(async () => {
  accessReceipt = await factory.accessReceipt(accessReceiptIri);
});

test('should use correct subclass', async () => {
  const dataGrant = await factory.dataGrant(snippetIri, null, accessReceipt);
  expect(dataGrant).toBeInstanceOf(AllRemoteFromAgentDataGrant);
});

test('should set correct scopeOfGrant', async () => {
  const dataGrant = await factory.dataGrant(snippetIri, null, accessReceipt);
  expect(dataGrant.scopeOfGrant).toEqualRdfTerm(INTEROP.AllRemoteFromAgent);
});

test('should set hasRemoteDataFromAgentIri', async () => {
  const dataGrant = (await factory.dataGrant(snippetIri, null, accessReceipt)) as AllRemoteFromAgentDataGrant;
  const hasRemoteDataFromAgentIri = 'https://auth.alice.example/3a019d90-c7fb-4e65-865d-4254ef064667';
  expect(dataGrant.hasRemoteDataFromAgentIri).toBe(hasRemoteDataFromAgentIri);
});

test('should provide data instance iterator', async () => {
  const dataGrant = await factory.dataGrant(snippetIri, null, accessReceipt);
  let count = 0;
  for await (const instance of dataGrant.getDataInstanceIterator()) {
    expect(instance).toBeInstanceOf(DataInstance);
    count += 1;
  }
  expect(count).toBe(4);
});
