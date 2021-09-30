// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { randomUUID } from 'crypto';
import {
  ReadableDataRegistrationProxy,
  AllInstancesDataGrant,
  InteropFactory,
  SelectedInstancesDataGrant,
  DataInstance,
  InheritInstancesDataGrant
} from '../src';

const factory = new InteropFactory({ fetch, randomUUID });

const grantIri = 'https://auth.alice.example/7b2bc4ff-b4b8-47b8-96f6-06695f4c5126';

test('should delegate dataInstances to grant', async () => {
  const grant = await factory.dataGrant(grantIri);
  const spy = jest.spyOn(grant, 'getDataInstanceIterator');
  const dataRegistrationProxy = new ReadableDataRegistrationProxy(grant);
  for await (const dataInstance of dataRegistrationProxy.dataInstances) {
    expect(dataInstance).toBeInstanceOf(DataInstance);
  }
  expect(spy).toHaveBeenCalledTimes(1);
});

test('should delegate newDataInstance to grant', async () => {
  const grant = (await factory.dataGrant(grantIri)) as AllInstancesDataGrant;
  const dataRegistrationProxy = new ReadableDataRegistrationProxy(grant);
  const spy = jest.spyOn(grant, 'newDataInstance');
  dataRegistrationProxy.newDataInstance();
  expect(spy).toHaveBeenCalledTimes(1);
});

test('should throw error if SelectedInstances grant', async () => {
  const selectedInstancesGrantIri = 'https://auth.alice.example/cd247a67-0879-4301-abd0-828f63abb252';
  const grant = (await factory.dataGrant(selectedInstancesGrantIri)) as SelectedInstancesDataGrant;
  const dataRegistrationProxy = new ReadableDataRegistrationProxy(grant);
  expect(() => {
    dataRegistrationProxy.newDataInstance();
  }).toThrow('cannot create instances based on SelectedInstances data grant');
});

test('should throw error if InheritedInstances grant and no parent', async () => {
  const selectedInstancesGrantIri = 'https://auth.alice.example/9827ae00-2778-4655-9f22-08bb9daaee26';
  const grant = (await factory.dataGrant(selectedInstancesGrantIri)) as InheritInstancesDataGrant;
  const dataRegistrationProxy = new ReadableDataRegistrationProxy(grant);
  expect(() => {
    dataRegistrationProxy.newDataInstance();
  }).toThrow('cannot create instances based on InheritInstances data grant');
});
