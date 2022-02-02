// eslint-disable-next-line import/no-extraneous-dependencies
import 'jest-rdf';
// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { INTEROP } from '@janeirodigital/interop-namespaces';
import { getAllMatchingQuads, getOneMatchingQuad } from '@janeirodigital/interop-utils';
import { DataFactory } from 'n3';
import { randomUUID } from 'crypto';
import { AuthorizationAgentFactory, DataGrant, ImmutableDataGrant } from '../../src';

const webId = 'https://alice.example/#id';
const agentId = 'https://jarvis.alice.example/#agent';
const factory = new AuthorizationAgentFactory(webId, agentId, { fetch, randomUUID });
const registrySetIri = 'https://auth.alice.example/13e60d32-77a6-4239-864d-cfe2c90807c8';
const granteeRegistrationIri = 'https://auth.alice.example/5dc3c14e-7830-475f-b8e3-4748d6c0bccb';

describe('getters', () => {
  test('should provide hasDataInstance', async () => {
    const selectedDataConsentIri = 'https://auth.alice.example/bee6bc10-2eb9-4b2d-b0c4-84c5d9039e53';
    const dataConsent = await factory.readable.dataConsent(selectedDataConsentIri);
    expect(dataConsent.hasDataInstance).toHaveLength(2);
  });
});

describe('generateSourceDataGrants', () => {
  test('should generate equivalent grants', async () => {
    const dataConsentIri = 'https://auth.alice.example/a691ee69-97d8-45c0-bb03-8e887b2db806';
    const registrySet = await factory.crud.registrySet(registrySetIri);
    const granteeRegistration = await factory.crud.socialAgentRegistration(granteeRegistrationIri);
    const dataConsent = await factory.readable.dataConsent(dataConsentIri);
    // @ts-ignore
    const sourceGrants = await dataConsent.generateSourceDataGrants(registrySet.hasDataRegistry, granteeRegistration);
    const equivalentDataGrants = await Promise.all(
      [
        'https://auth.alice.example/067f19a8-1c9c-4b60-adde-c22d8e8e3814',
        'https://auth.alice.example/d738e710-b06e-4ab6-9159-ee0d7d603402',
        'https://auth.alice.example/5dd87c6d-c352-41e5-a79c-6ae71bb20287',
        'https://auth.alice.example/a723a19f-2275-41bf-a556-e6ae4fe880a8'
      ].map((iri) => factory.readable.dataGrant(iri))
    );
    for (const sourceGrant of sourceGrants) {
      const equivalent =
        sourceGrants.length === equivalentDataGrants.length &&
        equivalentDataGrants.some((equivalentGrant) => sourceGrant.checkEquivalence(equivalentGrant));

      expect(equivalent).toBeTruthy();
    }
  });

  test('should throw if called on consent with Inherited scope', async () => {
    const inheritedDataConsentIri = 'https://auth.alice.example/ecdf7b5e-5123-4a93-87bc-86ef6de389ff';
    const registrySet = await factory.crud.registrySet(registrySetIri);
    const granteeRegistration = await factory.crud.socialAgentRegistration(granteeRegistrationIri);
    const dataConsent = await factory.readable.dataConsent(inheritedDataConsentIri);
    await expect(
      // @ts-ignore
      dataConsent.generateSourceDataGrants(registrySet.hasDataRegistry, granteeRegistration)
    ).rejects.toThrow('this method should not be callend on data consents with Inherited scope');
  });

  test('should generate source data grant for specific data registration', async () => {
    const allFromRegistryDataConsentIri = 'https://auth.alice.example/d246d4da-79d9-4232-b5ab-94282cd0a63b';
    const registrySet = await factory.crud.registrySet(registrySetIri);
    const granteeRegistration = await factory.crud.socialAgentRegistration(granteeRegistrationIri);
    const dataConsent = await factory.readable.dataConsent(allFromRegistryDataConsentIri);
    // @ts-ignore
    const dataGrants = await dataConsent.generateSourceDataGrants(registrySet.hasDataRegistry, granteeRegistration);
    expect(dataGrants).toHaveLength(1);
  });

  test('should generate source data grant for specific data instances', async () => {
    const selectedFromRegistryDataConsentIri = 'https://auth.alice.example/8307e5b4-4fd6-4e76-99bf-64df6a7d2894';
    const registrySet = await factory.crud.registrySet(registrySetIri);
    const granteeRegistration = await factory.crud.socialAgentRegistration(granteeRegistrationIri);
    const dataConsent = await factory.readable.dataConsent(selectedFromRegistryDataConsentIri);
    // @ts-ignore
    const dataGrants = await dataConsent.generateSourceDataGrants(registrySet.hasDataRegistry, granteeRegistration);
    expect(dataGrants).toHaveLength(1);
    const dataGrant = dataGrants[0];
    const dataInstances = getAllMatchingQuads(
      dataGrant.dataset,
      DataFactory.namedNode(dataGrant.iri),
      INTEROP.hasDataInstance
    );
    expect(dataInstances).toHaveLength(1);
  });
});

describe('generateDelegatedDataGrants', () => {
  test('should generate equivalent grants', async () => {
    const dataConsentIri = 'https://auth.alice.example/e2765d6c-848a-4fc0-9092-556903730263';
    const registrySet = await factory.crud.registrySet(registrySetIri);
    const granteeRegistration = await factory.crud.socialAgentRegistration(granteeRegistrationIri);
    const dataConsent = await factory.readable.dataConsent(dataConsentIri);
    // @ts-ignore
    const delegatedGrants = await dataConsent.generateDelegatedDataGrants(
      registrySet.hasAgentRegistry,
      granteeRegistration
    );
    const equivalentDataGrants = await Promise.all(
      [
        'https://auth.alice.example/12daf870-a343-4684-b828-c67c5c9c997a',
        'https://auth.alice.example/7be5a39f-583d-4464-8ad8-a39e24b99fce',
        'https://auth.alice.example/c205e9da-2dc5-4d1f-8be9-a3f90c13eedc',
        'https://auth.alice.example/68dd1212-b0f3-4611-aae2-f9f5ea30ee07'
      ].map((iri) => factory.readable.dataGrant(iri))
    );
    for (const delegatedGrant of delegatedGrants) {
      const equivalent =
        delegatedGrants.length === equivalentDataGrants.length &&
        equivalentDataGrants.some((equivalentGrant) => delegatedGrant.checkEquivalence(equivalentGrant));

      expect(equivalent).toBeTruthy();
    }
  });

  test('should throw if called on consent with Inherited scope', async () => {
    const inheritedDataConsentIri = 'https://auth.alice.example/6a9feb57-252b-43b2-8470-5a938888b2fa';
    const acmeRegistrationIri = 'https://auth.alice.example/5dc3c14e-7830-475f-b8e3-4748d6c0bccb';
    const registrySet = await factory.crud.registrySet(registrySetIri);
    const granteeRegistration = await factory.crud.socialAgentRegistration(acmeRegistrationIri);
    const dataConsent = await factory.readable.dataConsent(inheritedDataConsentIri);
    await expect(
      // @ts-ignore
      dataConsent.generateDelegatedDataGrants(registrySet.hasAgentRegistry, granteeRegistration)
    ).rejects.toThrow('this method should not be callend on data consents with Inherited scope');
  });

  test('should not generate delegated data grant for data owner themselve', async () => {
    const allDataConsentIri = 'https://auth.alice.example/9ac499ce-f1a2-44c2-a5fb-01e3eb9a5bc9';
    const registrySet = await factory.crud.registrySet(registrySetIri);
    const granteeRegistration = await factory.crud.socialAgentRegistration(granteeRegistrationIri);
    const dataConsent = await factory.readable.dataConsent(allDataConsentIri);
    // @ts-ignore
    const dataGrants = await dataConsent.generateDelegatedDataGrants(registrySet.hasAgentRegistry, granteeRegistration);
    expect(dataGrants).toHaveLength(0);
  });
  test('should generate source data grant for specific data registration', async () => {
    const allFromRegistryDataConsentIri = 'https://auth.alice.example/dbad38a1-4f99-4cd3-9107-23743a4059a8';
    const registrySet = await factory.crud.registrySet(registrySetIri);
    const someAppRegistrationIri = 'https://auth.alice.example/d1c1ad91-406a-4d14-99cf-db770785440c';
    const granteeRegistration = await factory.crud.socialAgentRegistration(someAppRegistrationIri);
    const dataConsent = await factory.readable.dataConsent(allFromRegistryDataConsentIri);
    // @ts-ignore
    const dataGrants = await dataConsent.generateDelegatedDataGrants(registrySet.hasAgentRegistry, granteeRegistration);
    expect(dataGrants).toHaveLength(1);
  });
});
