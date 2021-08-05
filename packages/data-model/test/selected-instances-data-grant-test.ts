// eslint-disable-next-line import/no-extraneous-dependencies
import 'jest-rdf';
// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { randomUUID } from 'crypto';
import { INTEROP } from '@janeirodigital/interop-namespaces';
import { DataInstance, InteropFactory, SelectedInstancesDataGrant } from '../src';

const factory = new InteropFactory({ fetch, randomUUID });
const snippetIri = 'https://auth.alice.example/cd247a67-0879-4301-abd0-828f63abb252';

test('should use correct subclass', async () => {
  const dataGrant = await factory.dataGrant(snippetIri);
  expect(dataGrant).toBeInstanceOf(SelectedInstancesDataGrant);
});

test('should set correct scopeOfGrant', async () => {
  const dataGrant = await factory.dataGrant(snippetIri);
  expect(dataGrant.scopeOfGrant).toEqualRdfTerm(INTEROP.SelectedInstances);
});

test('should set iriPrefix', async () => {
  const dataGrant = await factory.dataGrant(snippetIri);
  const iriPrefix = 'https://pro.alice.example/';
  expect(dataGrant.iriPrefix).toEqual(iriPrefix);
});

test('should set correct canCreate', async () => {
  const dataGrant = await factory.dataGrant(snippetIri);
  expect(dataGrant.canCreate).toBeFalsy();
});

test('should set hasDataRegistrationIri', async () => {
  const dataGrant = (await factory.dataGrant(snippetIri)) as SelectedInstancesDataGrant;
  const dataRegistrationIri = 'https://pro.alice.example/773605f0-b5bf-4d46-878d-5c167eac8b5d';
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
