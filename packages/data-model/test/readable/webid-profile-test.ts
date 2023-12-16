// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { randomUUID } from 'crypto';
import { ApplicationFactory } from '../../src';

const factory = new ApplicationFactory({ fetch, randomUUID });
const webId = 'https://alice.example/#id';

describe('getters', () => {
  test('hasRegistrySet', async () => {
    const webIdProfile = await factory.readable.webIdProfile(webId);
    expect(webIdProfile.hasRegistrySet).toBe('https://auth.alice.example/13e60d32-77a6-4239-864d-cfe2c90807c8');
  });

  test('label', async () => {
    const webIdProfile = await factory.readable.webIdProfile(webId);
    expect(webIdProfile.label).toBe('Alice');
  });
});
