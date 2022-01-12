// eslint-disable-next-line import/no-extraneous-dependencies
import 'jest-rdf';
// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { randomUUID } from 'crypto';
import { INTEROP } from '@janeirodigital/interop-namespaces';
import { AllFromRegistryDataGrant, DataInstance, ApplicationFactory } from '../../src';

const factory = new ApplicationFactory({ fetch, randomUUID });
const snippetIri = 'https://auth.alice.example/7b2bc4ff-b4b8-47b8-96f6-06695f4c5126';

test('should use correct subclass', async () => {
  const dataGrant = await factory.readable.dataGrant(snippetIri);
  expect(dataGrant).toBeInstanceOf(AllFromRegistryDataGrant);
});

test('should set correct scopeOfGrant', async () => {
  const dataGrant = await factory.readable.dataGrant(snippetIri);
  expect(dataGrant.scopeOfGrant).toEqualRdfTerm(INTEROP.AllFromRegistry);
});

test('should set correct canCreate', async () => {
  const dataGrant = await factory.readable.dataGrant(snippetIri);
  expect(dataGrant.canCreate).toBeTruthy();
});

test('should set iriPrefix', async () => {
  const dataGrant = await factory.readable.dataGrant(snippetIri);
  const iriPrefix = 'https://home.alice.example/';
  expect(dataGrant.iriPrefix).toEqual(iriPrefix);
});

test('should set hasDataRegistration', async () => {
  const dataGrant = (await factory.readable.dataGrant(snippetIri)) as AllFromRegistryDataGrant;
  const dataRegistrationIri = 'https://home.alice.example/f6ccd3a4-45ea-4f98-8a36-98eac92a6720';
  expect(dataGrant.hasDataRegistration).toBe(dataRegistrationIri);
});

test('should provide data instance iterator', async () => {
  const dataGrant = await factory.readable.dataGrant(snippetIri);
  let count = 0;
  for await (const instance of dataGrant.getDataInstanceIterator()) {
    expect(instance).toBeInstanceOf(DataInstance);
    count += 1;
  }
  expect(count).toBe(1);
});

describe('newDataInstance', () => {
  test('should create data instance', async () => {
    const dataGrant = (await factory.readable.dataGrant(snippetIri)) as AllFromRegistryDataGrant;
    const newDataInstance = dataGrant.newDataInstance();
    expect(newDataInstance.iri).toMatch(dataGrant.iriPrefix);
  });
});
