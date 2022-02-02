// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { randomUUID } from 'crypto';
import {
  ReadableDataConsent,
  AuthorizationAgentFactory,
  ImmutableAccessGrant,
  CRUDApplicationRegistration,
  CRUDSocialAgentRegistration
} from '../../src';

const webId = 'https://alice.example/#id';
const agentId = 'https://jarvis.alice.example/#agent';
const factory = new AuthorizationAgentFactory(webId, agentId, { fetch, randomUUID });
const snippetIri = 'https://auth.alice.example/eac2c39c-c8b3-4880-8b9f-a3e12f7f6372';

describe('getters', () => {
  test('should provide dataConsents', async () => {
    const accessConsent = await factory.readable.accessConsent(snippetIri);
    let count = 0;
    for await (const consent of accessConsent.dataConsents) {
      count += 1;
      expect(consent).toBeInstanceOf(ReadableDataConsent);
    }
    expect(count).toBe(4);
  });

  test('should provide grantedBy', async () => {
    const accessConsent = await factory.readable.accessConsent(snippetIri);
    expect(accessConsent.grantedBy).toBe('https://alice.example/#id');
  });

  test('should provide grantee', async () => {
    const accessConsent = await factory.readable.accessConsent(snippetIri);
    expect(accessConsent.grantee).toBe('https://projectron.example/#app');
  });
});

describe('generateAccessGrant', () => {
  test('generates access grant for application', async () => {
    const accessConsent = await factory.readable.accessConsent(snippetIri);
    const registrySetIri = 'https://auth.alice.example/13e60d32-77a6-4239-864d-cfe2c90807c8';
    const registrySet = await factory.readable.registrySet(registrySetIri);
    const agentRegistration = (await registrySet.hasAgentRegistry.findRegistration(
      accessConsent.grantee
    )) as CRUDApplicationRegistration;
    const accessGrant = await accessConsent.generateAccessGrant(
      registrySet.hasDataRegistry,
      registrySet.hasAgentRegistry,
      agentRegistration
    );
    expect(accessGrant).toBeInstanceOf(ImmutableAccessGrant);
  });
  test('uses new data grants if equivalent does not exists', async () => {
    const accessConsent = await factory.readable.accessConsent(snippetIri);
    const registrySetIri = 'https://auth.alice.example/13e60d32-77a6-4239-864d-cfe2c90807c8';
    const registrySet = await factory.readable.registrySet(registrySetIri);
    const agentRegistration = (await registrySet.hasAgentRegistry.findRegistration(
      accessConsent.grantee
    )) as CRUDApplicationRegistration;
    // remove all of existing data grants
    // TODO improve snippets for this test
    agentRegistration.accessGrant.hasDataGrant = [];
    const accessGrant = await accessConsent.generateAccessGrant(
      registrySet.hasDataRegistry,
      registrySet.hasAgentRegistry,
      agentRegistration
    );
    expect(accessGrant).toBeInstanceOf(ImmutableAccessGrant);
    expect(accessGrant.dataGrants).toHaveLength(4);
  });
  test('generates access grant for social agent', async () => {
    const consentForSocialAgentIri = 'https://auth.alice.example/75a2ef88-d4d4-4f05-af1e-c2a63af08cab';
    const accessConsent = await factory.readable.accessConsent(consentForSocialAgentIri);
    const registrySetIri = 'https://auth.alice.example/13e60d32-77a6-4239-864d-cfe2c90807c8';
    const registrySet = await factory.readable.registrySet(registrySetIri);
    const agentRegistration = (await registrySet.hasAgentRegistry.findRegistration(
      accessConsent.grantee
    )) as CRUDSocialAgentRegistration;
    const accessGrant = await accessConsent.generateAccessGrant(
      registrySet.hasDataRegistry,
      registrySet.hasAgentRegistry,
      agentRegistration
    );
    expect(accessGrant).toBeInstanceOf(ImmutableAccessGrant);
  });
});
