import { randomUUID } from 'crypto';
// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
// eslint-disable-next-line import/no-extraneous-dependencies
import { statelessFetch, createStatefulFetch } from '@janeirodigital/interop-test-utils';
import {
  CRUDRegistrySet,
  ReadableAccessAuthorization,
  CRUDApplicationRegistration,
  CRUDSocialAgentRegistration,
  ReadableWebIdProfile
} from '@janeirodigital/interop-data-model';
import { ACL, INTEROP } from '@janeirodigital/interop-namespaces';
import { AuthorizationAgent, GrantedAuthorization } from '../src';

const webId = 'https://alice.example/#id';
const agentId = 'https://alice.jarvis.example/#agent';

test('should build webIdProfile', async () => {
  const agent = await AuthorizationAgent.build(webId, agentId, { fetch: statelessFetch, randomUUID });
  expect(agent.webIdProfile).toBeInstanceOf(ReadableWebIdProfile);
  expect(agent.webIdProfile.iri).toBe(webId);
});

test('should build registrySet', async () => {
  const agent = await AuthorizationAgent.build(webId, agentId, { fetch: statelessFetch, randomUUID });
  const registrySetIri = 'https://auth.alice.example/13e60d32-77a6-4239-864d-cfe2c90807c8';
  expect(agent.registrySet).toBeInstanceOf(CRUDRegistrySet);
  expect(agent.registrySet.iri).toBe(registrySetIri);
});

test('have access to all the access authorizations', async () => {
  const agent = await AuthorizationAgent.build(webId, agentId, { fetch: statelessFetch, randomUUID });
  let count = 0;
  for await (const authorization of agent.accessAuthorizations) {
    count += 1;
    expect(authorization).toBeInstanceOf(ReadableAccessAuthorization);
  }
  expect(count).toBe(2);
});

test('have access to all the application registrations', async () => {
  const agent = await AuthorizationAgent.build(webId, agentId, { fetch: statelessFetch, randomUUID });
  let count = 0;
  for await (const authorization of agent.applicationRegistrations) {
    count += 1;
    expect(authorization).toBeInstanceOf(CRUDApplicationRegistration);
  }
  expect(count).toBe(2);
});

test('should provide shortcut to find application registratons', async () => {
  const agent = await AuthorizationAgent.build(webId, agentId, { fetch: statelessFetch, randomUUID });
  const spy = jest.spyOn(agent.registrySet.hasAgentRegistry, 'findApplicationRegistration');
  const iri = 'https://projectron.example/#app';
  await agent.findApplicationRegistration(iri);
  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(iri);
});

test('have access to all the social agent registrations', async () => {
  const agent = await AuthorizationAgent.build(webId, agentId, { fetch: statelessFetch, randomUUID });
  let count = 0;
  for await (const authorization of agent.socialAgentRegistrations) {
    count += 1;
    expect(authorization).toBeInstanceOf(CRUDSocialAgentRegistration);
  }
  expect(count).toBe(2);
});

test('should provide shortcut to find social agent registratons', async () => {
  const agent = await AuthorizationAgent.build(webId, agentId, { fetch: statelessFetch, randomUUID });
  const spy = jest.spyOn(agent.registrySet.hasAgentRegistry, 'findSocialAgentRegistration');
  const iri = 'https://alice.example/#id';
  await agent.findSocialAgentRegistration(iri);
  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(iri);
});

describe('recordAccessAuthorization', () => {
  const accessAuthorizationData = {
    granted: true as true,
    grantedBy: webId,
    grantedWith: agentId,
    grantee: 'https://acme.example/#corp',
    hasAccessNeedGroup: 'https://projectron.example/#some-access-group'
  };
  const validDataAuthorizationData = {
    grantee: 'https://acme.example/#corp',
    grantedBy: webId,
    registeredShapeTree: 'https://solidshapes.example/tree/Project',
    dataOwner: 'https://omni.example/#corp',
    accessMode: [ACL.Read.value],
    scopeOfAuthorization: INTEROP.AllFromAgent.value,
    children: [
      {
        grantee: 'https://acme.example/#corp',
        grantedBy: webId,
        registeredShapeTree: 'https://solidshapes.example/tree/Task',
        dataOwner: 'https://omni.example/#corp',
        accessMode: [ACL.Read.value],
        scopeOfAuthorization: INTEROP.Inherited.value
      }
    ]
  };
  const invalidDataAuthorizationData = {
    grantee: 'https://acme.example/#corp',
    grantedBy: webId,
    registeredShapeTree: 'https://solidshapes.example/tree/Project',
    dataOwner: 'https://acme.example/#corp',
    accessMode: [ACL.Read.value],
    scopeOfAuthorization: INTEROP.AllFromAgent.value
  };

  let agent: AuthorizationAgent;

  beforeEach(async () => {
    const statefulFetch = createStatefulFetch();
    agent = await AuthorizationAgent.build(webId, agentId, { fetch: statefulFetch, randomUUID });
  });

  test('should filter out data authorizations where grantee is the same as owner', async () => {
    const dataAuthorizationsData = [validDataAuthorizationData, invalidDataAuthorizationData];

    const accessAuthorization = await agent.recordAccessAuthorization({
      dataAuthorizations: dataAuthorizationsData,
      ...accessAuthorizationData
    });
    for await (const dataAuthorization of accessAuthorization.dataAuthorizations) {
      expect(dataAuthorization.grantee).not.toBe(dataAuthorization.dataOwner);
    }
  });

  // TODO add PATCH support to the stateful fetch first
  test.skip('should link to new access authorization from access authorization registry', async () => {
    const accessAuthorization = await agent.recordAccessAuthorization({
      dataAuthorizations: [validDataAuthorizationData],
      ...accessAuthorizationData
    });
    const registry = await agent.factory.crud.authorizationRegistry(agent.registrySet.hasAuthorizationRegistry.iri);
    let matched;
    for await (const authorization of registry.accessAuthorizations) {
      if (authorization.iri === accessAuthorization.iri) {
        matched = true;
      }
    }
    expect(matched).toBeTruthy();
  });
});

describe('generateAccessGrant', () => {
  test('should call keept the same access grant if nothing changed', async () => {
    const statefulFetch = createStatefulFetch();
    const accessAuthorizationIri = 'https://auth.alice.example/eac2c39c-c8b3-4880-8b9f-a3e12f7f6372';
    const agent = await AuthorizationAgent.build(webId, agentId, { fetch: statefulFetch, randomUUID });
    const registeredAgentIri = 'https://projectron.example/#app';
    const agentRegistration = await agent.registrySet.hasAgentRegistry.findRegistration(registeredAgentIri);
    await agent.generateAccessGrant(accessAuthorizationIri);
    const updatedAgentRegistration = await agent.registrySet.hasAgentRegistry.findRegistration(registeredAgentIri);
    expect(updatedAgentRegistration.hasAccessGrant).toBe(agentRegistration.hasAccessGrant);
  });
  test('should throw if agent registartion for the grantee does not exist', async () => {
    const accessAuthorizationIri = 'https://auth.alice.example/0d12477a-a5ce-4b59-ab48-8be505ccd64c';
    const agent = await AuthorizationAgent.build(webId, agentId, { fetch: statelessFetch, randomUUID });
    await expect(() => agent.generateAccessGrant(accessAuthorizationIri)).rejects.toThrow(
      'agent registration for the grantee does not exist'
    );
  });
});

describe('updateDelegatedGrant', () => {
  test('should generateAccessGrant for each affected access authorization', async () => {
    const statefulFetch = createStatefulFetch();
    const agent = await AuthorizationAgent.build(webId, agentId, { fetch: statefulFetch, randomUUID });
    const generateAccessGrantSpy = jest.spyOn(agent, 'generateAccessGrant');
    const dataOwnerIri = 'https://omni.example/#corp';
    await agent.updateDelegatedGrants(dataOwnerIri);
    expect(generateAccessGrantSpy).toBeCalledTimes(2);
  });
});
