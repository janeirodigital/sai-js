import {
  CRUDApplicationRegistration,
  ApplicationRegistrationData,
  BaseFactory,
  DataGrantData,
  ImmutableDataGrant,
  ReadableRegistrySet,
  ReadableAgentRegistry,
  ReadableAccessConsent,
  ReadableDataConsent,
  ReadableAccessConsentRegistry,
  ReadableSocialAgentRegistration,
  ReadableDataRegistration,
  AccessGrantData,
  ImmutableAccessGrant,
  DataConsentData,
  AccessConsentData,
  ImmutableAccessConsent,
  ImmutableDataConsent,
  ReadableDataRegistry
} from '.';

export class AuthorizationAgentFactory extends BaseFactory {
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
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

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  get immutable() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const factory = this;
    return {
      dataGrant: function dataGrant(iri: string, data: DataGrantData): ImmutableDataGrant {
        return new ImmutableDataGrant(iri, factory, data);
      },
      accessGrant: async function accessGrant(iri: string, data: AccessGrantData): Promise<ImmutableAccessGrant> {
        return ImmutableAccessGrant.build(iri, factory, data);
      },
      dataConsent: async function dataConsent(iri: string, data: DataConsentData): Promise<ImmutableDataConsent> {
        return ImmutableDataConsent.build(iri, factory, data);
      },
      accessConsent: async function accessConsent(
        iri: string,
        data: AccessConsentData
      ): Promise<ImmutableAccessConsent> {
        return ImmutableAccessConsent.build(iri, factory, data);
      }
    };
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
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
