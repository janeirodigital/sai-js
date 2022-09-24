// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { randomUUID } from 'crypto';
import { CRUDSocialAgentRegistration, CRUDApplicationRegistration, AuthorizationAgentFactory } from '../../src';

const webId = 'https://alice.example/#id';
const agentId = 'https://jarvis.alice.example/#agent';
const factory = new AuthorizationAgentFactory(webId, agentId, { fetch, randomUUID });
const snippetIri = 'https://auth.alice.example/1cf3e08b-ffe2-465a-ac5b-94ce165cb8f0';

test('should provide applicationRegistrations', async () => {
  const registry = await factory.crud.agentRegistry(snippetIri);
  let count = 0;
  for await (const authorization of registry.applicationRegistrations) {
    count += 1;
    expect(authorization).toBeInstanceOf(CRUDApplicationRegistration);
  }
  expect(count).toBe(2);
});

test('should provide socialAgentRegistrations', async () => {
  const registry = await factory.crud.agentRegistry(snippetIri);
  let count = 0;
  for await (const authorization of registry.socialAgentRegistrations) {
    count += 1;
    expect(authorization).toBeInstanceOf(CRUDSocialAgentRegistration);
  }
  expect(count).toBe(2);
});

describe('findApplicationRegistration', () => {
  test('finds application registration', async () => {
    const applicationIri = 'https://projectron.example/#app';
    const registry = await factory.crud.agentRegistry(snippetIri);
    expect(await registry.findApplicationRegistration(applicationIri)).toBeInstanceOf(CRUDApplicationRegistration);
  });
});

describe('findSocialRegistration', () => {
  test('finds social agent registration', async () => {
    const socialAgentIri = 'https://acme.example/#corp';
    const registry = await factory.crud.agentRegistry(snippetIri);
    expect(await registry.findSocialAgentRegistration(socialAgentIri)).toBeInstanceOf(CRUDSocialAgentRegistration);
  });
});

describe('findRegistration', () => {
  test('finds application registration', async () => {
    const applicationIri = 'https://projectron.example/#app';
    const registry = await factory.crud.agentRegistry(snippetIri);
    expect(await registry.findRegistration(applicationIri)).toBeInstanceOf(CRUDApplicationRegistration);
  });

  test('finds social agent registration', async () => {
    const socialAgentIri = 'https://acme.example/#corp';
    const registry = await factory.crud.agentRegistry(snippetIri);
    expect(await registry.findRegistration(socialAgentIri)).toBeInstanceOf(CRUDSocialAgentRegistration);
  });
});

describe('addSocialAgentRegistration', () => {
  test.skip('returns added registration', async () => {
    const jane = 'https://jane.example';
    const registry = await factory.crud.agentRegistry(snippetIri);
    const registration = await registry.addSocialAgentRegistration(jane, 'Jane');
    expect(registration.registeredAgent).toBe(jane);
  });
  test.todo('local datasets updates with hasSocialAgentRegistration statement');
});

describe('addApplicationRegistration', () => {
  test.skip('returns added registration', async () => {
    const gigaApp = 'https://gigaApp.example';
    const registry = await factory.crud.agentRegistry(snippetIri);
    const registration = await registry.addApplicationRegistration(gigaApp);
    expect(registration.registeredAgent).toBe(gigaApp);
  });
  test.todo('local datasets updates with hasApplicationRegistration statement');
});
