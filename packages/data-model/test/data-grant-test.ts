// eslint-disable-next-line import/no-extraneous-dependencies
import 'jest-rdf';
// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { randomUUID } from 'crypto';
import { ACL } from '@janeirodigital/interop-namespaces';
import { ApplicationFactory } from '../src';

const factory = new ApplicationFactory({ fetch, randomUUID });
const dataGrantIri = 'https://auth.alice.example/cd247a67-0879-4301-abd0-828f63abb252';

test('should set the iri', async () => {
  const dataGrant = await factory.readable.dataGrant(dataGrantIri);
  expect(dataGrant.iri).toBe(dataGrantIri);
});

test('should set the accessMode', async () => {
  const dataGrant = await factory.readable.dataGrant(dataGrantIri);
  expect(dataGrant.accessMode).toContain(ACL.Read.value);
  expect(dataGrant.accessMode).toContain(ACL.Write.value);
});

test('should set the hasDataRegistration', async () => {
  const dataGrant = await factory.readable.dataGrant(dataGrantIri);
  const dataRegistrationIri = 'https://pro.alice.example/773605f0-b5bf-4d46-878d-5c167eac8b5d';
  expect(dataGrant.hasDataRegistration).toBe(dataRegistrationIri);
});

test('should set the factory', async () => {
  const dataGrant = await factory.readable.dataGrant(dataGrantIri);
  expect(dataGrant.factory).toBe(factory);
});

test('should set registeredShapeTree', async () => {
  const dataGrant = await factory.readable.dataGrant(dataGrantIri);
  const projectShapeTree = 'https://solidshapes.example/trees/Project';
  expect(dataGrant.registeredShapeTree).toBe(projectShapeTree);
});

describe('newDataInstance', () => {
  test.todo('sets dataGrant on created data instance');
});
