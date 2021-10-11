import { randomUUID } from 'crypto';
// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import {
  ReadableRegistrySet,
  ReadableAccessConsent,
  ReadableApplicationRegistration,
  ReadableSocialAgentRegistration
} from '@janeirodigital/interop-data-model';
import { WhatwgFetch } from '@janeirodigital/interop-utils';
import { AuthorizationAgent } from '../src';

const webId = 'https://alice.example/#id';
const agentId = 'https://alice.jarvis.example/#agent';

test('should build registrySet', async () => {
  const agent = await AuthorizationAgent.build(webId, agentId, { fetch: fetch as WhatwgFetch, randomUUID });
  const registrySetIri = 'https://auth.alice.example/13e60d32-77a6-4239-864d-cfe2c90807c8';
  expect(agent.registrySet).toBeInstanceOf(ReadableRegistrySet);
  expect(agent.registrySet.iri).toBe(registrySetIri);
});

test('have access to all the access consents', async () => {
  const agent = await AuthorizationAgent.build(webId, agentId, { fetch: fetch as WhatwgFetch, randomUUID });
  let count = 0;
  for await (const consent of agent.accessConsents) {
    count += 1;
    expect(consent).toBeInstanceOf(ReadableAccessConsent);
  }
  expect(count).toBe(2);
});

test('have access to all the application registrations', async () => {
  const agent = await AuthorizationAgent.build(webId, agentId, { fetch: fetch as WhatwgFetch, randomUUID });
  let count = 0;
  for await (const consent of agent.applicationRegistrations) {
    count += 1;
    expect(consent).toBeInstanceOf(ReadableApplicationRegistration);
  }
  expect(count).toBe(2);
});

test('have access to all the social agent registrations', async () => {
  const agent = await AuthorizationAgent.build(webId, agentId, { fetch: fetch as WhatwgFetch, randomUUID });
  let count = 0;
  for await (const consent of agent.socialAgentRegistrations) {
    count += 1;
    expect(consent).toBeInstanceOf(ReadableSocialAgentRegistration);
  }
  expect(count).toBe(2);
});
