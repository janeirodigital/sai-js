import { randomUUID } from 'crypto';
// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
// eslint-disable-next-line import/no-extraneous-dependencies
import { statelessFetch, createStatefulFetch } from '@janeirodigital/interop-test-utils';
import {
  CRUDRegistrySet,
  ReadableAccessConsent,
  CRUDApplicationRegistration,
  CRUDSocialAgentRegistration
} from '@janeirodigital/interop-data-model';
import { ACL, INTEROP } from '@janeirodigital/interop-namespaces';
import { AuthorizationAgent } from '../src';

const webId = 'https://alice.example/#id';
const agentId = 'https://alice.jarvis.example/#agent';

test('should build registrySet', async () => {
  const agent = await AuthorizationAgent.build(webId, agentId, { fetch: statelessFetch, randomUUID });
  const registrySetIri = 'https://auth.alice.example/13e60d32-77a6-4239-864d-cfe2c90807c8';
  expect(agent.registrySet).toBeInstanceOf(CRUDRegistrySet);
  expect(agent.registrySet.iri).toBe(registrySetIri);
});

test('have access to all the access consents', async () => {
  const agent = await AuthorizationAgent.build(webId, agentId, { fetch: statelessFetch, randomUUID });
  let count = 0;
  for await (const consent of agent.accessConsents) {
    count += 1;
    expect(consent).toBeInstanceOf(ReadableAccessConsent);
  }
  expect(count).toBe(2);
});

test('have access to all the application registrations', async () => {
  const agent = await AuthorizationAgent.build(webId, agentId, { fetch: statelessFetch, randomUUID });
  let count = 0;
  for await (const consent of agent.applicationRegistrations) {
    count += 1;
    expect(consent).toBeInstanceOf(CRUDApplicationRegistration);
  }
  expect(count).toBe(2);
});

test('have access to all the social agent registrations', async () => {
  const agent = await AuthorizationAgent.build(webId, agentId, { fetch: statelessFetch, randomUUID });
  let count = 0;
  for await (const consent of agent.socialAgentRegistrations) {
    count += 1;
    expect(consent).toBeInstanceOf(CRUDSocialAgentRegistration);
  }
  expect(count).toBe(2);
});

describe('recordAccessConsent', () => {
  const accessConsentData = {
    grantedBy: webId,
    grantedWith: agentId,
    grantee: 'https://acme.example/#corp',
    hasAccessNeedGroup: 'https://projectron.example/#some-access-group'
  };
  const validDataConsetData = {
    grantee: 'https://acme.example/#corp',
    registeredShapeTree: 'https://solidshapes.example/tree/Project',
    dataOwner: 'https://omni.example/#corp',
    accessMode: [ACL.Read.value],
    scopeOfConsent: INTEROP.AllFromAgent.value
  };
  const invalidDataConsentData = {
    grantee: 'https://acme.example/#corp',
    registeredShapeTree: 'https://solidshapes.example/tree/Project',
    dataOwner: 'https://acme.example/#corp',
    accessMode: [ACL.Read.value],
    scopeOfConsent: INTEROP.AllFromAgent.value
  };

  let agent: AuthorizationAgent;

  beforeEach(async () => {
    const statefulFetch = createStatefulFetch();
    agent = await AuthorizationAgent.build(webId, agentId, { fetch: statefulFetch, randomUUID });
  });

  test('should filter out data consents where grantee is the same as owner', async () => {
    const dataConsentsData = [validDataConsetData, invalidDataConsentData];

    const accessConsent = await agent.recordAccessConsent({ dataConsents: dataConsentsData, ...accessConsentData });
    for await (const dataConsent of accessConsent.dataConsents) {
      expect(dataConsent.grantee).not.toBe(dataConsent.dataOwner);
    }
  });

  test('should link to new access consent from access consent registry', async () => {
    const accessConsent = await agent.recordAccessConsent({
      dataConsents: [validDataConsetData],
      ...accessConsentData
    });
    const registry = await agent.factory.crud.accessConsentRegistry(agent.registrySet.hasAccessConsentRegistry.iri);
    let matched;
    for await (const consent of registry.accessConsents) {
      if (consent.iri === accessConsent.iri) {
        matched = true;
      }
    }
    expect(matched).toBeTruthy();
  });
});

describe('generateAccessGrant', () => {
  test('should call keept the same access grant if nothing changed', async () => {
    const statefulFetch = createStatefulFetch();
    const accessConsentIri = 'https://auth.alice.example/eac2c39c-c8b3-4880-8b9f-a3e12f7f6372';
    const agent = await AuthorizationAgent.build(webId, agentId, { fetch: statefulFetch, randomUUID });
    const registeredAgentIri = 'https://projectron.example/#app';
    const agentRegistration = await agent.registrySet.hasAgentRegistry.findRegistration(registeredAgentIri);
    await agent.generateAccessGrant(accessConsentIri, agentRegistration);
    const updatedAgentRegistration = await agent.registrySet.hasAgentRegistry.findRegistration(registeredAgentIri);
    expect(updatedAgentRegistration.hasAccessGrant).toBe(agentRegistration.hasAccessGrant);
  });
  test('should throw if agent registartion is not for consent grantee', async () => {
    const accessConsentIri = 'https://auth.alice.example/eac2c39c-c8b3-4880-8b9f-a3e12f7f6372';
    const agent = await AuthorizationAgent.build(webId, agentId, { fetch: statelessFetch, randomUUID });
    const otherAgentIri = 'https://performchart.example/#app';
    const agentRegistration = await agent.registrySet.hasAgentRegistry.findRegistration(otherAgentIri);
    await expect(() => agent.generateAccessGrant(accessConsentIri, agentRegistration)).rejects.toThrow(
      'agent registration has to be for the consent grantee'
    );
  });
});

describe('updateDelegatedGrant', () => {
  test('should generateAccessGrant for each affected access consent', async () => {
    const statefulFetch = createStatefulFetch();
    const agent = await AuthorizationAgent.build(webId, agentId, { fetch: statefulFetch, randomUUID });
    const generateAccessGrantSpy = jest.spyOn(agent, 'generateAccessGrant');
    const dataOwnerIri = 'https://omni.example/#corp';
    const dataOwnerRegistration = (await agent.registrySet.hasAgentRegistry.findRegistration(
      dataOwnerIri
    )) as CRUDSocialAgentRegistration;
    await agent.updateDelegatedGrants(dataOwnerRegistration);
    expect(generateAccessGrantSpy).toBeCalledTimes(2);
  });
});
