import { DataFactory } from 'n3';
import { DatasetCore } from '@rdfjs/types';
import {
  AuthorizationAgentFactory,
  ReadableRegistrySet,
  ReadableAccessConsent,
  ReadableApplicationRegistration,
  ReadableSocialAgentRegistration,
  ImmutableDataConsent
} from '@janeirodigital/interop-data-model';
import { WhatwgFetch, RdfFetch, fetchWrapper, getOneMatchingQuad } from '@janeirodigital/interop-utils';
import { INTEROP } from '@janeirodigital/interop-namespaces';

interface AuthorizationAgentDependencies {
  fetch: WhatwgFetch;
  randomUUID(): string;
}

type DataConsentStructure = {
  scopeOfConsent: string;
  registeredShapeTree: string;
  accessMode: string[];
};

type AccessConsentStructure = {
  registeredAgent: string;
  hasAccessNeedGroup: string;
  dataConsents: DataConsentStructure[];
};

export class AuthorizationAgent {
  factory: AuthorizationAgentFactory;

  fetch: RdfFetch;

  registrySet: ReadableRegistrySet;

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

  get applicationRegistrations(): AsyncIterable<ReadableApplicationRegistration> {
    return this.registrySet.hasAgentRegistry.applicationRegistrations;
  }

  get socialAgentRegistrations(): AsyncIterable<ReadableSocialAgentRegistration> {
    return this.registrySet.hasAgentRegistry.socialAgentRegistrations;
  }

  private async bootstrap(): Promise<void> {
    const registrySetIri = await this.discoverRegistrySet();
    this.registrySet = await this.factory.readable.registrySet(registrySetIri);
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
  public async recordAccessConsent(consent: AccessConsentStructure): Promise<void> {
    let priorAccessConsent;
    for await (const accCons of this.accessConsents) {
      if (accCons.registeredAgent === consent.registeredAgent) {
        priorAccessConsent = accCons;
        break;
      }
    }
    // create data consents
    // TODO (elf-pavlik) don't create data consent where grantee == dataowner
    const dataConsents: ImmutableDataConsent[] = await Promise.all(
      consent.dataConsents.map((dataConsent) => {
        const dataConsentIri = this.registrySet.hasAccessConsentRegistry.iriForContained();
        return this.factory.immutable.dataConsent(dataConsentIri, dataConsent);
      })
    );

    const consentIri = this.registrySet.hasAccessConsentRegistry.iriForContained();
    const data = {
      registeredWith: this.agentId,
      registeredBy: this.webId,
      registeredAgent: consent.registeredAgent,
      hasAccessNeedGroup: consent.hasAccessNeedGroup,
      dataConsents
    };
    const accessConsent = this.factory.immutable.accessConsent(consentIri, data);
    const rAccessConsent = await accessConsent.store();
    const accessGrant = await rAccessConsent.generateAccessGrant(
      this.registrySet.hasDataRegistry,
      this.registrySet.hasAgentRegistry
    );
    await accessGrant.store();
  }
}
