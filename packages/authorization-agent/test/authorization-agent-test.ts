import { randomUUID } from 'crypto';
// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import {
  ReadableRegistrySet,
  ReadableAccessConsent,
  ReadableApplicationRegistration,
  ReadableSocialAgentRegistration,
  ImmutableDataConsent,
  ImmutableAccessConsent,
  ImmutableAccessGrant,
  DataConsentData,
  AccessConsentData
} from '@janeirodigital/interop-data-model';
import { WhatwgFetch } from '@janeirodigital/interop-utils';
import { AuthorizationAgent } from '../src';
import { ACL, INTEROP } from '@janeirodigital/interop-namespaces';
import { Mock, SpyInstance } from 'jest-mock';

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

describe('recordAccessConsent', () => {
  const accessConsentData = {
    registeredBy: webId,
    registeredWith: agentId,
    registeredAgent: 'https://acme.example/#corp',
    hasAccessNeedGroup: 'https://projectron.example/#some-access-group'
  };
  const validDataConsetData = {
    registeredAgent: 'https://acme.example/#corp',
    registeredShapeTree: 'https://solidshapes.example/tree/Project',
    dataOwner: 'https://omni.example/#corp',
    accessMode: [ACL.Read.value],
    scopeOfConsent: INTEROP.AllFromAgent
  };
  const invalidDataConsentData = {
    registeredAgent: 'https://acme.example/#corp',
    registeredShapeTree: 'https://solidshapes.example/tree/Project',
    dataOwner: 'https://acme.example/#corp',
    accessMode: [ACL.Read.value],
    scopeOfConsent: INTEROP.AllFromAgent
  };

  let agent: AuthorizationAgent,
    dataConsentSpy: SpyInstance<ImmutableDataConsent, [iri: string, data: DataConsentData]>,
    accessConsentSpy: SpyInstance<ImmutableAccessConsent, [iri: string, data: AccessConsentData]>;

  beforeEach(async () => {
    agent = await AuthorizationAgent.build(webId, agentId, { fetch: fetch as WhatwgFetch, randomUUID });
    dataConsentSpy = jest.spyOn(agent.factory.immutable, 'dataConsent');
    accessConsentSpy = jest.spyOn(agent.factory.immutable, 'accessConsent');
  });

  test('should filter out data consents where grantee is the same as owner', async () => {
    const dataConsentsData = [validDataConsetData, invalidDataConsentData];

    await expect(agent.recordAccessConsent({ dataConsents: dataConsentsData, ...accessConsentData })).rejects.toThrow();
  });

  test('should correctly call immutable access consent factory', async () => {
    await expect(
      agent.recordAccessConsent({ dataConsents: [validDataConsetData], ...accessConsentData })
    ).rejects.toThrow();
    expect(accessConsentSpy.mock.calls[0][1]).toMatchObject(accessConsentData);
  });

  test('should call generateAccessGrant, store it and update registration', async () => {
    const storeAccessGrantMock = jest.fn();
    const generateAccessGrantMock = jest.fn(() => ({ store: storeAccessGrantMock }));
    agent.factory.readable.accessConsent = jest.fn(
      (iri) => ({ generateAccessGrant: generateAccessGrantMock } as unknown as Promise<ReadableAccessConsent>)
    );
    await agent.recordAccessConsent({ dataConsents: [validDataConsetData], ...accessConsentData });
    expect(generateAccessGrantMock).toBeCalled();
    expect(storeAccessGrantMock).toBeCalled();
  });
});
