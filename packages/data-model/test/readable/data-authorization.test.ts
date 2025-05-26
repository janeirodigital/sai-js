import { randomUUID } from 'node:crypto'
import { fetch } from '@janeirodigital/interop-test-utils'
import { INTEROP, getAllMatchingQuads } from '@janeirodigital/interop-utils'
import { DataFactory } from 'n3'
import { describe, test } from 'vitest'
import { AuthorizationAgentFactory } from '../../src'
import { expect } from '../expect'

const webId = 'https://alice.example/#id'
const agentId = 'https://jarvis.alice.example/#agent'
const factory = new AuthorizationAgentFactory(webId, agentId, { fetch, randomUUID })
const registrySetIri = 'https://auth.alice.example/13e60d32-77a6-4239-864d-cfe2c90807c8'
const granteeRegistrationIri = 'https://auth.alice.example/5dc3c14e-7830-475f-b8e3-4748d6c0bccb'

describe('getters', () => {
  test('should provide hasDataInstance', async () => {
    const selectedDataAuthorizationIri =
      'https://auth.alice.example/bee6bc10-2eb9-4b2d-b0c4-84c5d9039e53'
    const dataAuthorization = await factory.readable.dataAuthorization(selectedDataAuthorizationIri)
    expect(dataAuthorization.hasDataInstance).toHaveLength(2)
  })
})

describe('generateSourceDataGrants', () => {
  test('should generate equivalent grants', async () => {
    const dataAuthorizationIri = 'https://auth.alice.example/a691ee69-97d8-45c0-bb03-8e887b2db806'
    const registrySet = await factory.crud.registrySet(registrySetIri)
    const granteeRegistration = await factory.crud.socialAgentRegistration(granteeRegistrationIri)
    const dataAuthorization = await factory.readable.dataAuthorization(dataAuthorizationIri)
    // @ts-ignore
    const sourceGrants = await dataAuthorization.generateSourceDataGrants(
      registrySet.hasDataRegistry,
      granteeRegistration
    )
    const equivalentDataGrants = await Promise.all(
      [
        'https://auth.alice.example/067f19a8-1c9c-4b60-adde-c22d8e8e3814',
        'https://auth.alice.example/d738e710-b06e-4ab6-9159-ee0d7d603402',
        'https://auth.alice.example/5dd87c6d-c352-41e5-a79c-6ae71bb20287',
        'https://auth.alice.example/a723a19f-2275-41bf-a556-e6ae4fe880a8',
      ].map((iri) => factory.readable.dataGrant(iri))
    )
    for (const sourceGrant of sourceGrants) {
      const equivalent =
        sourceGrants.length === equivalentDataGrants.length &&
        equivalentDataGrants.some((equivalentGrant) =>
          sourceGrant.checkEquivalence(equivalentGrant)
        )

      expect(equivalent).toBeTruthy()
    }
  })

  test('should throw if called on authorization with Inherited scope', async () => {
    const inheritedDataAuthorizationIri =
      'https://auth.alice.example/ecdf7b5e-5123-4a93-87bc-86ef6de389ff'
    const registrySet = await factory.crud.registrySet(registrySetIri)
    const granteeRegistration = await factory.crud.socialAgentRegistration(granteeRegistrationIri)
    const dataAuthorization = await factory.readable.dataAuthorization(
      inheritedDataAuthorizationIri
    )
    await expect(
      // @ts-ignore
      dataAuthorization.generateSourceDataGrants(registrySet.hasDataRegistry, granteeRegistration)
    ).rejects.toThrow(
      'this method should not be callend on data authorizations with Inherited scope'
    )
  })

  test('should generate source data grant for specific data registration', async () => {
    const allFromRegistryDataAuthorizationIri =
      'https://auth.alice.example/d246d4da-79d9-4232-b5ab-94282cd0a63b'
    const registrySet = await factory.crud.registrySet(registrySetIri)
    const granteeRegistration = await factory.crud.socialAgentRegistration(granteeRegistrationIri)
    const dataAuthorization = await factory.readable.dataAuthorization(
      allFromRegistryDataAuthorizationIri
    )
    // @ts-ignore
    const dataGrants = await dataAuthorization.generateSourceDataGrants(
      registrySet.hasDataRegistry,
      granteeRegistration
    )
    expect(dataGrants).toHaveLength(1)
  })

  test('should generate source data grant for specific data instances', async () => {
    const selectedFromRegistryDataAuthorizationIri =
      'https://auth.alice.example/8307e5b4-4fd6-4e76-99bf-64df6a7d2894'
    const registrySet = await factory.crud.registrySet(registrySetIri)
    const granteeRegistration = await factory.crud.socialAgentRegistration(granteeRegistrationIri)
    const dataAuthorization = await factory.readable.dataAuthorization(
      selectedFromRegistryDataAuthorizationIri
    )
    // @ts-ignore
    const dataGrants = await dataAuthorization.generateSourceDataGrants(
      registrySet.hasDataRegistry,
      granteeRegistration
    )
    expect(dataGrants).toHaveLength(1)
    const dataGrant = dataGrants[0]
    const dataInstances = getAllMatchingQuads(
      dataGrant.dataset,
      DataFactory.namedNode(dataGrant.iri),
      INTEROP.hasDataInstance
    )
    expect(dataInstances).toHaveLength(1)
  })
})

describe('generateDelegatedDataGrants', () => {
  test('should generate equivalent grants', async () => {
    const dataAuthorizationIri = 'https://auth.alice.example/e2765d6c-848a-4fc0-9092-556903730263'
    const registrySet = await factory.crud.registrySet(registrySetIri)
    const granteeRegistration = await factory.crud.socialAgentRegistration(granteeRegistrationIri)
    const dataAuthorization = await factory.readable.dataAuthorization(dataAuthorizationIri)
    // @ts-ignore
    const delegatedGrants = await dataAuthorization.generateDelegatedDataGrants(
      registrySet.hasAgentRegistry,
      granteeRegistration
    )
    const equivalentDataGrants = await Promise.all(
      [
        'https://auth.alice.example/12daf870-a343-4684-b828-c67c5c9c997a',
        'https://auth.alice.example/7be5a39f-583d-4464-8ad8-a39e24b99fce',
        'https://auth.alice.example/c205e9da-2dc5-4d1f-8be9-a3f90c13eedc',
        'https://auth.alice.example/68dd1212-b0f3-4611-aae2-f9f5ea30ee07',
      ].map((iri) => factory.readable.dataGrant(iri))
    )
    for (const delegatedGrant of delegatedGrants) {
      const equivalent =
        delegatedGrants.length === equivalentDataGrants.length &&
        equivalentDataGrants.some((equivalentGrant) =>
          delegatedGrant.checkEquivalence(equivalentGrant)
        )

      expect(equivalent).toBeTruthy()
    }
  })

  test('should throw if called on authorization with Inherited scope', async () => {
    const inheritedDataAuthorizationIri =
      'https://auth.alice.example/6a9feb57-252b-43b2-8470-5a938888b2fa'
    const acmeRegistrationIri = 'https://auth.alice.example/5dc3c14e-7830-475f-b8e3-4748d6c0bccb'
    const registrySet = await factory.crud.registrySet(registrySetIri)
    const granteeRegistration = await factory.crud.socialAgentRegistration(acmeRegistrationIri)
    const dataAuthorization = await factory.readable.dataAuthorization(
      inheritedDataAuthorizationIri
    )
    await expect(
      // @ts-ignore
      dataAuthorization.generateDelegatedDataGrants(
        registrySet.hasAgentRegistry,
        granteeRegistration
      )
    ).rejects.toThrow(
      'this method should not be callend on data authorizations with Inherited scope'
    )
  })

  test('should not generate delegated data grant for data owner themselve', async () => {
    const allDataAuthorizationIri =
      'https://auth.alice.example/9ac499ce-f1a2-44c2-a5fb-01e3eb9a5bc9'
    const registrySet = await factory.crud.registrySet(registrySetIri)
    const granteeRegistration = await factory.crud.socialAgentRegistration(granteeRegistrationIri)
    const dataAuthorization = await factory.readable.dataAuthorization(allDataAuthorizationIri)
    // @ts-ignore
    const dataGrants = await dataAuthorization.generateDelegatedDataGrants(
      registrySet.hasAgentRegistry,
      granteeRegistration
    )
    expect(dataGrants).toHaveLength(0)
  })
  test('should generate source data grant for specific data registration', async () => {
    const allFromRegistryDataAuthorizationIri =
      'https://auth.alice.example/dbad38a1-4f99-4cd3-9107-23743a4059a8'
    const registrySet = await factory.crud.registrySet(registrySetIri)
    const someAppRegistrationIri = 'https://auth.alice.example/d1c1ad91-406a-4d14-99cf-db770785440c'
    const granteeRegistration = await factory.crud.socialAgentRegistration(someAppRegistrationIri)
    const dataAuthorization = await factory.readable.dataAuthorization(
      allFromRegistryDataAuthorizationIri
    )
    // @ts-ignore
    const dataGrants = await dataAuthorization.generateDelegatedDataGrants(
      registrySet.hasAgentRegistry,
      granteeRegistration
    )
    expect(dataGrants).toHaveLength(1)
  })
})
