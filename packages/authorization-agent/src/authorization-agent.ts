import { DataFactory } from 'n3';
import { DatasetCore } from '@rdfjs/types';
import {
  AuthorizationAgentFactory,
  CRUDRegistrySet,
  ReadableAccessConsent,
  ImmutableDataConsent,
  DataConsentData,
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

type AccessConsentStructure = {
  grantee: string;
  hasAccessNeedGroup: string;
  dataConsents: DataConsentData[];
};

export class AuthorizationAgent {
  factory: AuthorizationAgentFactory;

  fetch: RdfFetch;

  registrySet: CRUDRegistrySet;

  constructor(private webId: string, private agentId: string, dependencies: AuthorizationAgentDependencies) {
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

  get accessConsents(): AsyncIterable<ReadableAccessConsent> {
    return this.registrySet.hasAccessConsentRegistry.accessConsents;
  }

  get applicationRegistrations(): AsyncIterable<CRUDApplicationRegistration> {
    return this.registrySet.hasAgentRegistry.applicationRegistrations;
  }

  get socialAgentRegistrations(): AsyncIterable<CRUDSocialAgentRegistration> {
    return this.registrySet.hasAgentRegistry.socialAgentRegistrations;
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
   * 1. Create Access Consent with Data Consents (or reuse existing when possible)
   *    AccessConsent#store does it
   * 2. Update Access Consent Registry in single request
   *   * a) Remove reference to prior Access Consent
   *   * b) Add reference to new Access Consent
   * TODO: reuse existing Data Consents wherever possible - see Data Consent tests
   */
  public async recordAccessConsent(consent: AccessConsentStructure): Promise<ReadableAccessConsent> {
    // create data consents

    // don't create data consent where grantee == dataowner
    const validDataConsents = consent.dataConsents.filter(
      (dataConsent) => dataConsent.dataOwner !== dataConsent.grantee
    );

    const dataConsents: ImmutableDataConsent[] = await Promise.all(
      validDataConsents.map((dataConsent) => {
        const dataConsentIri = this.registrySet.hasAccessConsentRegistry.iriForContained();
        return this.factory.immutable.dataConsent(dataConsentIri, dataConsent);
      })
    );

    const consentIri = this.registrySet.hasAccessConsentRegistry.iriForContained();
    const data = {
      grantedWith: this.agentId,
      grantedBy: this.webId,
      grantee: consent.grantee,
      hasAccessNeedGroup: consent.hasAccessNeedGroup,
      dataConsents
    };
    const accessConsent = this.factory.immutable.accessConsent(consentIri, data);
    const rAccessConsent = await accessConsent.store();

    // link to new access consent from access consent registry
    await this.registrySet.hasAccessConsentRegistry.add(rAccessConsent);
    return rAccessConsent;
  }

  public async generateAccessGrant(
    accessConsentIri: string,
    agentRegistration: CRUDSocialAgentRegistration | CRUDApplicationRegistration
  ): Promise<void> {
    const accessConsent = await this.factory.readable.accessConsent(accessConsentIri);

    // check if agentRegistration if for the consent grantee
    if (accessConsent.grantee !== agentRegistration.registeredAgent) {
      throw new Error('agent registration has to be for the consent grantee');
    }

    // generate access grant (with data grants) and store it
    const accessGrant = await accessConsent.generateAccessGrant(
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
    const affectedConsents = await this.registrySet.hasAccessConsentRegistry.findConsentsDelegatingGrant(
      dataOwnerRegistration.registeredAgent
    );
    await Promise.all(
      affectedConsents.map(async (accessConsent) => {
        const agentRegistration = await this.registrySet.hasAgentRegistry.findRegistration(accessConsent.grantee);
        return this.generateAccessGrant(accessConsent.iri, agentRegistration);
      })
    );
  }
}
