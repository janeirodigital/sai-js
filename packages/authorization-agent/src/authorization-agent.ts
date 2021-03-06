import { DataFactory } from 'n3';
import { DatasetCore } from '@rdfjs/types';
import {
  AuthorizationAgentFactory,
  CRUDRegistrySet,
  ReadableAccessAuthorization,
  ImmutableDataAuthorization,
  DataAuthorizationData,
  CRUDSocialAgentRegistration,
  CRUDApplicationRegistration,
  ImmutableDataGrant
} from '@janeirodigital/interop-data-model';
import { WhatwgFetch, RdfFetch, fetchWrapper, getOneMatchingQuad } from '@janeirodigital/interop-utils';
import { INTEROP } from '@janeirodigital/interop-namespaces';

interface AuthorizationAgentDependencies {
  fetch: WhatwgFetch;
  randomUUID(): string;
}

type AccessAuthorizationStructure = {
  grantee: string;
  hasAccessNeedGroup: string;
  dataAuthorizations: DataAuthorizationData[];
};

export class AuthorizationAgent {
  factory: AuthorizationAgentFactory;

  fetch: RdfFetch;

  registrySet: CRUDRegistrySet;

  constructor(public webId: string, public agentId: string, dependencies: AuthorizationAgentDependencies) {
    this.fetch = fetchWrapper(dependencies.fetch);
    this.factory = new AuthorizationAgentFactory(webId, agentId, {
      fetch: this.fetch,
      randomUUID: dependencies.randomUUID
    });
  }

  private async discoverRegistrySet(): Promise<string> {
    const userDataset: DatasetCore = await (await this.fetch(this.webId)).dataset();
    const registrySetPattern = [DataFactory.namedNode(this.webId), INTEROP.hasRegistrySet, null];
    return getOneMatchingQuad(userDataset, ...registrySetPattern).object.value;
  }

  get accessAuthorizations(): AsyncIterable<ReadableAccessAuthorization> {
    return this.registrySet.hasAuthorizationRegistry.accessAuthorizations;
  }

  get applicationRegistrations(): AsyncIterable<CRUDApplicationRegistration> {
    return this.registrySet.hasAgentRegistry.applicationRegistrations;
  }

  public async findApplicationRegistration(iri: string): Promise<CRUDApplicationRegistration | undefined> {
    return this.registrySet.hasAgentRegistry.findApplicationRegistration(iri);
  }

  get socialAgentRegistrations(): AsyncIterable<CRUDSocialAgentRegistration> {
    return this.registrySet.hasAgentRegistry.socialAgentRegistrations;
  }

  public async findSocialAgentRegistration(iri: string): Promise<CRUDSocialAgentRegistration | undefined> {
    return this.registrySet.hasAgentRegistry.findSocialAgentRegistration(iri);
  }

  private async bootstrap(): Promise<void> {
    const registrySetIri = await this.discoverRegistrySet();
    this.registrySet = await this.factory.crud.registrySet(registrySetIri);
  }

  public static async build(
    webId: string,
    agentId: string,
    dependencies: AuthorizationAgentDependencies
  ): Promise<AuthorizationAgent> {
    const instance = new AuthorizationAgent(webId, agentId, dependencies);
    await instance.bootstrap();
    return instance;
  }

  /*
   * Sincle solid doesn't provide atomic transactions we should follow this order
   * 1. Create Access Authorization with Data Authorizations (or reuse existing when possible)
   *    AccessAuthorization#store does it
   * 2. Update Access Authorization Registry in single request
   *   * a) Remove reference to prior Access Authorization
   *   * b) Add reference to new Access Authorization
   * TODO: reuse existing Data Authorizations wherever possible - see Data Authorization tests
   */
  public async recordAccessAuthorization(
    authorization: AccessAuthorizationStructure
  ): Promise<ReadableAccessAuthorization> {
    // create data authorizations

    // don't create data authorization where grantee == dataowner
    const validDataAuthorizations = authorization.dataAuthorizations.filter(
      (dataAuthorization) => dataAuthorization.dataOwner !== dataAuthorization.grantee
    );

    const dataAuthorizations: ImmutableDataAuthorization[] = await Promise.all(
      validDataAuthorizations.map((dataAuthorization) => {
        const dataAuthorizationIri = this.registrySet.hasAuthorizationRegistry.iriForContained();
        return this.factory.immutable.dataAuthorization(dataAuthorizationIri, dataAuthorization);
      })
    );

    const authorizationIri = this.registrySet.hasAuthorizationRegistry.iriForContained();
    const data = {
      grantedWith: this.agentId,
      grantedBy: this.webId,
      grantee: authorization.grantee,
      hasAccessNeedGroup: authorization.hasAccessNeedGroup,
      dataAuthorizations
    };
    const accessAuthorization = this.factory.immutable.accessAuthorization(authorizationIri, data);
    const rAccessAuthorization = await accessAuthorization.store();

    // link to new access authorization from access authorization registry
    await this.registrySet.hasAuthorizationRegistry.add(rAccessAuthorization);
    return rAccessAuthorization;
  }

  public async generateAccessGrant(accessAuthorizationIri: string): Promise<void> {
    const accessAuthorization = await this.factory.readable.accessAuthorization(accessAuthorizationIri);
    const agentRegistration = await this.registrySet.hasAgentRegistry.findRegistration(accessAuthorization.grantee);
    if (!agentRegistration) {
      throw new Error('agent registration for the grantee does not exist');
    }
    // generate access grant (with data grants) and store it
    const accessGrant = await accessAuthorization.generateAccessGrant(
      this.registrySet.hasDataRegistry,
      this.registrySet.hasAgentRegistry,
      agentRegistration
    );

    // only store new access grant and update registration if any data grant changed
    // TODO: verify if a data grant was removed - previos had more data grants
    if (accessGrant.dataGrants.some((grant) => grant instanceof ImmutableDataGrant)) {
      const rAccessGrant = await accessGrant.store();

      // link to new access grant and update agent registration
      // eslint-disable-next-line no-param-reassign
      agentRegistration.hasAccessGrant = rAccessGrant.iri;
      await agentRegistration.update();
    }
  }

  /**
   * Replaces all access grants, which have data grant delegating from that owner
   * TODO: explore how to optimize, matching on shape trees can fail if access was removed
   */
  public async updateDelegatedGrants(dataOwnerRegistration: CRUDSocialAgentRegistration): Promise<void> {
    const affectedAuthorizations =
      await this.registrySet.hasAuthorizationRegistry.findAuthorizationsDelegatingFromOwner(
        dataOwnerRegistration.registeredAgent
      );
    await Promise.all(
      affectedAuthorizations.map(async (accessAuthorization) => this.generateAccessGrant(accessAuthorization.iri))
    );
  }
}
