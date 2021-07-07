// eslint-disable-next-line import/no-extraneous-dependencies
import 'jest-rdf';
// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from 'interop-test-utils';
import { INTEROP } from 'interop-namespaces';
import { AccessReceipt, AllRemoteDataGrant, DataInstance, InteropFactory } from '../src';

const factory = new InteropFactory(fetch);

const snippetIri = 'https://auth.alice.example/6b1b6e39-75e4-44f8-84f3-104b1a8210ad#data-grant-projects';

const accessReceiptIri = 'https://auth.alice.example/7b513402-d2a2-455f-a6d1-4a54ef90cb78';

let accessReceipt: AccessReceipt;

beforeAll(async () => {
  accessReceipt = await factory.accessReceipt(accessReceiptIri);
});

test('should use correct subclass', async () => {
  const dataGrant = await factory.dataGrant(snippetIri, accessReceipt);
  expect(dataGrant).toBeInstanceOf(AllRemoteDataGrant);
});

test('should set correct scopeOfGrant', async () => {
  const dataGrant = await factory.dataGrant(snippetIri, accessReceipt);
  expect(dataGrant.scopeOfGrant).toEqualRdfTerm(INTEROP.AllRemote);
});

test('should set hasRemoteDataRegistrationIri', async () => {
  const dataGrant = (await factory.dataGrant(snippetIri, accessReceipt)) as AllRemoteDataGrant;
  const remoteDataRegistrationIri = 'https://auth.alice.example/33caf7be-f804-4155-a57a-92216c577bd4';
  expect(dataGrant.hasRemoteDataRegistrationIri).toBe(remoteDataRegistrationIri);
});

test('should provide data instance iterator', async () => {
  const dataGrant = await factory.dataGrant(snippetIri, accessReceipt);
  let count = 0;
  for await (const instance of dataGrant.getDataInstanceIterator()) {
    expect(instance).toBeInstanceOf(DataInstance);
    count += 1;
  }
  expect(count).toBe(5);
});
