import {
  AuthorizationAgentFactory,
  CRUDRegistrySet,
  ReadableAccessAuthorization,
  CRUDSocialAgentRegistration,
  CRUDApplicationRegistration,
  ImmutableDataGrant,
  ReadableWebIdProfile,
  ReadableDataAuthorization,
  ReadableDataRegistration,
  ReadableDataInstance
} from '@janeirodigital/interop-data-model';
import { INTEROP, WhatwgFetch, RdfFetch, fetchWrapper, asyncIterableToArray } from '@janeirodigital/interop-utils';
import {
  AccessAuthorizationStructure,
  generateAuthorization,
  GrantedAuthorization,
  NestedDataAuthorizationData
} from './authorization';

interface AuthorizationAgentDependencies {
  fetch: WhatwgFetch;
  randomUUID(): string;
}

export interface AgentWithAccess {
  agent: string;
  dataAuthorization: string;
  accessMode: string[];
}

// TODO: duplicats ShareAuthorization from api-messages (sai-impl-service)
export type ShareDataInstanceStructure = {
  applicationId: string;
  resource: string;
  accessMode: string[];
  children: {
    shapeTree: string;
    accessMode: string[];
  }[];
  agents: string[];
};

// TODO: adjust if registrations are not / nested in the registry
function registryOfRegistration(dataRegistrationIri: string): string {
  return `${dataRegistrationIri.split('/').slice(0, -2).join('/')}/`;
}

function formatAgentWithAccess(dataAuthorization: ReadableDataAuthorization): AgentWithAccess {
  return {
    agent: dataAuthorization.grantee,
    dataAuthorization: dataAuthorization.iri,
    accessMode: dataAuthorization.accessMode
  };
}

export class AuthorizationAgent {
  factory: AuthorizationAgentFactory;

  rawFetch: WhatwgFetch;

  fetch: RdfFetch;

  webIdProfile: ReadableWebIdProfile;

  registrySet: CRUDRegistrySet;

  constructor(public webId: string, public agentId: string, dependencies: AuthorizationAgentDependencies) {
    this.rawFetch = dependencies.fetch;
    this.fetch = fetchWrapper(this.rawFetch);
    this.factory = new AuthorizationAgentFactory(webId, agentId, {
      fetch: this.fetch,
      randomUUID: dependencies.randomUUID
    });
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

  public async findDataRegistration(dataRegistryIri: string, shapeTree: string): Promise<ReadableDataRegistration> {
    const dataRegistry = this.registrySet.hasDataRegistry.find((registry) => registry.iri === dataRegistryIri);
    let dataRegistration: ReadableDataRegistration;
    for await (const registration of dataRegistry.registrations) {
      if (registration.registeredShapeTree === shapeTree) {
        dataRegistration = registration;
        break;
      }
    }
    return dataRegistration;
  }

  private async bootstrap(): Promise<void> {
    this.webIdProfile = await this.factory.readable.webIdProfile(this.webId);
    this.registrySet = await this.factory.crud.registrySet(this.webIdProfile.hasRegistrySet);
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
    authorization: AccessAuthorizationStructure,
    extendIfExists = false
  ): Promise<ReadableAccessAuthorization> {
    // create data authorizations

    // TODO explore moving into AccessAuthorization
    return generateAuthorization(
      authorization,
      this.webId,
      this.registrySet.hasAuthorizationRegistry,
      this.agentId,
      this.factory,
      extendIfExists
    );
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
    // always store if access not granted
    // TODO: verify if a data grant was removed - previos had more data grants
    if (!accessGrant.data.granted || accessGrant.dataGrants.some((grant) => grant instanceof ImmutableDataGrant)) {
      const rAccessGrant = await accessGrant.store();

      // link to new access grant and update agent registration
      // eslint-disable-next-line no-param-reassign
      await agentRegistration.setAccessGrant(rAccessGrant.iri);
    }
  }

  /**
   * Replaces all access grants, which have data grant delegating from that owner
   * TODO: explore how to optimize, matching on shape trees can fail if access was removed
   */
  public async updateDelegatedGrants(dataOwner: string): Promise<void> {
    const affectedAuthorizations =
      await this.registrySet.hasAuthorizationRegistry.findAuthorizationsDelegatingFromOwner(dataOwner);
    await Promise.all(
      affectedAuthorizations.map(async (accessAuthorization) => this.generateAccessGrant(accessAuthorization.iri))
    );
  }

  public async findSocialAgentsWithAccess(dataInstanceIri: string): Promise<AgentWithAccess[]> {
    const agentsWithAccess = await this.findAgentsWithAccess(dataInstanceIri);
    const socialAgentsWithAccess: AgentWithAccess[] = [];
    for await (const registration of this.socialAgentRegistrations) {
      const socialAgentWithAccess = agentsWithAccess.find(({ agent }) => agent === registration.registeredAgent);
      if (socialAgentWithAccess) {
        socialAgentsWithAccess.push(socialAgentWithAccess);
      }
    }
    return socialAgentsWithAccess;
  }

  public async findAgentsWithAccess(dataInstanceIri: string): Promise<AgentWithAccess[]> {
    const dataInstance = await this.factory.readable.dataInstance(dataInstanceIri);
    const shapeTree = dataInstance.dataRegistration.registeredShapeTree;
    const agentsWithAccess: AgentWithAccess[] = [];
    for await (const accessAuthorization of this.accessAuthorizations) {
      const dataAuthorization = (
        await asyncIterableToArray<ReadableDataAuthorization>(accessAuthorization.dataAuthorizations)
      ).find((autorization) => autorization.registeredShapeTree === shapeTree);
      // eslint-disable-next-line no-continue
      if (!dataAuthorization) continue;

      switch (dataAuthorization.scopeOfAuthorization) {
        case INTEROP.All.value:
          agentsWithAccess.push(formatAgentWithAccess(dataAuthorization));
          break;
        case INTEROP.AllFromAgent.value:
          // TODO: rethink for delegated sharing, e.g. Alice shares project owned by ACME
          if (dataAuthorization.dataOwner === this.webId) {
            agentsWithAccess.push(formatAgentWithAccess(dataAuthorization));
          }
          break;
        case INTEROP.AllFromRegistry.value:
          if (dataAuthorization.hasDataRegistration === dataInstance.dataRegistration.iri) {
            agentsWithAccess.push(formatAgentWithAccess(dataAuthorization));
          }
          break;
        case INTEROP.SelectedInstances.value:
          if (
            dataAuthorization.hasDataRegistration === dataInstance.dataRegistration.iri &&
            dataAuthorization.hasDataInstance.includes(dataInstanceIri)
          ) {
            agentsWithAccess.push(formatAgentWithAccess(dataAuthorization));
          }
          break;
        default:
          throw new Error(
            `encountered incorect Data Authorization with scope:${dataAuthorization.scopeOfAuthorization}`
          );
      }
    }
    return agentsWithAccess;
  }

  private async formatAuthorization(
    agent: string,
    dataInstance: ReadableDataInstance,
    details: ShareDataInstanceStructure
  ): Promise<GrantedAuthorization> {
    const dataAuthorization: NestedDataAuthorizationData = {
      grantee: agent,
      registeredShapeTree: dataInstance.dataRegistration.registeredShapeTree,
      scopeOfAuthorization: INTEROP.SelectedInstances.value,
      dataOwner: this.webId, // TODO: delegated authorizations and trusted agents
      hasDataRegistration: dataInstance.dataRegistration.iri,
      accessMode: details.accessMode,
      hasDataInstance: [dataInstance.iri],
      children: await Promise.all(
        details.children.map(async (child) => ({
          grantee: agent,
          registeredShapeTree: child.shapeTree,
          scopeOfAuthorization: INTEROP.Inherited.value,
          dataOwner: this.webId, // TODO: delegated authorizations and trusted agents
          hasDataRegistration: (
            await this.findDataRegistration(registryOfRegistration(dataInstance.dataRegistration.iri), child.shapeTree)
          ).iri,
          accessMode: child.accessMode
        }))
      )
    };

    return {
      grantee: agent,
      granted: true,
      dataAuthorizations: [dataAuthorization]
    };
  }

  /*
   * Authorizes access to a specific Data Instance to multiple agents
   * TODO: support delegated authorization
   */
  public async shareDataInstance(details: ShareDataInstanceStructure): Promise<string[]> {
    // ensure owner doesn't grant acces for oneself
    // TODO: reconsider for TrustedGrants grantees, compare with data instance owner instead
    const requestedAgents = details.agents.filter((agent) => agent !== this.webId);
    // filter out agents who already have access
    // TODO: do we need to adjust once we handle access modes? or require separate operation for such change
    const agentsWithAccess = (await this.findSocialAgentsWithAccess(details.resource)).map((obj) => obj.agent);
    const agents = requestedAgents.filter((agent) => !agentsWithAccess.includes(agent));

    // TODO: ensure all agents have social agent registrations, throw error

    const dataInstance = await this.factory.readable.dataInstance(details.resource);
    const authorizations = await Promise.all(
      agents.map(async (agent) => {
        const authorization = await this.formatAuthorization(agent, dataInstance, details);
        return this.recordAccessAuthorization(authorization, true);
      })
    );
    return authorizations.map((authorization) => authorization.iri);
  }
}
