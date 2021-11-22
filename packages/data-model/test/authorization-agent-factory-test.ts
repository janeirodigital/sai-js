import { ACL, INTEROP } from '@janeirodigital/interop-namespaces';
// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { randomUUID } from 'crypto';
import {
  AuthorizationAgentFactory,
  CRUDApplicationRegistration,
  ImmutableAccessConsent,
  ImmutableAccessGrant,
  ImmutableDataConsent,
  ImmutableDataGrant,
  ReadableAccessConsent,
  ReadableAccessConsentRegistry,
  ReadableAgentRegistry,
  ReadableDataConsent,
  ReadableDataRegistry,
  ReadableRegistrySet,
  ReadableSocialAgentRegistration
} from '../src';

const webId = 'https://alice.example/#id';
const agentId = 'https://jarvis.alice.example/#agent';

describe('crud', () => {
  test('builds application registration', async () => {
    const factory = new AuthorizationAgentFactory(webId, agentId, { fetch, randomUUID });
    const applicationRegistrationUrl = 'https://auth.alice.example/bcf22534-0187-4ae4-b88f-fe0f9fa96659';
    const applicationRegistration = await factory.crud.applicationRegistration(applicationRegistrationUrl);
    expect(applicationRegistration).toBeInstanceOf(CRUDApplicationRegistration);
  });
});

describe('immutable', () => {
  describe('data grant', () => {
    const commonData = {
      dataOwner: 'https://alice.example/#id',
      registeredShapeTree: 'https://solidshapes.example/tree/Project',
      hasDataRegistration: 'https://pro.alice.example/123',
      accessMode: [ACL.Read.value]
    };

    test('builds AllInstances data grant', async () => {
      const allInstancesData = {
        scopeOfGrant: INTEROP.AllFromRegistry.value,
        ...commonData
      };
      const factory = new AuthorizationAgentFactory(webId, agentId, { fetch, randomUUID });
      const dataGrantIri = 'https://auth.alice.example/7b2bc4ff-b4b8-47b8-96f6-06695f4c5126';
      const dataGrant = factory.immutable.dataGrant(dataGrantIri, allInstancesData);
      expect(dataGrant).toBeInstanceOf(ImmutableDataGrant);
    });

    test('builds SelectedInstances data grant', async () => {
      const selectedInstancesData = {
        scopeOfGrant: INTEROP.SelectedFromRegistry.value,
        ...commonData
      };
      const factory = new AuthorizationAgentFactory(webId, agentId, { fetch, randomUUID });
      const dataGrantIri = 'https://auth.alice.example/cd247a67-0879-4301-abd0-828f63abb252';
      const dataGrant = factory.immutable.dataGrant(dataGrantIri, selectedInstancesData);
      expect(dataGrant).toBeInstanceOf(ImmutableDataGrant);
    });

    test('builds InheritInstances data grant', async () => {
      const inheritnstancesData = {
        scopeOfGrant: INTEROP.Inherited.value,
        ...commonData
      };
      const factory = new AuthorizationAgentFactory(webId, agentId, { fetch, randomUUID });
      const dataGrantIri = 'https://auth.alice.example/9827ae00-2778-4655-9f22-08bb9daaee26';
      const dataGrant = factory.immutable.dataGrant(dataGrantIri, inheritnstancesData);
      expect(dataGrant).toBeInstanceOf(ImmutableDataGrant);
    });
  });

  test('builds Access Grant with Data Grant', async () => {
    const factory = new AuthorizationAgentFactory(webId, agentId, { fetch, randomUUID });
    const dataGrantIri = 'https://auth.alice.example/25b18e05-7f75-4e13-94f6-9950a67a89dd';
    const dataGrant = factory.immutable.dataGrant(dataGrantIri, {
      dataOwner: 'https://acme.example/#corp',
      registeredShapeTree: 'https://solidshapes.example/trees/Project',
      hasDataRegistration: 'https://finance.acme.example/4f3fbf70-49df-47ce-a573-dc54366b01ad',
      accessMode: [ACL.Read.value, ACL.Write.value],
      scopeOfGrant: INTEROP.AllFromRegistry.value
    });
    expect(dataGrant).toBeInstanceOf(ImmutableDataGrant);
    const accessGrantData = {
      registeredBy: webId,
      registeredWith: agentId,
      registeredAgent: 'https://projectron.example/#app',
      hasAccessNeedGroup: 'https://projectron.example/#some-access-group',
      dataGrants: [dataGrant]
    };
    const accessGrantIri = 'https://auth.alice.example/5e8d3d6f-9e61-4e5c-acff-adee83b68ad1';
    const accessGrant = factory.immutable.accessGrant(accessGrantIri, accessGrantData);
    expect(accessGrant).toBeInstanceOf(ImmutableAccessGrant);
  });

  test('builds Access Consent with Data Consent', async () => {
    const factory = new AuthorizationAgentFactory(webId, agentId, { fetch, randomUUID });
    const dataConsentIri = 'https://auth.alice.example/25b18e05-7f75-4e13-94f6-9950a67a89dd';
    const dataConsent = factory.immutable.dataConsent(dataConsentIri, {
      registeredAgent: 'https://projectron.example/#app',
      registeredShapeTree: 'https://solidshapes.example/trees/Project',
      accessMode: [ACL.Read.value, ACL.Write.value],
      scopeOfConsent: INTEROP.All.value
    });
    expect(dataConsent).toBeInstanceOf(ImmutableDataConsent);
    const accessConsentData = {
      registeredBy: webId,
      registeredWith: agentId,
      registeredAgent: 'https://projectron.example/#app',
      hasAccessNeedGroup: 'https://projectron.example/#some-access-group',
      dataConsents: [dataConsent]
    };
    const accessConsentIri = 'https://auth.alice.example/5e8d3d6f-9e61-4e5c-acff-adee83b68ad1';
    const accessConsent = factory.immutable.accessConsent(accessConsentIri, accessConsentData);
    expect(accessConsent).toBeInstanceOf(ImmutableAccessConsent);
  });
});

describe('readable', () => {
  const factory = new AuthorizationAgentFactory(webId, agentId, { fetch, randomUUID });
  test('accessConsent', async () => {
    const snippetIri = 'https://auth.alice.example/eac2c39c-c8b3-4880-8b9f-a3e12f7f6372';
    const accessConsent = await factory.readable.accessConsent(snippetIri);
    expect(accessConsent).toBeInstanceOf(ReadableAccessConsent);
  });

  test('dataConsent', async () => {
    const snippetIri = 'https://auth.alice.example/e2765d6c-848a-4fc0-9092-556903730263';
    const dataConsent = await factory.readable.dataConsent(snippetIri);
    expect(dataConsent).toBeInstanceOf(ReadableDataConsent);
  });
  test('dataRegistry', async () => {
    const snippetIri = 'https://home.alice.example/2d3d97b4-a26d-434e-afa2-e3bc8e8e2b56';
    const dataRegistry = await factory.readable.dataRegistry(snippetIri);
    expect(dataRegistry).toBeInstanceOf(ReadableDataRegistry);
  });
  test('registrySet', async () => {
    const snippetIri = 'https://auth.alice.example/13e60d32-77a6-4239-864d-cfe2c90807c8';
    const registrySet = await factory.readable.registrySet(snippetIri);
    expect(registrySet).toBeInstanceOf(ReadableRegistrySet);
  });
  test('agentRegistry', async () => {
    const snippetIri = 'https://auth.alice.example/1cf3e08b-ffe2-465a-ac5b-94ce165cb8f0';
    const agentRegistry = await factory.readable.agentRegistry(snippetIri);
    expect(agentRegistry).toBeInstanceOf(ReadableAgentRegistry);
  });
  test('accessConsentRegistry', async () => {
    const snippetIri = 'https://auth.alice.example/96feb105-063e-4996-ab74-5e504c6ceae5';
    const accessConsentRegistry = await factory.readable.accessConsentRegistry(snippetIri);
    expect(accessConsentRegistry).toBeInstanceOf(ReadableAccessConsentRegistry);
  });
  test('socialAgentRegistration', async () => {
    const snippetIri = 'https://auth.alice.example/5dc3c14e-7830-475f-b8e3-4748d6c0bccb';
    const socialAgentRegistration = await factory.readable.socialAgentRegistration(snippetIri);
    expect(socialAgentRegistration).toBeInstanceOf(ReadableSocialAgentRegistration);
  });
});
