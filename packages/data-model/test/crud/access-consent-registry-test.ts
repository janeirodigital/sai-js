// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { randomUUID } from 'crypto';
import { ReadableAccessConsent, AuthorizationAgentFactory } from '../../src';

const webId = 'https://alice.example/#id';
const agentId = 'https://jarvis.alice.example/#agent';
const factory = new AuthorizationAgentFactory(webId, agentId, { fetch, randomUUID });
const snippetIri = 'https://auth.alice.example/96feb105-063e-4996-ab74-5e504c6ceae5';

test('should provide accessConsents', async () => {
  const registry = await factory.crud.accessConsentRegistry(snippetIri);
  let count = 0;
  for await (const consent of registry.accessConsents) {
    count += 1;
    expect(consent).toBeInstanceOf(ReadableAccessConsent);
  }
  expect(count).toBe(2);
});

test('should provide iriForContained method', async () => {
  const registry = await factory.crud.accessConsentRegistry(snippetIri);
  expect(registry.iriForContained()).toMatch(registry.iri);
});
