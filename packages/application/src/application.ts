import { ApplicationFactory, ReadableApplicationRegistration, DataOwner } from '@janeirodigital/interop-data-model';
import {
  WhatwgFetch,
  RdfFetch,
  fetchWrapper,
  discoverAuthorizationAgent,
  discoverAgentRegistration,
  discoverAuthorizationRedirectEndpoint
} from '@janeirodigital/interop-utils';

interface ApplicationDependencies {
  fetch: WhatwgFetch;
  randomUUID(): string;
}

export class Application {
  factory: ApplicationFactory;

  rawFetch: WhatwgFetch;

  fetch: RdfFetch;

  authorizationAgentIri: string;

  authorizationRedirectEndpoint: string;

  hasApplicationRegistration?: ReadableApplicationRegistration;

  constructor(public webId: string, public applicationId: string, dependencies: ApplicationDependencies) {
    this.rawFetch = dependencies.fetch;
    this.fetch = fetchWrapper(this.rawFetch);
    this.factory = new ApplicationFactory({ fetch: this.fetch, randomUUID: dependencies.randomUUID });
  }

  private async bootstrap(): Promise<void> {
    this.authorizationAgentIri = await discoverAuthorizationAgent(this.webId, this.fetch);
    const applicationRegistrationIri = await discoverAgentRegistration(this.authorizationAgentIri, this.rawFetch);
    if (applicationRegistrationIri) {
      this.hasApplicationRegistration = await this.factory.readable.applicationRegistration(applicationRegistrationIri);
    }
    this.authorizationRedirectEndpoint = await discoverAuthorizationRedirectEndpoint(
      this.authorizationAgentIri,
      this.rawFetch
    );
  }

  get authorizationRedirectUri(): string {
    return `${this.authorizationRedirectEndpoint}?client_id=${encodeURIComponent(this.applicationId)}`;
  }

  getShareUri(resourceIri: string): string {
    return `${this.authorizationRedirectEndpoint}?resource=${encodeURIComponent(
      resourceIri
    )}&client_id=${encodeURIComponent(this.applicationId)}`;
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
