// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { randomUUID } from 'crypto';
import { ReadableApplicationRegistration, ReadableSocialAgentRegistration, AuthorizationAgentFactory } from '../src';

const factory = new AuthorizationAgentFactory({ fetch, randomUUID });
const snippetIri = 'https://auth.alice.example/1cf3e08b-ffe2-465a-ac5b-94ce165cb8f0';

test('should provide applicationRegistrations', async () => {
  const registry = await factory.readable.agentRegistry(snippetIri);
  let count = 0;
  for await (const consent of registry.applicationRegistrations) {
    count += 1;
    expect(consent).toBeInstanceOf(ReadableApplicationRegistration);
  }
  expect(count).toBe(2);
});

test('should provide socialAgentRegistrations', async () => {
  const registry = await factory.readable.agentRegistry(snippetIri);
  let count = 0;
  for await (const consent of registry.socialAgentRegistrations) {
    count += 1;
    expect(consent).toBeInstanceOf(ReadableSocialAgentRegistration);
  }
  expect(count).toBe(2);
});
