// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { randomUUID } from 'crypto';
import { ReadableDataConsent, AuthorizationAgentFactory } from '../src';

const factory = new AuthorizationAgentFactory({ fetch, randomUUID });
const snippetIri = 'https://auth.alice.example/eac2c39c-c8b3-4880-8b9f-a3e12f7f6372';

test('should provide dataConsents', async () => {
  const registry = await factory.readable.accessConsent(snippetIri);
  let count = 0;
  for await (const consent of registry.dataConsents) {
    count += 1;
    expect(consent).toBeInstanceOf(ReadableDataConsent);
  }
  expect(count).toBe(4);
});
