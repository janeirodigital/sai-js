// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { randomUUID } from 'crypto';
import {
  DataRegistrationProxy,
  AllInstancesDataGrant,
  InteropFactory,
  SelectedInstancesDataGrant,
  DataInstance
} from '../src';

const factory = new InteropFactory({ fetch, randomUUID });

const grantIri = 'https://auth.alice.example/7b2bc4ff-b4b8-47b8-96f6-06695f4c5126';

test('should delegate dataInstances to grant', async () => {
  const grant = await factory.dataGrant(grantIri);
  const spy = jest.spyOn(grant, 'getDataInstanceIterator');
  const dataRegistrationProxy = new DataRegistrationProxy(grant);
  for await (const dataInstance of dataRegistrationProxy.dataInstances) {
    expect(dataInstance).toBeInstanceOf(DataInstance);
  }
  expect(spy).toHaveBeenCalledTimes(1);
});

test('should delegate newDataInstance to grant', async () => {
  const grant = (await factory.dataGrant(grantIri)) as AllInstancesDataGrant;
  const dataRegistrationProxy = new DataRegistrationProxy(grant);
  const spy = jest.spyOn(grant, 'newDataInstance');
  dataRegistrationProxy.newDataInstance();
  expect(spy).toHaveBeenCalledTimes(1);
});

test('should throw error if SelectedInstances grant', async () => {
  const selectedInstancesGrantIri = 'https://auth.alice.example/cd247a67-0879-4301-abd0-828f63abb252';
  const grant = (await factory.dataGrant(selectedInstancesGrantIri)) as SelectedInstancesDataGrant;
  const dataRegistrationProxy = new DataRegistrationProxy(grant);
  expect(() => {
    dataRegistrationProxy.newDataInstance();
  }).toThrowError();
});
