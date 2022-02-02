import {
  AgentRegistrationData,
  BaseFactory,
  BaseReadableFactory,
  DataGrantData,
  ImmutableDataGrant,
  ReadableRegistrySet,
  ReadableAgentRegistry,
  ReadableAccessConsent,
  ReadableDataConsent,
  CRUDAccessConsentRegistry,
  AccessGrantData,
  ImmutableAccessGrant,
  DataConsentData,
  AccessConsentData,
  ImmutableAccessConsent,
  ImmutableDataConsent,
  CRUDDataRegistry,
  FactoryDependencies,
  CRUDSocialAgentRegistration,
  CRUDApplicationRegistration,
  CRUDDataRegistration,
  DataRegistrationData
} from '.';

interface AuthorizationAgentReadableFactory extends BaseReadableFactory {
  accessConsent(iri: string): Promise<ReadableAccessConsent>;
  dataConsent(iri: string): Promise<ReadableDataConsent>;
  registrySet(iri: string): Promise<ReadableRegistrySet>;
  agentRegistry(iri: string): Promise<ReadableAgentRegistry>;
}
interface CRUDFactory {
  applicationRegistration(iri: string, data?: AgentRegistrationData): Promise<CRUDApplicationRegistration>;
  socialAgentRegistration(
    iri: string,
    reciprocal?: boolean,
    data?: AgentRegistrationData
  ): Promise<CRUDSocialAgentRegistration>;
  dataRegistry(iri: string): Promise<CRUDDataRegistry>;
  dataRegistration(iri: string, data?: DataRegistrationData): Promise<CRUDDataRegistration>;
  accessConsentRegistry(iri: string): Promise<CRUDAccessConsentRegistry>;
}

interface ImmutableFactory {
  dataGrant(iri: string, data: DataGrantData): ImmutableDataGrant;
  accessGrant(iri: string, data: AccessGrantData): ImmutableAccessGrant;
  dataConsent(iri: string, data: DataConsentData): ImmutableDataConsent;
  accessConsent(iri: string, data: AccessConsentData): ImmutableAccessConsent;
}

export class AuthorizationAgentFactory extends BaseFactory {
  readable: AuthorizationAgentReadableFactory;

  immutable: ImmutableFactory;

  crud: CRUDFactory;

  constructor(public webId: string, public agentId: string, dependencies: FactoryDependencies) {
    super(dependencies);

    this.readable = this.readableFactory();
    this.immutable = this.immutableFactory();
    this.crud = this.crudFactory();
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  private crudFactory(): CRUDFactory {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const factory = this;
    return {
      applicationRegistration: async function applicationRegistration(
        iri: string,
        data?: AgentRegistrationData
      ): Promise<CRUDApplicationRegistration> {
        return CRUDApplicationRegistration.build(iri, factory, data);
      },
      socialAgentRegistration: async function socialAgentRegistration(
        iri: string,
        reciprocal = false,
        data?: AgentRegistrationData
      ): Promise<CRUDSocialAgentRegistration> {
        return CRUDSocialAgentRegistration.build(iri, factory, reciprocal, data);
      },
      dataRegistry: async function dataRegistry(iri: string): Promise<CRUDDataRegistry> {
        return CRUDDataRegistry.build(iri, factory);
      },
      dataRegistration: async function dataRegistration(
        iri: string,
        data?: DataRegistrationData
      ): Promise<CRUDDataRegistration> {
        return CRUDDataRegistration.build(iri, factory, data);
      },
      accessConsentRegistry: async function accessConsentRegistry(iri: string): Promise<CRUDAccessConsentRegistry> {
        return CRUDAccessConsentRegistry.build(iri, factory);
      }
    };
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  private immutableFactory(): ImmutableFactory {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const factory = this;
    return {
      dataGrant: function dataGrant(iri: string, data: DataGrantData): ImmutableDataGrant {
        return new ImmutableDataGrant(iri, factory, data);
      },
      accessGrant: function accessGrant(iri: string, data: AccessGrantData): ImmutableAccessGrant {
        return new ImmutableAccessGrant(iri, factory, data);
      },
      dataConsent: function dataConsent(iri: string, data: DataConsentData): ImmutableDataConsent {
        return new ImmutableDataConsent(iri, factory, data);
      },
      accessConsent: function accessConsent(iri: string, data: AccessConsentData): ImmutableAccessConsent {
        return new ImmutableAccessConsent(iri, factory, data);
      }
    };
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  protected readableFactory() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const factory = this;
    return {
      accessConsent: async function accessConsent(iri: string): Promise<ReadableAccessConsent> {
        return ReadableAccessConsent.build(iri, factory);
      },
      dataConsent: async function dataConsent(iri: string): Promise<ReadableDataConsent> {
        return ReadableDataConsent.build(iri, factory);
      },
      registrySet: async function registrySet(iri: string): Promise<ReadableRegistrySet> {
        return ReadableRegistrySet.build(iri, factory);
      },
      agentRegistry: async function agentRegistry(iri: string): Promise<ReadableAgentRegistry> {
        return ReadableAgentRegistry.build(iri, factory);
      },
      ...super.readableFactory()
    };
  }
}
