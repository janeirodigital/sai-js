// eslint-disable-next-line import/no-extraneous-dependencies
import 'jest-rdf';
// eslint-disable-next-line import/no-extraneous-dependencies
import { fetch } from '@janeirodigital/interop-test-utils';
import { INTEROP } from '@janeirodigital/interop-namespaces';
import { getAllMatchingQuads, getOneMatchingQuad } from '@janeirodigital/interop-utils';
import { DataFactory } from 'n3';
import { randomUUID } from 'crypto';
import { AuthorizationAgentFactory, DataGrant, ImmutableDataGrant } from '../../src';

const factory = new AuthorizationAgentFactory({ fetch, randomUUID });
const registrySetIri = 'https://auth.alice.example/13e60d32-77a6-4239-864d-cfe2c90807c8';

function compareGrants(generatedGrant: ImmutableDataGrant, equivalentGrant: DataGrant): boolean {
  const predicates = [
    INTEROP.dataOwner,
    INTEROP.registeredShapeTree,
    INTEROP.hasDataRegistration,
    INTEROP.scopeOfGrant
  ];
  for (const predicate of predicates) {
    const generatedObject = getOneMatchingQuad(
      generatedGrant.dataset,
      DataFactory.namedNode(generatedGrant.iri),
      predicate
    ).object;
    const equivalentObject = getOneMatchingQuad(
      equivalentGrant.dataset,
      DataFactory.namedNode(equivalentGrant.iri),
      predicate
    ).object;
    if (generatedObject.value !== equivalentObject.value) return false;
  }
  const generatedAccessModes = getAllMatchingQuads(
    generatedGrant.dataset,
    DataFactory.namedNode(generatedGrant.iri),
    INTEROP.accessMode
  ).map((quad) => quad.object.value);
  const equivalentAccessModes = getAllMatchingQuads(
    equivalentGrant.dataset,
    DataFactory.namedNode(equivalentGrant.iri),
    INTEROP.accessMode
  ).map((quad) => quad.object.value);

  return (
    generatedAccessModes.length === equivalentAccessModes.length &&
    generatedAccessModes.every((mode) => equivalentAccessModes.includes(mode))
  );
}

test('generateSourceDataGrants', async () => {
  const dataConsentIri = 'https://auth.alice.example/a691ee69-97d8-45c0-bb03-8e887b2db806';
  const registrySet = await factory.readable.registrySet(registrySetIri);
  const dataConsent = await factory.readable.dataConsent(dataConsentIri);
  const sourceGrants = await dataConsent.generateSourceDataGrants(registrySet.hasDataRegistry);
  // 'https://auth.alice.example/5dd87c6d-c352-41e5-a79c-6ae71bb20287',
  // 'https://auth.alice.example/a723a19f-2275-41bf-a556-e6ae4fe880a8',
  const equivalentDataGrants = await Promise.all(
    [
      'https://auth.alice.example/067f19a8-1c9c-4b60-adde-c22d8e8e3814',
      'https://auth.alice.example/d738e710-b06e-4ab6-9159-ee0d7d603402'
    ].map((iri) => factory.readable.dataGrant(iri))
  );
  for (const sourceGrant of sourceGrants) {
    const equivalent =
      sourceGrants.length === equivalentDataGrants.length &&
      equivalentDataGrants.some((equivalentGrant) => compareGrants(sourceGrant, equivalentGrant));
    // TODO convert compareGrants function into custom matcher
    expect(equivalent).toBeTruthy();
  }
});

test('generateDelegatedDataGrants', async () => {
  const dataConsentIri = 'https://auth.alice.example/e2765d6c-848a-4fc0-9092-556903730263';
  const registrySet = await factory.readable.registrySet(registrySetIri);
  const dataConsent = await factory.readable.dataConsent(dataConsentIri);
  const delegatedGrants = await dataConsent.generateDelegatedDataGrants(registrySet.hasAgentRegistry);
  // 'https://auth.alice.example/c205e9da-2dc5-4d1f-8be9-a3f90c13eedc',
  // 'https://auth.alice.example/68dd1212-b0f3-4611-aae2-f9f5ea30ee07',
  const equivalentDataGrants = await Promise.all(
    [
      'https://auth.alice.example/12daf870-a343-4684-b828-c67c5c9c997a',
      'https://auth.alice.example/7be5a39f-583d-4464-8ad8-a39e24b99fce'
    ].map((iri) => factory.readable.dataGrant(iri))
  );
  for (const delegatedGrant of delegatedGrants) {
    const equivalent =
      delegatedGrants.length === equivalentDataGrants.length &&
      equivalentDataGrants.some((equivalentGrant) => compareGrants(delegatedGrant, equivalentGrant));
    // TODO convert compareGrants function into custom matcher
    expect(equivalent).toBeTruthy();
  }
});
