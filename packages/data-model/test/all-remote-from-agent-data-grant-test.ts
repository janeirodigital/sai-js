// eslint-disable-next-line import/no-extraneous-dependencies
import 'jest-rdf';
// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from 'interop-test-utils';
import { INTEROP } from 'interop-namespaces';
import { AllRemoteFromAgentDataGrant, DataInstance, InteropFactory } from '../src';

const factory = new InteropFactory(fetch);
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

test('should provide data instance iterator', async () => {
  const dataGrant = await factory.dataGrant(snippetIri);
  let count = 0;
  for await (const instance of dataGrant.getDataInstanceIterator()) {
    expect(instance).toBeInstanceOf(DataInstance);
    count += 1;
  }
  expect(count).toBe(4);
});
