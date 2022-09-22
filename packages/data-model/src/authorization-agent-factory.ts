import {
  AgentRegistrationData,
  BaseFactory,
  BaseReadableFactory,
  DataGrantData,
  ImmutableDataGrant,
  CRUDRegistrySet,
  CRUDAgentRegistry,
  ReadableAccessAuthorization,
  ReadableDataAuthorization,
  CRUDAuthorizationRegistry,
  AccessGrantData,
  ImmutableAccessGrant,
  DataAuthorizationData,
  AccessAuthorizationData,
  ImmutableAccessAuthorization,
  ImmutableDataAuthorization,
  CRUDDataRegistry,
  FactoryDependencies,
  CRUDSocialAgentRegistration,
  SocialAgentRegistrationData,
  CRUDApplicationRegistration,
  CRUDDataRegistration,
  DataRegistrationData
} from '.';

interface AuthorizationAgentReadableFactory extends BaseReadableFactory {
  accessAuthorization(iri: string): Promise<ReadableAccessAuthorization>;
  dataAuthorization(iri: string): Promise<ReadableDataAuthorization>;
}
interface CRUDFactory {
  applicationRegistration(iri: string, data?: AgentRegistrationData): Promise<CRUDApplicationRegistration>;
  socialAgentRegistration(
    iri: string,
    reciprocal?: boolean,
    data?: SocialAgentRegistrationData
  ): Promise<CRUDSocialAgentRegistration>;
  dataRegistry(iri: string): Promise<CRUDDataRegistry>;
  dataRegistration(iri: string, data?: DataRegistrationData): Promise<CRUDDataRegistration>;
  authorizationRegistry(iri: string): Promise<CRUDAuthorizationRegistry>;
  agentRegistry(iri: string): Promise<CRUDAgentRegistry>;
  registrySet(iri: string): Promise<CRUDRegistrySet>;
}

interface ImmutableFactory {
  dataGrant(iri: string, data: DataGrantData): ImmutableDataGrant;
  accessGrant(iri: string, data: AccessGrantData): ImmutableAccessGrant;
  dataAuthorization(iri: string, data: DataAuthorizationData): ImmutableDataAuthorization;
  accessAuthorization(iri: string, data: AccessAuthorizationData): ImmutableAccessAuthorization;
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
        data?: SocialAgentRegistrationData
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
      authorizationRegistry: async function authorizationRegistry(iri: string): Promise<CRUDAuthorizationRegistry> {
        return CRUDAuthorizationRegistry.build(iri, factory);
      },
      agentRegistry: async function agentRegistry(iri: string): Promise<CRUDAgentRegistry> {
        return CRUDAgentRegistry.build(iri, factory);
      },
      registrySet: async function registrySet(iri: string): Promise<CRUDRegistrySet> {
        return CRUDRegistrySet.build(iri, factory);
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
      dataAuthorization: function dataAuthorization(
        iri: string,
        data: DataAuthorizationData
      ): ImmutableDataAuthorization {
        return new ImmutableDataAuthorization(iri, factory, data);
      },
      accessAuthorization: function accessAuthorization(
        iri: string,
        data: AccessAuthorizationData
      ): ImmutableAccessAuthorization {
        return new ImmutableAccessAuthorization(iri, factory, data);
      }
    };
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  protected readableFactory() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const factory = this;
    return {
      accessAuthorization: async function accessAuthorization(iri: string): Promise<ReadableAccessAuthorization> {
        return ReadableAccessAuthorization.build(iri, factory);
      },
      dataAuthorization: async function dataAuthorization(iri: string): Promise<ReadableDataAuthorization> {
        return ReadableDataAuthorization.build(iri, factory);
      },
      ...super.readableFactory()
    };
  }
}
