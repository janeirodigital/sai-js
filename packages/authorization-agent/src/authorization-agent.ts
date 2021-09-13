import { DataFactory } from 'n3';
import { DatasetCore } from '@rdfjs/types';
import {
  AuthorizationAgentFactory,
  ReadableRegistrySet,
  ReadableAccessConsent,
  ReadableApplicationRegistration,
  SocialAgentRegistration
} from '@janeirodigital/interop-data-model';
import { WhatwgFetch, RdfFetch, fetchWrapper, getOneMatchingQuad } from '@janeirodigital/interop-utils';
import { INTEROP } from '@janeirodigital/interop-namespaces';

interface AuthorizationAgentDependencies {
  fetch: WhatwgFetch;
  randomUUID(): string;
}

export class AuthorizationAgent {
  factory: AuthorizationAgentFactory;

  fetch: RdfFetch;

  registrySet: RegistrySet;

  constructor(private webId: string, dependencies: AuthorizationAgentDependencies) {
    this.fetch = fetchWrapper(dependencies.fetch);
    this.factory = new AuthorizationAgentFactory({ fetch: this.fetch, randomUUID: dependencies.randomUUID });
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
    this.registrySet = await this.factory.registrySet(registrySetIri);
  }

  public static async build(webId: string, dependencies: AuthorizationAgentDependencies): Promise<AuthorizationAgent> {
    const instance = new AuthorizationAgent(webId, dependencies);
    await instance.bootstrap();
    return instance;
  }

  // TODO consider transactional aspect
  // TODO reuse existing data consents if possible
  public async recordAccessConsent(consent: unknown): Promise<void> {
    let priorAccessConsent;
    for await (const accessConsent of this.accessConsents) {
      if (accessConsent.registeredAgent === consent.registeredAgent) {
        priorAccessConsent = accessConsent;
        break;
      }
    }
    // create data consents
    const dataConsents = await Promise.all(
      consnet.dataConsents.map((dataConsent) => {
        const dataConsentIri = ''; // TODO gen iri
        return this.factory.immutable.dataConsent(dataConsentIri, dataConsent);
      })
    );

    const consentIri = ''; // TODO gen iri
    const data = {
      hasDataConsent: dataConsents.map((dataConsent) => dataConsent.iri)
    };
    const accessConsent = this.factory.immutable.accessConsent(consentIri, data);
    await accessConsent.generateAccessGrant(this.registrySet.hasDataRegistry, this.registrySet.hasAgentRegistry);

    // TODO change ref in AgentRegistration to new Access Grant
    if (priorAccessConsent) {
      // ....
      // TODO delete prior access consent and data consents
      // this.factory.deleteResource(priorAccessConsent.iri)
    }
  }
}
