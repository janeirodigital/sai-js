// eslint-disable-next-line import/no-extraneous-dependencies
import 'jest-rdf';
// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from 'interop-test-utils';
import { INTEROP } from 'interop-namespaces';
import { AllInstancesDataGrant, DataInstance, InteropFactory } from '../src';

const factory = new InteropFactory(fetch);
const snippetIri = 'https://auth.alice.example/7b2bc4ff-b4b8-47b8-96f6-06695f4c5126';

test('should use correct subclass', async () => {
  const dataGrant = await factory.dataGrant(snippetIri);
  expect(dataGrant).toBeInstanceOf(AllInstancesDataGrant);
});

test('should set correct scopeOfGrant', async () => {
  const dataGrant = await factory.dataGrant(snippetIri);
  expect(dataGrant.scopeOfGrant).toEqualRdfTerm(INTEROP.AllInstances);
});

test('should set hasDataRegistrationIri', async () => {
  const dataGrant = (await factory.dataGrant(snippetIri)) as AllInstancesDataGrant;
  const dataRegistrationIri = 'https://home.alice.example/f6ccd3a4-45ea-4f98-8a36-98eac92a6720';
  expect(dataGrant.hasDataRegistrationIri).toBe(dataRegistrationIri);
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
