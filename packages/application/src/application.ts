import { DataFactory } from 'n3';
import { DatasetCore } from '@rdfjs/types';
import { ApplicationFactory, ReadableApplicationRegistration, DataOwner } from '@janeirodigital/interop-data-model';
import {
  WhatwgFetch,
  RdfFetch,
  fetchWrapper,
  getOneMatchingQuad,
  getApplicationRegistrationIri,
  parseJsonld
} from '@janeirodigital/interop-utils';
import { INTEROP } from '@janeirodigital/interop-namespaces';

interface ApplicationDependencies {
  fetch: WhatwgFetch;
  randomUUID(): string;
}

export class Application {
  factory: ApplicationFactory;

  fetch: RdfFetch;

  hasAuthorizationAgent: string;

  authorizationRedirectUriBase: string;

  hasApplicationRegistration?: ReadableApplicationRegistration;

  constructor(public webId: string, public applicationId: string, dependencies: ApplicationDependencies) {
    this.fetch = fetchWrapper(dependencies.fetch);
    this.factory = new ApplicationFactory({ fetch: this.fetch, randomUUID: dependencies.randomUUID });
  }

  private async bootstrap(): Promise<void> {
    this.hasAuthorizationAgent = await this.discoverAuthorizationAgent();
    const applicationRegistrationIri = await this.discoverRegistration();
    if (applicationRegistrationIri) {
      this.hasApplicationRegistration = await this.factory.readable.applicationRegistration(applicationRegistrationIri);
    } else {
      this.authorizationRedirectUriBase = await this.discoverAuthorizationRedirectUri();
    }
  }

  async discoverAuthorizationAgent(): Promise<string> {
    const userDataset: DatasetCore = await (await this.fetch(this.webId)).dataset();
    const authorizationAgentPattern = [DataFactory.namedNode(this.webId), INTEROP.hasAuthorizationAgent, null];
    return getOneMatchingQuad(userDataset, ...authorizationAgentPattern).object.value;
  }

  async discoverAuthorizationRedirectUri(): Promise<string> {
    const authzAgentDocumentResponse = await this.fetch(this.hasAuthorizationAgent, {
      headers: { Accept: 'application/ld+json' }
    });
    const document = await parseJsonld(await authzAgentDocumentResponse.text(), authzAgentDocumentResponse.url);
    return getOneMatchingQuad(document, null, INTEROP.authorizationRedirectUri)?.object.value;
  }

  // eslint-disable-next-line consistent-return
  get authorizationRedirectUri(): string | undefined {
    if (this.authorizationRedirectUriBase) {
      return `${this.authorizationRedirectUriBase}?client_id=${this.applicationId}`;
    }
  }

  async discoverRegistration(): Promise<string | null> {
    const response = await this.fetch(this.hasAuthorizationAgent, { method: 'HEAD' });
    const linkHeader = response.headers.get('Link');
    if (!linkHeader) return null;
    return getApplicationRegistrationIri(linkHeader);
  }

  static async build(
    webId: string,
    applicationId: string,
    dependencies: ApplicationDependencies
  ): Promise<Application> {
    const application = new Application(webId, applicationId, dependencies);
    await application.bootstrap();
    return application;
  }

  /**
   * Array of DataOwner instances out of all the data application can access.
   * @public
   */
  get dataOwners(): DataOwner[] {
    if (!this.hasApplicationRegistration) return [];
    return this.hasApplicationRegistration.hasAccessGrant.hasDataGrant.reduce((acc, grant) => {
      let owner: DataOwner = acc.find((agent) => agent.iri === grant.dataOwner);
      if (!owner) {
        owner = new DataOwner(grant.dataOwner);
        acc.push(owner);
      }
      owner.issuedGrants.push(grant);
      return acc;
    }, []);
  }
}
