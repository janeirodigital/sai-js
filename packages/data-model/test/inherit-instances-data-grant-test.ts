// eslint-disable-next-line import/no-extraneous-dependencies
import 'jest-rdf';
// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { randomUUID } from 'crypto';
import { INTEROP } from '@janeirodigital/interop-namespaces';
import {
  ReadableAccessGrant,
  DataInstance,
  ApplicationFactory,
  InheritInstancesDataGrant,
  AbstractDataGrant
} from '../src';

const factory = new ApplicationFactory({ fetch, randomUUID });
const selectedInstancesDataGrantIri = 'https://auth.alice.example/cd247a67-0879-4301-abd0-828f63abb252';
const accessGrantIri = 'https://auth.alice.example/dd442d1b-bcc7-40e2-bbb9-4abfa7309fbe';

const inheritsFromSelectedInstancesIri = 'https://auth.alice.example/9827ae00-2778-4655-9f22-08bb9daaee26';
const inheritsFromAllInstancesIri = 'https://auth.alice.example/54b1a123-23ca-4733-9371-700b52b9c567';

let accessGrant: ReadableAccessGrant;

beforeAll(async () => {
  accessGrant = await factory.readable.accessGrant(accessGrantIri);
});

test('should use correct subclass', async () => {
  const dataGrant = await factory.readable.dataGrant(inheritsFromSelectedInstancesIri);
  expect(dataGrant).toBeInstanceOf(InheritInstancesDataGrant);
});

test('should set correct scopeOfGrant', async () => {
  const dataGrant = await factory.readable.dataGrant(inheritsFromSelectedInstancesIri);
  expect(dataGrant.scopeOfGrant).toEqualRdfTerm(INTEROP.InheritInstances);
});

test('should set iriPrefix', async () => {
  const dataGrant = await factory.readable.dataGrant(inheritsFromSelectedInstancesIri);
  const iriPrefix = 'https://pro.alice.example/';
  expect(dataGrant.iriPrefix).toEqual(iriPrefix);
});

test('should set correct canCreate', async () => {
  const dataGrant = await factory.readable.dataGrant(inheritsFromSelectedInstancesIri);
  expect(dataGrant.canCreate).toBeTruthy();
});

test('should set inheritsFromGrantIri', async () => {
  const dataGrant = (await factory.readable.dataGrant(inheritsFromSelectedInstancesIri)) as InheritInstancesDataGrant;
  expect(dataGrant.inheritsFromGrantIri).toBe(selectedInstancesDataGrantIri);
});

test('should set inheritsFromGrant', async () => {
  const dataGrant = (await factory.readable.dataGrant(inheritsFromSelectedInstancesIri)) as InheritInstancesDataGrant;
  expect(dataGrant.inheritsFromGrant).toBeInstanceOf(AbstractDataGrant);
});

test('should provide data instance iterator for InheritInstances of AllInstances', async () => {
  const inheritingGrant = accessGrant.hasDataGrant.find((grant) => grant.iri === inheritsFromAllInstancesIri);
  let count = 0;
  for await (const instance of inheritingGrant.getDataInstanceIterator()) {
    expect(instance).toBeInstanceOf(DataInstance);
    count += 1;
  }
  expect(count).toBe(2);
});

test('should provide data instance iterator for InheritInstances of SelectedInstances', async () => {
  const inheritingGrant = accessGrant.hasDataGrant.find((grant) => grant.iri === inheritsFromSelectedInstancesIri);
  let count = 0;
  for await (const instance of inheritingGrant.getDataInstanceIterator()) {
    expect(instance).toBeInstanceOf(DataInstance);
    count += 1;
  }
  expect(count).toBe(1);
});

describe('newDataInstance', () => {
  test('should create data instance', async () => {
    const parentInstanceIri = 'https://pro.alice.example/ccbd77ae-f769-4e07-b41f-5136501e13e7#project';
    const dataGrant = (await factory.readable.dataGrant(inheritsFromSelectedInstancesIri)) as InheritInstancesDataGrant;
    const parentInstance = await factory.dataInstance(parentInstanceIri, dataGrant.inheritsFromGrant);
    const newDataInstance = dataGrant.newDataInstance(parentInstance);
    expect(newDataInstance.iri).toMatch(dataGrant.iriPrefix);
  });
});
