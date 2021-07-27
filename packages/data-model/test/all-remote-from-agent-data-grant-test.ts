// eslint-disable-next-line import/no-extraneous-dependencies
import 'jest-rdf';
// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from 'interop-test-utils';
import { randomUUID } from 'crypto';
import { INTEROP } from 'interop-namespaces';
import { AllRemoteFromAgentDataGrant, DataInstance, InteropFactory } from '../src';

const factory = new InteropFactory({ fetch, randomUUID });
const snippetIri = 'https://auth.alice.example/e2765d6c-848a-4fc0-9092-556903730263';

test('should use correct subclass', async () => {
  const dataGrant = await factory.dataGrant(snippetIri);
  expect(dataGrant).toBeInstanceOf(AllRemoteFromAgentDataGrant);
});

test('should set correct scopeOfGrant', async () => {
  const dataGrant = await factory.dataGrant(snippetIri);
  expect(dataGrant.scopeOfGrant).toEqualRdfTerm(INTEROP.AllRemoteFromAgent);
});

test('should set hasRemoteDataFromAgentIri', async () => {
  const dataGrant = (await factory.dataGrant(snippetIri)) as AllRemoteFromAgentDataGrant;
  const hasRemoteDataFromAgentIri = 'https://auth.alice.example/3a019d90-c7fb-4e65-865d-4254ef064667';
  expect(dataGrant.hasRemoteDataFromAgentIri).toBe(hasRemoteDataFromAgentIri);
});

test('should build hasSourceGrant', async () => {
  const dataGrant = (await factory.dataGrant(snippetIri)) as AllRemoteFromAgentDataGrant;
  const sourceGrantIris = [...dataGrant.hasSourceGrant].map((sourceGrant) => sourceGrant.iri);
  expect(sourceGrantIris).toContain('https://auth.acme.example/f8064946-cb67-469a-8b28-652fd17090f6');
  expect(sourceGrantIris).toContain('https://auth.acme.example/80ef3361-730b-4f7c-93ba-4a4415de7264');
});

test('should provide data instance iterator', async () => {
  const dataGrant = await factory.dataGrant(snippetIri);
  let count = 0;
  for await (const instance of dataGrant.getDataInstanceIterator()) {
    expect(instance).toBeInstanceOf(DataInstance);
    count += 1;
  }
  expect(count).toBe(4);
});
