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

test('should build hasSourceGrant', async () => {
  const dataGrant = (await factory.dataGrant(snippetIri)) as AllRemoteDataGrant;
  const sourceGrantIris = [...dataGrant.hasSourceGrant].map((sourceGrant) => sourceGrant.iri);
  expect(sourceGrantIris).toContain('https://auth.acme.example/f8064946-cb67-469a-8b28-652fd17090f6');
  expect(sourceGrantIris).toContain('https://auth.acme.example/80ef3361-730b-4f7c-93ba-4a4415de7264');
  expect(sourceGrantIris).toContain('https://auth.omni.example/a7f7d66d-13ba-4ba6-8908-3ea9c2703fce');
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
