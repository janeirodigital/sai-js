import {
  CRUDApplicationRegistration,
  ApplicationRegistrationData,
  BaseFactory,
  DataGrantData,
  DataGrant,
  ImmutableDataGrant,
  ReadableRegistrySet,
  ReadableAgentRegistry,
  ReadableAccessConsent,
  ReadableDataConsent,
  ReadableAccessConsentRegistry,
  ReadableSocialAgentRegistration,
  ReadableDataRegistration,
  AccessGrantData,
  ReadableAccessGrant,
  ImmutableAccessGrant,
  ReadableDataRegistry,
  DataConsentData,
  AccessConsentData,
  ImmutableAccessConsent,
  ImmutableDataConsent
} from '.';

export class AuthorizationAgentFactory extends BaseFactory {
  get crud() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const factory = this;
    return {
      applicationRegistration: async function applicationRegistration(
        iri: string,
        data?: ApplicationRegistrationData
      ): Promise<CRUDApplicationRegistration> {
        return CRUDApplicationRegistration.build(iri, factory, data);
      }
    };
  }

  get immutable() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const factory = this;
    return {
      dataGrant: async function dataGrant(iri: string, data: DataGrantData): Promise<DataGrant> {
        return ImmutableDataGrant.build(iri, factory, data);
      },
      accessGrant: async function accessGrant(iri: string, data: AccessGrantData): Promise<ReadableAccessGrant> {
        return ImmutableAccessGrant.build(iri, factory, data);
      },
      dataConsent: async function dataConsent(iri: string, data: DataConsentData): Promise<ReadableDataConsent> {
        return ImmutableDataConsent.build(iri, factory, data);
      },
      accessConsent: async function accessConsent(
        iri: string,
        data: AccessConsentData
      ): Promise<ReadableAccessConsent> {
        return ImmutableAccessConsent.build(iri, factory, data);
      }
    };
  }

  get readable() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const factory = this;
    return {
      accessConsent: async function accessConsent(iri: string): Promise<ReadableAccessConsent> {
        return ReadableAccessConsent.build(iri, factory);
      },
      dataConsent: async function dataConsent(iri: string): Promise<ReadableDataConsent> {
        return ReadableDataConsent.build(iri, factory);
      },
      dataRegistry: async function dataRegistry(iri: string): Promise<ReadableDataRegistry> {
        return ReadableDataRegistry.build(iri, factory);
      },
      registrySet: async function registrySet(iri: string): Promise<ReadableRegistrySet> {
        return ReadableRegistrySet.build(iri, factory);
      },
      dataRegistration: async function dataRegistration(iri: string): Promise<ReadableDataRegistration> {
        return ReadableDataRegistration.build(iri, factory);
      },
      agentRegistry: async function agentRegistry(iri: string): Promise<ReadableAgentRegistry> {
        return ReadableAgentRegistry.build(iri, factory);
      },
      accessConsentRegistry: async function accessConsentRegistry(iri: string): Promise<ReadableAccessConsentRegistry> {
        return ReadableAccessConsentRegistry.build(iri, factory);
      },
      socialAgentRegistration: async function socialAgentRegistration(
        iri: string,
        reciprocal = false
      ): Promise<ReadableSocialAgentRegistration> {
        return ReadableSocialAgentRegistration.build(iri, factory, reciprocal);
      },
      ...super.readable
    };
  }
}
