// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { randomUUID } from 'crypto';
import { ReadableRegistrySet, AuthorizationAgentFactory } from '../src';

const factory = new AuthorizationAgentFactory({ fetch, randomUUID });
const snippetIri = 'https://auth.alice.example/13e60d32-77a6-4239-864d-cfe2c90807c8';

describe('build', () => {
  test('should return instance of RegistrySet', async () => {
    const registrySet = await factory.readable.registrySet(snippetIri);
    expect(registrySet).toBeInstanceOf(ReadableRegistrySet);
  });

  test('should fetch its data', async () => {
    const registrySet = await factory.readable.registrySet(snippetIri);
    expect(registrySet.dataset.size).toBeGreaterThan(0);
  });

  test('should set hasAgentRegistry', async () => {
    const agentRegistryIri = 'https://auth.alice.example/1cf3e08b-ffe2-465a-ac5b-94ce165cb8f0';
    const registrySet = await factory.readable.registrySet(snippetIri);
    expect(registrySet.hasAgentRegistry.iri).toEqual(agentRegistryIri);
  });

  test('should set hasAccessConsentRegistry', async () => {
    const accessConsentRegistryIri = 'https://auth.alice.example/96feb105-063e-4996-ab74-5e504c6ceae5';
    const registrySet = await factory.readable.registrySet(snippetIri);
    expect(registrySet.hasAccessConsentRegistry.iri).toEqual(accessConsentRegistryIri);
  });
});
