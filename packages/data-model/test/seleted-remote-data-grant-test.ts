// eslint-disable-next-line import/no-extraneous-dependencies
import 'jest-rdf';
// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from 'interop-test-utils';
import { INTEROP } from 'interop-namespaces';
import { DataInstance, InteropFactory, SelectedRemoteDataGrant } from '../src';

const factory = new InteropFactory(fetch);
const snippetIri = 'https://auth.alice.example/329eb90a-feb9-4c95-a427-2ef23989abe9';

test('should use correct subclass', async () => {
  const dataGrant = await factory.dataGrant(snippetIri);
  expect(dataGrant).toBeInstanceOf(SelectedRemoteDataGrant);
});

test('should set correct scopeOfGrant', async () => {
  const dataGrant = await factory.dataGrant(snippetIri);
  expect(dataGrant.scopeOfGrant).toEqualRdfTerm(INTEROP.SelectedRemote);
});

test('should set hasDataGrant', async () => {
  const dataGrant = (await factory.dataGrant(snippetIri)) as SelectedRemoteDataGrant;
  expect(dataGrant.hasDataGrant.length).toBe(1);
});

test('should provide data instance iterator', async () => {
  const dataGrant = await factory.dataGrant(snippetIri);
  let count = 0;
  for await (const instance of dataGrant.getDataInstanceIterator()) {
    expect(instance).toBeInstanceOf(DataInstance);
    count += 1;
  }
  expect(count).toBe(1);
});
