// eslint-disable-next-line import/no-extraneous-dependencies
import 'jest-rdf';
// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from 'interop-test-utils';
import { randomUUID } from 'crypto';
import { INTEROP } from 'interop-namespaces';
import { AllRemoteDataGrant, DataInstance, InteropFactory } from '../src';

const factory = new InteropFactory({ fetch, randomUUID });

const snippetIri = 'https://auth.alice.example/a691ee69-97d8-45c0-bb03-8e887b2db806';

test('should use correct subclass', async () => {
  const dataGrant = await factory.dataGrant(snippetIri);
  expect(dataGrant).toBeInstanceOf(AllRemoteDataGrant);
});

test('should set correct scopeOfGrant', async () => {
  const dataGrant = await factory.dataGrant(snippetIri);
  expect(dataGrant.scopeOfGrant).toEqualRdfTerm(INTEROP.AllRemote);
});

test('should set hasRemoteDataRegistrationIri', async () => {
  const dataGrant = (await factory.dataGrant(snippetIri)) as AllRemoteDataGrant;
  const remoteDataRegistrationIri = 'https://auth.alice.example/33caf7be-f804-4155-a57a-92216c577bd4';
  expect(dataGrant.hasRemoteDataRegistrationIri).toBe(remoteDataRegistrationIri);
});

test('should provide data instance iterator', async () => {
  const dataGrant = await factory.dataGrant(snippetIri);
  let count = 0;
  for await (const instance of dataGrant.getDataInstanceIterator()) {
    expect(instance).toBeInstanceOf(DataInstance);
    count += 1;
  }
  expect(count).toBe(5);
});
