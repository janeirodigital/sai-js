import { test } from 'vitest';
import { fetch } from '@janeirodigital/interop-test-utils';
import { randomUUID } from 'crypto';
import { INTEROP } from '@janeirodigital/interop-utils';
import { expect } from '../expect';
import { DataInstance, ApplicationFactory, SelectedFromRegistryDataGrant } from '../../src';

const factory = new ApplicationFactory({ fetch, randomUUID });
const snippetIri = 'https://auth.alice.example/cd247a67-0879-4301-abd0-828f63abb252';

test('should use correct subclass', async () => {
  const dataGrant = await factory.readable.dataGrant(snippetIri);
  expect(dataGrant).toBeInstanceOf(SelectedFromRegistryDataGrant);
});

test('should set correct scopeOfGrant', async () => {
  const dataGrant = await factory.readable.dataGrant(snippetIri);
  expect(dataGrant.scopeOfGrant).toEqualRdfTerm(INTEROP.SelectedFromRegistry);
});

test('should set iriPrefix', async () => {
  const dataGrant = await factory.readable.dataGrant(snippetIri);
  const iriPrefix = 'https://pro.alice.example/';
  expect(dataGrant.iriPrefix).toEqual(iriPrefix);
});

test('should set correct canCreate', async () => {
  const dataGrant = await factory.readable.dataGrant(snippetIri);
  expect(dataGrant.canCreate).toBeFalsy();
});

test('should set hasDataRegistration', async () => {
  const dataGrant = (await factory.readable.dataGrant(snippetIri)) as SelectedFromRegistryDataGrant;
  const dataRegistrationIri = 'https://pro.alice.example/773605f0-b5bf-4d46-878d-5c167eac8b5d';
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
