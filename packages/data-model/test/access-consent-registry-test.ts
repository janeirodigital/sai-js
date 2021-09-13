// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { randomUUID } from 'crypto';
import { ReadableAccessConsent, AuthorizationAgentFactory } from '../src';

const factory = new AuthorizationAgentFactory({ fetch, randomUUID });
const snippetIri = 'https://auth.alice.example/96feb105-063e-4996-ab74-5e504c6ceae5';

test('should provide accessConsents', async () => {
  const registry = await factory.readable.accessConsentRegistry(snippetIri);
  let count = 0;
  for await (const consent of registry.accessConsents) {
    count += 1;
    expect(consent).toBeInstanceOf(ReadableAccessConsent);
  }
  expect(count).toBe(2);
});
